# Python Testing with pytest

## Core Principles

- Use `pytest`, not `unittest`. pytest's `assert` rewriting provides rich diffs without custom assertion methods.
- Tests are functions, not classes (unless you need shared setup via `unittest.TestCase` compatibility).
- Fixtures replace setup/teardown with composable dependency injection.
- Parametrize replaces loops in tests with declarative input matrices.

## Fixtures

### Basic Fixtures

```python
import pytest
from pathlib import Path

@pytest.fixture
def sample_config() -> dict[str, str]:
    return {"host": "localhost", "port": "5432"}

@pytest.fixture
def tmp_data_dir(tmp_path: Path) -> Path:
    """Create a temporary directory with test data files."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    (data_dir / "input.json").write_text('{"key": "value"}')
    return data_dir

def test_load_config(sample_config: dict[str, str]) -> None:
    config = Config.from_dict(sample_config)
    assert config.host == "localhost"
    assert config.port == 5432
```

### Fixture Scopes

```python
@pytest.fixture(scope="session")
def db_engine():
    """One engine for the entire test session."""
    engine = create_engine(TEST_DB_URL)
    yield engine
    engine.dispose()

@pytest.fixture(scope="function")  # default
def db_session(db_engine):
    """Fresh session per test, rolled back after."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()
```

### Factory Fixtures

```python
@pytest.fixture
def make_user():
    """Factory fixture for creating test users with defaults."""
    created: list[User] = []

    def _make(name: str = "Test User", email: str | None = None) -> User:
        user = User(name=name, email=email or f"{name.lower().replace(' ', '.')}@test.com")
        created.append(user)
        return user

    yield _make

    # Cleanup all created users
    for user in created:
        user.delete()

def test_user_creation(make_user):
    user1 = make_user("Alice")
    user2 = make_user("Bob", email="bob@custom.com")
    assert user1.email == "alice@test.com"
    assert user2.email == "bob@custom.com"
```

## Parametrize

### Basic Parametrize

```python
@pytest.mark.parametrize(
    "input_str, expected",
    [
        ("hello", "HELLO"),
        ("world", "WORLD"),
        ("", ""),
        ("123", "123"),
        ("hello world", "HELLO WORLD"),
    ],
)
def test_uppercase(input_str: str, expected: str) -> None:
    assert input_str.upper() == expected
```

### Parametrize with IDs

```python
@pytest.mark.parametrize(
    "status_code, should_retry",
    [
        pytest.param(200, False, id="success"),
        pytest.param(429, True, id="rate-limited"),
        pytest.param(500, True, id="server-error"),
        pytest.param(404, False, id="not-found"),
        pytest.param(503, True, id="unavailable"),
    ],
)
def test_retry_policy(status_code: int, should_retry: bool) -> None:
    assert retry_policy.should_retry(status_code) == should_retry
```

### Parametrize with Exceptions

```python
@pytest.mark.parametrize(
    "input_val, expected_error",
    [
        (-1, ValueError),
        ("abc", TypeError),
        (None, TypeError),
    ],
)
def test_validation_errors(input_val, expected_error):
    with pytest.raises(expected_error):
        validate(input_val)
```

## Async Testing

```toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

```python
async def test_async_fetch(httpx_mock):
    httpx_mock.add_response(json={"status": "ok"})
    result = await fetch_status("http://test.com/status")
    assert result.status == "ok"

@pytest.fixture
async def async_db():
    pool = await asyncpg.create_pool(TEST_DB_URL)
    yield pool
    await pool.close()

async def test_async_repository(async_db):
    repo = UserRepository(async_db)
    user = await repo.create(name="Alice")
    found = await repo.get(user.id)
    assert found.name == "Alice"
```

## Mocking

### Prefer dependency injection over patching

```python
# BETTER: inject the dependency
def test_send_email(make_user):
    mock_mailer = Mock(spec=EmailService)
    service = UserService(mailer=mock_mailer)
    service.register(make_user())
    mock_mailer.send.assert_called_once()

# WORSE: monkey-patch a global
def test_send_email_patched(monkeypatch):
    mock_send = Mock()
    monkeypatch.setattr("myapp.email.send", mock_send)
    register_user(make_user())
    mock_send.assert_called_once()
```

### Time Mocking

```python
# Use time-machine (faster than freezegun)
import time_machine

@time_machine.travel("2025-01-15 10:00:00")
def test_expiry_check():
    token = Token(expires_at=datetime(2025, 1, 15, 9, 0, 0))
    assert token.is_expired()

@time_machine.travel("2025-01-15 08:00:00")
def test_not_expired():
    token = Token(expires_at=datetime(2025, 1, 15, 9, 0, 0))
    assert not token.is_expired()
```

## Coverage Configuration

```toml
# pyproject.toml
[tool.coverage.run]
source = ["src"]
branch = true
omit = ["*/tests/*", "*/migrations/*"]

[tool.coverage.report]
fail_under = 85
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "if __name__ == .__main__.",
    "@overload",
]
```

## conftest.py Organization

```
tests/
  conftest.py          # Shared fixtures (db, client, factories)
  unit/
    conftest.py        # Unit-specific fixtures (mocks)
    test_models.py
    test_services.py
  integration/
    conftest.py        # Integration fixtures (real db, real redis)
    test_api.py
    test_repository.py
```

Place fixtures at the highest `conftest.py` where they are needed. Do not put all fixtures in the root — it couples unrelated test modules.
