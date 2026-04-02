# Testing Reference

## Test Organization

### Directory Structure

```
project/
  app_name/
    tests/
      __init__.py
      test_serializers.py
      test_views.py
      test_permissions.py
      test_filters.py
      factories.py
```

Keep tests next to the app they test. Use `factories.py` for shared test data
generators. Run with `python manage.py test` or `pytest`.

## APITestCase

### Basic Setup

```python
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

User = get_user_model()


class ProductViewSetTest(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        """Runs once for the test class. Use for read-only data."""
        cls.admin = User.objects.create_superuser(
            username="admin", password="testpass123"
        )
        cls.user = User.objects.create_user(
            username="alice", password="testpass123"
        )

    def setUp(self) -> None:
        """Runs before each test method."""
        self.client = APIClient()
```

### Authentication in Tests

```python
# Token-based
self.client.credentials(HTTP_AUTHORIZATION="Token " + self.token.key)

# Force authentication (skips token/password checking)
self.client.force_authenticate(user=self.user)

# JWT
from rest_framework_simplejwt.tokens import RefreshToken
refresh = RefreshToken.for_user(self.user)
self.client.credentials(
    HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
)

# Clear authentication
self.client.force_authenticate(user=None)
```

### Testing CRUD Operations

```python
def test_list_products(self) -> None:
    Product.objects.create(name="Widget", price=9.99)
    Product.objects.create(name="Gadget", price=19.99)

    self.client.force_authenticate(user=self.user)
    response = self.client.get("/api/v1/products/")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data["results"]), 2)

def test_create_product(self) -> None:
    self.client.force_authenticate(user=self.admin)
    response = self.client.post(
        "/api/v1/products/",
        {"name": "New Product", "price": "29.99", "category": self.category.pk},
        format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(Product.objects.count(), 1)
    self.assertEqual(response.data["name"], "New Product")

def test_update_product(self) -> None:
    product = Product.objects.create(name="Old Name", price=9.99)
    self.client.force_authenticate(user=self.admin)

    response = self.client.patch(
        f"/api/v1/products/{product.pk}/",
        {"name": "New Name"},
        format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    product.refresh_from_db()
    self.assertEqual(product.name, "New Name")

def test_delete_product(self) -> None:
    product = Product.objects.create(name="Doomed", price=1.00)
    self.client.force_authenticate(user=self.admin)

    response = self.client.delete(f"/api/v1/products/{product.pk}/")
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    self.assertFalse(Product.objects.filter(pk=product.pk).exists())
```

## Testing Permissions

```python
class PermissionTest(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.owner = User.objects.create_user(username="owner", password="test123")
        cls.other = User.objects.create_user(username="other", password="test123")
        cls.project = Project.objects.create(name="Secret", owner=cls.owner)

    def test_owner_can_update(self) -> None:
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/v1/projects/{self.project.pk}/",
            {"name": "Renamed"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_non_owner_cannot_update(self) -> None:
        self.client.force_authenticate(user=self.other)
        response = self.client.patch(
            f"/api/v1/projects/{self.project.pk}/",
            {"name": "Hacked"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_denied(self) -> None:
        response = self.client.get("/api/v1/projects/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

## Testing Serializers in Isolation

```python
class ProductSerializerTest(APITestCase):
    def test_valid_data(self) -> None:
        data = {"name": "Widget", "price": "9.99", "category": self.category.pk}
        serializer = ProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_negative_price_rejected(self) -> None:
        data = {"name": "Widget", "price": "-5.00", "category": self.category.pk}
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("price", serializer.errors)

    def test_read_representation(self) -> None:
        product = Product.objects.create(
            name="Widget", price=9.99, category=self.category
        )
        serializer = ProductSerializer(product)
        self.assertEqual(serializer.data["name"], "Widget")
        self.assertEqual(serializer.data["category_name"], self.category.name)
```

## factory_boy Integration

### Factory Definition

```python
import factory
from django.contrib.auth import get_user_model

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user_{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    password = factory.PostGenerationMethodCall("set_password", "testpass123")


class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "products.Product"

    name = factory.Faker("word")
    price = factory.Faker("pydecimal", left_digits=3, right_digits=2, positive=True)
    category = factory.SubFactory("products.tests.factories.CategoryFactory")
```

### Using Factories in Tests

```python
def test_list_returns_user_products(self) -> None:
    user = UserFactory()
    ProductFactory.create_batch(5, owner=user)
    ProductFactory.create_batch(3)  # other user's products

    self.client.force_authenticate(user=user)
    response = self.client.get("/api/v1/products/")

    self.assertEqual(len(response.data["results"]), 5)
```

## Database Strategies

- Use `setUpTestData` for read-only fixtures shared across test methods (faster).
- Use `setUp` for data that each test method modifies.
- Django wraps each test in a transaction and rolls back automatically.
- For tests that need `transaction.atomic()` to actually commit, use
  `TransactionTestCase` instead of `TestCase`.

## Asserting Response Structure

```python
def test_response_shape(self) -> None:
    response = self.client.get("/api/v1/products/")
    self.assertIn("results", response.data)
    self.assertIn("count", response.data)

    product = response.data["results"][0]
    expected_keys = {"id", "name", "price", "category_name", "created_at"}
    self.assertEqual(set(product.keys()), expected_keys)
```

## pytest-django Integration

```python
# conftest.py
import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


# test_views.py
@pytest.mark.django_db
def test_list_products(authenticated_client, product_factory):
    product_factory.create_batch(5)
    response = authenticated_client.get("/api/v1/products/")
    assert response.status_code == 200
    assert len(response.data["results"]) == 5
```
