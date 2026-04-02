# Filtering and Pagination Reference

## django-filter Integration

### Installation and Configuration

```python
# settings.py
INSTALLED_APPS = [
    ...
    "django_filters",
]

REST_FRAMEWORK = {
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}
```

### FilterSet Definition

Define FilterSet classes instead of using `filterset_fields` on the ViewSet.
FilterSet classes are testable, composable, and support custom filter methods.

```python
import django_filters
from products.models import Product


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    category = django_filters.CharFilter(field_name="category__slug")
    created_after = django_filters.DateFilter(
        field_name="created_at", lookup_expr="gte"
    )
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    class Meta:
        model = Product
        fields = ["category", "min_price", "max_price", "created_after", "in_stock"]

    def filter_in_stock(self, queryset, name, value):
        if value is True:
            return queryset.filter(stock_quantity__gt=0)
        return queryset.filter(stock_quantity=0)
```

### Using FilterSet in ViewSet

```python
class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    filterset_class = ProductFilter

    def get_queryset(self):
        return Product.objects.select_related("category")
```

### Query Parameter Examples

```
GET /api/v1/products/?category=electronics&min_price=50&max_price=500
GET /api/v1/products/?in_stock=true&created_after=2025-01-01
```

## Search Filter

SearchFilter performs case-insensitive partial matches across specified fields.

```python
class ProductViewSet(viewsets.ModelViewSet):
    search_fields = [
        "name",            # icontains on name
        "description",     # icontains on description
        "=sku",            # exact match on sku
        "^name",           # istartswith on name
        "@description",    # full-text search (PostgreSQL)
        "category__name",  # related field search
    ]
```

```
GET /api/v1/products/?search=wireless+headphones
```

## Ordering Filter

```python
class ProductViewSet(viewsets.ModelViewSet):
    ordering_fields = ["price", "created_at", "name"]
    ordering = ["-created_at"]  # default ordering
```

```
GET /api/v1/products/?ordering=price
GET /api/v1/products/?ordering=-created_at,name
```

## Pagination

### Global Configuration

Set a project-wide default and override per-viewset when needed.

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
}
```

### PageNumberPagination

Simple page-based pagination. Good for UIs with numbered page links.

```python
from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100
```

Response shape:

```json
{
    "count": 142,
    "next": "https://api.example.com/products/?page=3",
    "previous": "https://api.example.com/products/?page=1",
    "results": [...]
}
```

### LimitOffsetPagination

Offset-based pagination. Useful for APIs consumed by clients that manage
their own offset tracking.

```python
from rest_framework.pagination import LimitOffsetPagination


class LargeResultPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 200
```

```
GET /api/v1/products/?limit=50&offset=100
```

### CursorPagination

Cursor-based pagination. Efficient for large datasets because it does not
require counting total rows. Best for infinite-scroll UIs.

```python
from rest_framework.pagination import CursorPagination


class TimelinePagination(CursorPagination):
    page_size = 20
    ordering = "-created_at"
    cursor_query_param = "cursor"
```

Response shape:

```json
{
    "next": "https://api.example.com/feed/?cursor=cD0yMDI1LTAxLTE1",
    "previous": null,
    "results": [...]
}
```

Advantages over offset pagination:
- Consistent results when new items are added during pagination.
- O(1) query cost regardless of page depth (no OFFSET scan).
- No count query needed.

Limitations:
- Cannot jump to arbitrary pages.
- Requires a unique, sequential ordering field.

### Per-ViewSet Pagination

```python
class ProductViewSet(viewsets.ModelViewSet):
    pagination_class = StandardPagination

class FeedViewSet(viewsets.ModelViewSet):
    pagination_class = TimelinePagination

class ReportViewSet(viewsets.ModelViewSet):
    pagination_class = None  # disable pagination for small result sets
```

## Custom Filter Backend

For advanced filtering that does not fit django-filter's model-based approach.

```python
from rest_framework.filters import BaseFilterBackend


class TenantFilterBackend(BaseFilterBackend):
    """Automatically scope all querysets to the current tenant."""

    def filter_queryset(self, request, queryset, view):
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            return queryset.filter(tenant_id=tenant_id)
        return queryset.none()
```

```python
# Apply globally
REST_FRAMEWORK = {
    "DEFAULT_FILTER_BACKENDS": [
        "core.filters.TenantFilterBackend",
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
}
```

## Query Parameter Validation

Always validate query parameters. Unvalidated parameters can be used to
probe internal field names or trigger expensive lookups.

```python
class ProductFilter(django_filters.FilterSet):
    class Meta:
        model = Product
        fields = {
            "price": ["gte", "lte"],
            "category__slug": ["exact"],
            "created_at": ["gte", "lte"],
        }
        # Only these fields and lookups are allowed.
        # Any other query parameter is silently ignored.
```
