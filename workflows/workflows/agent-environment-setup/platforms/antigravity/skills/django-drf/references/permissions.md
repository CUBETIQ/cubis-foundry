# Permissions Reference

## Built-in Permission Classes

DRF ships several permission classes. Combine them with bitwise OR or replace
them with custom classes.

```python
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
    IsAdminUser,
    IsAuthenticatedOrReadOnly,
    DjangoModelPermissions,
    DjangoObjectPermissions,
)
```

| Class | Behavior |
|-------|----------|
| `AllowAny` | No restrictions. Use for public endpoints. |
| `IsAuthenticated` | Rejects anonymous users. |
| `IsAdminUser` | Requires `user.is_staff == True`. |
| `IsAuthenticatedOrReadOnly` | Anonymous users can GET/HEAD/OPTIONS only. |
| `DjangoModelPermissions` | Maps view actions to Django's `add_`, `change_`, `delete_` perms. |
| `DjangoObjectPermissions` | Like DjangoModelPermissions but checks per-object via `has_perm`. |

## Custom Permission Classes

### View-Level Permission

`has_permission` runs before the view handler. Use it for access checks that
do not depend on a specific object.

```python
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class IsVerifiedUser(BasePermission):
    """Only allow users who have verified their email."""

    message = "Email verification required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return (
            request.user
            and request.user.is_authenticated
            and request.user.email_verified
        )
```

### Object-Level Permission

`has_object_permission` runs when `self.get_object()` is called (retrieve,
update, partial_update, destroy). It does NOT run on list actions.

```python
class IsOwnerOrReadOnly(BasePermission):
    """
    Read access for any authenticated user.
    Write access only for the object owner.
    """

    def has_object_permission(self, request: Request, view: APIView, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return obj.owner == request.user
```

### Composing Permissions

Combine multiple permission classes. All must return True (AND logic).

```python
class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
```

For OR logic, create a composite permission:

```python
class IsAdminOrOwner(BasePermission):
    def has_object_permission(self, request, view, obj) -> bool:
        return request.user.is_staff or obj.owner == request.user
```

### Per-Action Permissions

Override `get_permissions()` to apply different permissions per action.

```python
class ArticleViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        if self.action == "create":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrReadOnly()]
```

## Role-Based Access Control

### Model-Level Roles

```python
class Membership(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"
        VIEWER = "viewer", "Viewer"

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=Role.choices)
```

### Role Permission Class

```python
class HasOrganizationRole(BasePermission):
    """Check that the user has a specific role in the resource's organization."""

    required_roles: tuple[str, ...] = ()

    def has_object_permission(self, request, view, obj) -> bool:
        org = getattr(obj, "organization", None)
        if org is None:
            return False

        return Membership.objects.filter(
            user=request.user,
            organization=org,
            role__in=self.required_roles,
        ).exists()


class IsOrgAdmin(HasOrganizationRole):
    required_roles = (Membership.Role.OWNER, Membership.Role.ADMIN)


class IsOrgMember(HasOrganizationRole):
    required_roles = (
        Membership.Role.OWNER,
        Membership.Role.ADMIN,
        Membership.Role.MEMBER,
    )
```

## Queryset Scoping as Authorization

The first line of defense is filtering the queryset so users never see
objects they should not access.

```python
def get_queryset(self) -> QuerySet[Project]:
    """Users only see projects in their organizations."""
    return Project.objects.filter(
        organization__members=self.request.user
    ).distinct()
```

This prevents enumeration attacks where an attacker guesses object IDs.
Even if `has_object_permission` checks ownership, a scoped queryset returns
404 instead of 403, leaking no information about object existence.

## Authentication Backends

### Token Authentication

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
}
```

### JWT Authentication (SimpleJWT)

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
```

### Session Authentication (for browsable API during development)

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",  # dev only
    ],
}
```

## Throttling

### Configuration

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "20/minute",
        "user": "100/minute",
    },
}
```

### Custom Throttle

```python
from rest_framework.throttling import UserRateThrottle


class BurstRateThrottle(UserRateThrottle):
    scope = "burst"
    rate = "10/second"


class SustainedRateThrottle(UserRateThrottle):
    scope = "sustained"
    rate = "1000/day"
```

### Per-View Throttling

```python
class LoginView(APIView):
    throttle_classes = [AnonRateThrottle]
    throttle_scope = "login"

# settings.py
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_RATES": {
        "login": "5/minute",
    },
}
```
