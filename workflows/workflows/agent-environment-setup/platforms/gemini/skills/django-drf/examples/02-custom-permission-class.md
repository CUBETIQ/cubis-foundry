# Example: Custom Permission Class with Object-Level Authorization

## Scenario

Implement an `IsOwnerOrReadOnly` permission that allows any authenticated user to read resources but restricts create, update, and delete to the resource owner. Integrate it with a `ProjectViewSet` scoped by organization and write tests that verify both allowed and denied access.

## Permission Class

```python
# projects/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.request import Request
from rest_framework.views import APIView


class IsOwnerOrReadOnly(BasePermission):
    """
    Read-only access for any authenticated user.
    Write access only for the object owner.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        # Allow all authenticated users to access the view.
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request: Request, view: APIView, obj) -> bool:
        # SAFE_METHODS: GET, HEAD, OPTIONS.
        if request.method in SAFE_METHODS:
            return True

        # Write operations require ownership.
        return obj.owner == request.user
```

## Model

```python
# projects/models.py
from django.conf import settings
from django.db import models


class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through="Membership", related_name="organizations"
    )

    def __str__(self) -> str:
        return self.name


class Membership(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"
        VIEWER = "viewer", "Viewer"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)

    class Meta:
        unique_together = ("user", "organization")


class Project(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="projects"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_projects"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name
```

## Serializer

```python
# projects/serializers.py
from rest_framework import serializers

from projects.models import Project


class ProjectSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "owner_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner_username", "created_at", "updated_at"]
```

## ViewSet

```python
# projects/views.py
from django.db.models import QuerySet
from rest_framework import viewsets

from projects.models import Project
from projects.permissions import IsOwnerOrReadOnly
from projects.serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self) -> QuerySet[Project]:
        """Scope projects to the authenticated user's organizations."""
        return (
            Project.objects.filter(
                organization__members=self.request.user
            )
            .select_related("owner", "organization")
            .distinct()
        )

    def perform_create(self, serializer) -> None:
        serializer.save(owner=self.request.user)
```

## Router Registration

```python
# projects/urls.py
from rest_framework.routers import DefaultRouter

from projects.views import ProjectViewSet

router = DefaultRouter()
router.register("projects", ProjectViewSet, basename="project")

urlpatterns = router.urls
```

## Tests

```python
# projects/tests/test_permissions.py
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from projects.models import Membership, Organization, Project

User = get_user_model()


class IsOwnerOrReadOnlyTest(APITestCase):
    """Verify that owners can write, other members can only read."""

    @classmethod
    def setUpTestData(cls) -> None:
        cls.org = Organization.objects.create(name="Acme", slug="acme")

        cls.owner = User.objects.create_user(username="alice", password="testpass123")
        Membership.objects.create(
            user=cls.owner, organization=cls.org, role=Membership.Role.ADMIN
        )

        cls.member = User.objects.create_user(username="bob", password="testpass123")
        Membership.objects.create(
            user=cls.member, organization=cls.org, role=Membership.Role.MEMBER
        )

        cls.outsider = User.objects.create_user(username="eve", password="testpass123")

        cls.project = Project.objects.create(
            name="Secret Project",
            description="Top secret",
            organization=cls.org,
            owner=cls.owner,
        )

    def setUp(self) -> None:
        self.client = APIClient()

    def test_owner_can_update_project(self) -> None:
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/v1/projects/{self.project.pk}/",
            {"name": "Renamed Project"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.name, "Renamed Project")

    def test_member_can_read_project(self) -> None:
        self.client.force_authenticate(user=self.member)
        response = self.client.get(f"/api/v1/projects/{self.project.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Secret Project")

    def test_member_cannot_update_project(self) -> None:
        self.client.force_authenticate(user=self.member)
        response = self.client.patch(
            f"/api/v1/projects/{self.project.pk}/",
            {"name": "Hacked Name"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_outsider_cannot_see_project(self) -> None:
        self.client.force_authenticate(user=self.outsider)
        response = self.client.get(f"/api/v1/projects/{self.project.pk}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_user_is_denied(self) -> None:
        response = self.client.get("/api/v1/projects/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

## Key Decisions

- **Two-layer authorization**: `get_queryset()` filters by organization membership (users never see projects outside their orgs), and `has_object_permission` enforces ownership on writes. Defense in depth.
- **`SAFE_METHODS` check**: GET, HEAD, and OPTIONS are read-only and permitted for all authenticated members.
- **`perform_create` sets owner**: The owner is always the authenticated user, preventing spoofing through the request body.
- **`distinct()` in queryset**: Necessary because a user could be a member of the same organization through multiple memberships (future-proofing).
- **Test coverage**: Covers owner-write, member-read, member-denied-write, outsider-404, and unauthenticated-403 -- the five most critical authorization paths.
