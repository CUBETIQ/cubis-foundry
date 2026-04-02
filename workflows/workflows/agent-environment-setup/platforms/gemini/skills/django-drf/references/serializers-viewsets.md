# Serializers and ViewSets Reference

## ModelSerializer

### Basic Definition

ModelSerializer generates fields, validators, and `create()`/`update()` methods
from the Django model. Override only when the default behavior is wrong.

```python
from rest_framework import serializers
from products.models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "price", "category", "created_at"]
        read_only_fields = ["id", "created_at"]
```

### Explicit Field Declaration

Override auto-generated fields when you need custom sources, formats, or validation.

```python
class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    price_display = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "price", "category_name", "price_display"]

    def get_price_display(self, obj: Product) -> str:
        return f"${obj.price:.2f}"
```

## Nested Serializers

### Read-Only Nesting

For read responses, nest a serializer as a field. Mark it `read_only=True`
to prevent DRF from trying to create/update the nested object.

```python
class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ["id", "name", "email"]


class ArticleSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)

    class Meta:
        model = Article
        fields = ["id", "title", "content", "author", "created_at"]
```

### Writable Nested Serializers

Override `create()` and `update()` to handle nested writes explicitly.

```python
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ["id", "customer", "items", "status"]

    def create(self, validated_data: dict) -> Order:
        items_data = validated_data.pop("items")
        order = Order.objects.create(**validated_data)
        OrderItem.objects.bulk_create(
            [OrderItem(order=order, **item) for item in items_data]
        )
        return order

    def update(self, instance: Order, validated_data: dict) -> Order:
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            OrderItem.objects.bulk_create(
                [OrderItem(order=instance, **item) for item in items_data]
            )

        return instance
```

### Depth Control

Avoid `depth` in Meta. It auto-expands all relationships to the specified depth,
which produces unpredictable schemas and triggers uncontrolled joins.

```python
# BAD: unpredictable expansion
class Meta:
    model = Article
    fields = "__all__"
    depth = 2

# GOOD: explicit nesting
class ArticleSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)  # controlled shape
```

## Validation

### Field-Level Validation

```python
class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=12, write_only=True)

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value.lower()
```

### Object-Level Validation

```python
class DateRangeSerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()

    def validate(self, attrs: dict) -> dict:
        if attrs["end_date"] <= attrs["start_date"]:
            raise serializers.ValidationError("end_date must be after start_date.")
        return attrs
```

## ViewSets

### ModelViewSet

Provides `list`, `create`, `retrieve`, `update`, `partial_update`, and `destroy`.

```python
from rest_framework import viewsets
from products.models import Product
from products.serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
```

### Selective Mixins

When you do not need all CRUD actions, compose from individual mixins.

```python
from rest_framework import mixins, viewsets


class ProductViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Read-only product endpoint."""
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
```

### Custom Actions

Use `@action` for endpoints that belong to the viewset but are not standard CRUD.

```python
from rest_framework.decorators import action
from rest_framework.response import Response


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_order(self, request, pk=None):
        order = self.get_object()
        order.cancel()
        return Response({"status": "cancelled"})

    @action(detail=False, methods=["get"])
    def recent(self, request):
        recent = self.get_queryset().order_by("-created_at")[:10]
        serializer = self.get_serializer(recent, many=True)
        return Response(serializer.data)
```

## Router Registration

### DefaultRouter

```python
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = router.urls
```

### Nested Routers

Use `drf-nested-routers` for parent-child URL patterns.

```python
from rest_framework_nested import routers

parent_router = routers.DefaultRouter()
parent_router.register("orders", OrderViewSet, basename="order")

items_router = routers.NestedDefaultRouter(parent_router, "orders", lookup="order")
items_router.register("items", OrderItemViewSet, basename="order-items")

urlpatterns = parent_router.urls + items_router.urls
# Generates: /orders/{order_pk}/items/ and /orders/{order_pk}/items/{pk}/
```

## Queryset Optimization

### get_queryset Override

Always override `get_queryset()` instead of setting `queryset` as a class attribute
when the query depends on the request (user scoping, filtering).

```python
def get_queryset(self) -> QuerySet[Order]:
    return (
        Order.objects
        .filter(customer__user=self.request.user)
        .select_related("customer")
        .prefetch_related("items__product")
    )
```

### Action-Specific Optimization

Use different prefetch strategies for list vs detail views.

```python
def get_queryset(self) -> QuerySet[BlogPost]:
    qs = BlogPost.objects.select_related("author__user")
    if self.action == "list":
        return qs.annotate(comment_count=Count("comments"))
    return qs.prefetch_related("comments__user")
```
