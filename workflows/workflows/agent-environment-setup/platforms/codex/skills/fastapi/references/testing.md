# Testing

## Test Architecture

| Layer | Tool | Scope | Speed |
|-------|------|-------|-------|
| Unit | `pytest` + mocks | Single function or class | < 10ms |
| Integration | `httpx.AsyncClient` + test DB | Endpoint with real dependencies | 50-200ms |
| E2E | `httpx.AsyncClient` + Testcontainers | Full stack with real database | 500ms-2s |

## Async Test Setup

```python
# conftest.py
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.models.base import Base
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionFactory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session():
    async with TestSessionFactory() as session:
        yield session

@pytest.fixture
def fake_user():
    return type("User", (), {"id": 1, "email": "test@test.com", "is_active": True})()

@pytest.fixture
async def client(fake_user):
    async def override_get_db():
        async with TestSessionFactory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: fake_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
```

## Writing Async Tests

```python
# tests/test_users.py
import pytest

@pytest.mark.anyio
async def test_create_user(client: AsyncClient):
    response = await client.post(
        "/users/",
        json={
            "email": "new@example.com",
            "password": "SecurePass123",
            "full_name": "Test User",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert "password" not in data  # Response model excludes password
    assert "id" in data

@pytest.mark.anyio
async def test_create_user_invalid_email(client: AsyncClient):
    response = await client.post(
        "/users/",
        json={
            "email": "not-an-email",
            "password": "SecurePass123",
            "full_name": "Test User",
        },
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any("email" in str(err).lower() for err in detail)

@pytest.mark.anyio
async def test_get_current_user(client: AsyncClient):
    response = await client.get("/users/me")

    assert response.status_code == 200
    assert response.json()["email"] == "test@test.com"
```

## Dependency Override Patterns

### Override Database

```python
async def override_get_db():
    async with TestSessionFactory() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db
```

### Override Authentication

```python
# Test as specific user
def override_auth():
    return User(id=1, email="admin@test.com", role="admin")

app.dependency_overrides[get_current_user] = override_auth

# Test as unauthenticated (remove override to use real auth)
del app.dependency_overrides[get_current_user]
```

### Override External Service

```python
from unittest.mock import AsyncMock

mock_payment_service = AsyncMock()
mock_payment_service.charge.return_value = {"status": "success", "transaction_id": "txn-123"}

app.dependency_overrides[get_payment_service] = lambda: mock_payment_service
```

## Testing Background Tasks

BackgroundTasks run inline during tests (same event loop), but you can verify they were called.

```python
@pytest.mark.anyio
async def test_order_triggers_notification(client: AsyncClient, mocker):
    mock_send = mocker.patch("app.services.notification.send_notification", new_callable=AsyncMock)

    response = await client.post("/orders/", json={"item_id": 1, "quantity": 2})

    assert response.status_code == 201
    # Background task runs synchronously in test
    mock_send.assert_called_once_with(user_id=1, message="Order confirmed")
```

## Testing WebSocket Endpoints

```python
@pytest.mark.anyio
async def test_websocket_chat():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        async with client.stream("GET", "/ws") as ws:
            # WebSocket testing requires a different approach
            pass

# Alternative: use the built-in TestClient for WebSocket
from fastapi.testclient import TestClient

def test_websocket_echo():
    client = TestClient(app)
    with client.websocket_connect("/ws") as websocket:
        websocket.send_json({"message": "hello"})
        data = websocket.receive_json()
        assert data["message"] == "hello"
```

## Factory Fixtures

```python
# conftest.py
@pytest.fixture
def user_factory(db_session: AsyncSession):
    async def create_user(
        email: str = "test@test.com",
        full_name: str = "Test User",
        is_active: bool = True,
    ) -> User:
        user = User(email=email, full_name=full_name, is_active=is_active)
        user.password_hash = hash_password("TestPass123")
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user

    return create_user

@pytest.mark.anyio
async def test_user_list(client: AsyncClient, user_factory):
    await user_factory(email="user1@test.com")
    await user_factory(email="user2@test.com")

    response = await client.get("/users/")

    assert response.status_code == 200
    assert len(response.json()) == 2
```

## Testcontainers for Real Database

```python
import pytest
from testcontainers.postgres import PostgresContainer

@pytest.fixture(scope="session")
def postgres_url():
    with PostgresContainer("postgres:16") as postgres:
        yield postgres.get_connection_url().replace("psycopg2", "asyncpg")

@pytest.fixture(scope="session")
async def real_engine(postgres_url):
    engine = create_async_engine(postgres_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()
```

## pytest Configuration

```ini
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
filterwarnings = [
    "ignore::DeprecationWarning",
]

[tool.anyio]
backend = "asyncio"
```

## Coverage

```bash
pytest --cov=app --cov-report=term-missing --cov-branch tests/
```

Target 80%+ line coverage and 70%+ branch coverage for production APIs.
