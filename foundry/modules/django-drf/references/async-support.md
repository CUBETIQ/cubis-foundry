# Async Support Reference

## Django 5.1 Async Views

Django 5.1 supports async views natively. Use `async def` for view functions
and ViewSet methods that perform I/O-bound work.

### When to Use Async

Use async views when:
- The view makes external HTTP calls (API gateways, webhooks).
- The view performs multiple independent database queries that can run concurrently.
- The view handles WebSocket or long-polling connections.
- The application is under high concurrency and thread-pool exhaustion is a risk.

Do NOT use async when:
- The view is CPU-bound (use a task queue instead).
- The view performs a single simple database query (async overhead exceeds benefit).
- The team is not comfortable debugging async stack traces.

## Async Views in DRF

### Async APIView

```python
import httpx
from rest_framework.response import Response
from rest_framework.views import APIView


class ExternalDataView(APIView):
    async def get(self, request):
        async with httpx.AsyncClient() as client:
            response = await client.get("https://api.example.com/data")
            data = response.json()
        return Response(data)
```

### Async ViewSet Methods

As of DRF 3.15+, ViewSet actions can be async. Override individual actions.

```python
from rest_framework import viewsets
from rest_framework.response import Response


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer

    async def list(self, request):
        products = [p async for p in Product.objects.all()]
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
```

## Async ORM (Django 5.1+)

Django 5.1 provides async versions of most ORM methods. They are prefixed with
`a` or available as async iterators.

### Async QuerySet Methods

```python
# Async get
product = await Product.objects.aget(pk=product_id)

# Async filter + first
product = await Product.objects.filter(category="electronics").afirst()

# Async create
product = await Product.objects.acreate(
    name="Widget",
    price=9.99,
    category=category,
)

# Async update
await Product.objects.filter(pk=product_id).aupdate(price=12.99)

# Async delete
await Product.objects.filter(is_archived=True).adelete()

# Async count
count = await Product.objects.filter(in_stock=True).acount()

# Async exists
exists = await Product.objects.filter(sku="WDG-001").aexists()

# Async aggregate
from django.db.models import Avg
avg_price = await Product.objects.aaggregate(avg=Avg("price"))
```

### Async Iteration

```python
# Async for loop over queryset
async for product in Product.objects.filter(in_stock=True):
    await process_product(product)

# Async list comprehension
products = [p async for p in Product.objects.select_related("category").all()]
```

### Async Related Object Access

```python
# Prefetch to avoid lazy-loading in async context
products = Product.objects.prefetch_related("category")
async for product in products:
    # category is already loaded, no additional query
    print(product.category.name)
```

### Limitations

- `select_related` works with async iteration.
- `prefetch_related` works with async iteration.
- Lazy loading of related objects in async context raises
  `SynchronousOnlyOperation`. Always prefetch or select_related.
- Signals still run synchronously.
- Custom managers with sync-only methods need async wrappers.

## ASGI Configuration

### Setting Up ASGI

```python
# project/asgi.py
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
application = get_asgi_application()
```

### Running with Uvicorn

```bash
# Development
uvicorn project.asgi:application --reload --host 0.0.0.0 --port 8000

# Production
uvicorn project.asgi:application \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --loop uvloop \
    --http httptools \
    --log-level info
```

### Running with Daphne

```bash
daphne -b 0.0.0.0 -p 8000 project.asgi:application
```

### Running with Hypercorn

```bash
hypercorn project.asgi:application --bind 0.0.0.0:8000 --workers 4
```

## Async Middleware

Django 5.1 supports async middleware natively.

```python
class AsyncTimingMiddleware:
    async_capable = True

    def __init__(self, get_response):
        self.get_response = get_response

    async def __call__(self, request):
        import time
        start = time.perf_counter()

        response = await self.get_response(request)

        duration = time.perf_counter() - start
        response["X-Request-Duration"] = f"{duration:.4f}s"
        return response
```

## Concurrent Queries with asyncio.gather

Run independent queries concurrently to reduce total response time.

```python
import asyncio
from rest_framework.response import Response
from rest_framework.views import APIView


class DashboardView(APIView):
    async def get(self, request):
        # Run three independent queries concurrently
        orders_count, revenue, recent_orders = await asyncio.gather(
            Order.objects.filter(customer=request.user.customer).acount(),
            Order.objects.filter(
                customer=request.user.customer, status="paid"
            ).aaggregate(total=Sum("amount")),
            self._get_recent_orders(request.user),
        )

        return Response({
            "orders_count": orders_count,
            "total_revenue": revenue["total"] or 0,
            "recent_orders": recent_orders,
        })

    async def _get_recent_orders(self, user):
        orders = [
            {"id": o.id, "status": o.status, "amount": str(o.amount)}
            async for o in Order.objects.filter(
                customer=user.customer
            ).order_by("-created_at")[:5]
        ]
        return orders
```

## Async-Safe Caching

```python
from django.core.cache import cache


# Django 5.1 async cache API
value = await cache.aget("my_key")
await cache.aset("my_key", value, timeout=300)
await cache.adelete("my_key")
```

## Testing Async Views

```python
import pytest
from rest_framework.test import APIClient


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_async_product_list():
    # Create test data
    await Product.objects.acreate(name="Widget", price=9.99)

    client = APIClient()
    response = await client.get("/api/v1/products/")  # async test client
    assert response.status_code == 200


# Or use Django's AsyncClient
from django.test import AsyncClient


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_async_view():
    client = AsyncClient()
    response = await client.get("/api/v1/dashboard/")
    assert response.status_code == 200
```

## Migration Considerations

- Start by converting I/O-heavy views to async one at a time.
- Keep sync views for simple CRUD until the entire stack is async-ready.
- Replace `requests` with `httpx` for async HTTP calls.
- Replace synchronous cache calls with async cache API.
- Ensure all middleware in the stack is async-compatible or Django will
  run the entire request in a sync-to-async wrapper, negating benefits.
