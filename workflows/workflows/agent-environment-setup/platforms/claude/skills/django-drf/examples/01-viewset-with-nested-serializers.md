# Example: ViewSet with Nested Serializers

## Scenario

Build a DRF API endpoint for blog posts that returns author details and nested comments with commenter usernames. The response must avoid N+1 queries, use proper serializer nesting, and register through a router.

## Models

```python
# blog/models.py
from django.conf import settings
from django.db import models


class Author(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)

    class Meta:
        ordering = ["user__username"]

    def __str__(self) -> str:
        return self.user.get_full_name() or self.user.username


class BlogPost(models.Model):
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name="posts")
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    content = models.TextField()
    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class Comment(models.Model):
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments"
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Comment by {self.user.username} on {self.post.title}"
```

## Serializers

```python
# blog/serializers.py
from rest_framework import serializers

from blog.models import Author, BlogPost, Comment


class AuthorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = ["id", "username", "full_name", "bio"]

    def get_full_name(self, obj: Author) -> str:
        return obj.user.get_full_name() or obj.user.username


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "username", "text", "created_at"]
        read_only_fields = ["id", "username", "created_at"]


class BlogPostListSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = BlogPost
        fields = ["id", "title", "slug", "author", "comment_count", "created_at"]


class BlogPostDetailSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "content",
            "author",
            "comments",
            "created_at",
            "updated_at",
        ]
```

## ViewSet

```python
# blog/views.py
from django.db.models import Count, QuerySet
from rest_framework import permissions, viewsets

from blog.models import BlogPost
from blog.serializers import BlogPostDetailSerializer, BlogPostListSerializer


class BlogPostViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self) -> QuerySet[BlogPost]:
        qs = BlogPost.objects.select_related("author__user")

        if self.action == "list":
            return qs.filter(published=True).annotate(comment_count=Count("comments"))

        return qs.prefetch_related("comments__user").filter(published=True)

    def get_serializer_class(self):
        if self.action == "list":
            return BlogPostListSerializer
        return BlogPostDetailSerializer

    def perform_create(self, serializer) -> None:
        serializer.save(author=self.request.user.author)
```

## Router Registration

```python
# blog/urls.py
from rest_framework.routers import DefaultRouter

from blog.views import BlogPostViewSet

router = DefaultRouter()
router.register("posts", BlogPostViewSet, basename="blogpost")

urlpatterns = router.urls
```

```python
# project/urls.py
from django.urls import include, path

urlpatterns = [
    path("api/v1/blog/", include("blog.urls")),
]
```

## Key Decisions

- **Separate list/detail serializers**: The list view returns `comment_count` (cheap aggregate), while the detail view returns the full nested comments. This prevents over-fetching on listing pages.
- **`select_related("author__user")`**: Joins Author and User in a single query for every endpoint that renders author data.
- **`prefetch_related("comments__user")`**: Batches comment and commenter loading into two additional queries instead of N+1 per comment.
- **`lookup_field = "slug"`**: Uses slugs in URLs for human-readable API paths (`/api/v1/blog/posts/my-first-post/`).
- **`perform_create`**: Automatically assigns the current user as the post author, preventing author spoofing.
