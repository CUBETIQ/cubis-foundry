# Testing

Load this when writing ORM integration tests, fixture patterns, transaction rollback isolation, or factory setup for SQLAlchemy 2.0+.

## Test engine and session setup

```python
# conftest.py
import asyncio
import pytest
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from app.models import Base

TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test_db"


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def engine():
    """Create test engine once per session."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def session(engine):
    """Transaction-scoped session: rolls back after each test."""
    async with engine.connect() as conn:
        async with conn.begin() as transaction:
            session = AsyncSession(
                bind=conn,
                expire_on_commit=False,
                join_transaction_mode="create_savepoint",
            )
            yield session
            await session.close()
            await transaction.rollback()
```

### Why transaction rollback isolation

- Creating and dropping tables per test is slow (seconds per test).
- Transaction rollback is instant and guarantees isolation.
- Each test runs inside a savepoint. Rollback undoes all changes.
- Total speedup: 10-100x compared to table recreation.

## Testing models and queries

### Basic CRUD test

```python
@pytest.mark.asyncio
async def test_create_user(session: AsyncSession):
    user = User(email="test@example.com", display_name="Test User")
    session.add(user)
    await session.flush()

    assert user.id is not None
    assert user.created_at is not None


@pytest.mark.asyncio
async def test_query_user_by_email(session: AsyncSession):
    user = User(email="find@example.com", display_name="Find Me")
    session.add(user)
    await session.flush()

    stmt = select(User).where(User.email == "find@example.com")
    result = await session.execute(stmt)
    found = result.scalar_one()

    assert found.id == user.id
    assert found.display_name == "Find Me"
```

### Testing relationships

```python
@pytest.mark.asyncio
async def test_user_team_relationship(session: AsyncSession):
    team = Team(name="Engineering")
    session.add(team)
    await session.flush()

    user = User(email="dev@example.com", display_name="Dev", team_id=team.id)
    session.add(user)
    await session.flush()

    # Reload with relationship
    stmt = (
        select(User)
        .where(User.id == user.id)
        .options(joinedload(User.team))
    )
    result = await session.execute(stmt)
    loaded = result.scalar_one()

    assert loaded.team is not None
    assert loaded.team.name == "Engineering"


@pytest.mark.asyncio
async def test_team_members_collection(session: AsyncSession):
    team = Team(name="Design")
    session.add(team)
    await session.flush()

    for i in range(3):
        session.add(User(
            email=f"designer{i}@example.com",
            display_name=f"Designer {i}",
            team_id=team.id,
        ))
    await session.flush()

    stmt = (
        select(Team)
        .where(Team.id == team.id)
        .options(selectinload(Team.members))
    )
    result = await session.execute(stmt)
    loaded = result.scalar_one()

    assert len(loaded.members) == 3
```

## Factory patterns

### Simple factory function

```python
async def create_user(
    session: AsyncSession,
    email: str = "user@example.com",
    display_name: str = "Test User",
    is_active: bool = True,
    team_id: int | None = None,
) -> User:
    user = User(
        email=email,
        display_name=display_name,
        is_active=is_active,
        team_id=team_id,
    )
    session.add(user)
    await session.flush()
    return user
```

### Factory with `factory_boy` (optional)

```python
import factory
from factory.alchemy import SQLAlchemyModelFactory

class UserFactory(SQLAlchemyModelFactory):
    class Meta:
        model = User
        sqlalchemy_session = None  # Set per-test via fixture

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    display_name = factory.Faker("name")
    is_active = True
```

- Prefer simple factory functions for async. `factory_boy` has limited async support.
- Factory functions are explicit, type-safe, and easy to debug.

## Testing constraints and validation

```python
@pytest.mark.asyncio
async def test_unique_email_constraint(session: AsyncSession):
    await create_user(session, email="dupe@example.com")

    with pytest.raises(IntegrityError):
        await create_user(session, email="dupe@example.com")
    await session.rollback()


@pytest.mark.asyncio
async def test_non_nullable_constraint(session: AsyncSession):
    user = User(email=None, display_name="No Email")  # type: ignore
    session.add(user)

    with pytest.raises(IntegrityError):
        await session.flush()
    await session.rollback()
```

- Always test that constraints actually enforce what you expect.
- Call `session.rollback()` after expected constraint violations to reset session state.

## Testing Alembic migrations

```python
# test_migrations.py
import pytest
from alembic.config import Config
from alembic import command

@pytest.fixture
def alembic_config():
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    return config


def test_upgrade_to_head(alembic_config):
    """Full migration chain runs without errors."""
    command.upgrade(alembic_config, "head")


def test_downgrade_to_base(alembic_config):
    """Full downgrade chain runs without errors."""
    command.upgrade(alembic_config, "head")
    command.downgrade(alembic_config, "base")


def test_roundtrip(alembic_config):
    """Upgrade then downgrade then upgrade again produces same schema."""
    command.upgrade(alembic_config, "head")
    command.downgrade(alembic_config, "base")
    command.upgrade(alembic_config, "head")
```

## Common test pitfalls

### Shared session across tests

```python
# BAD: session-scoped session leaks state between tests
@pytest.fixture(scope="session")
async def session(engine):  # State leaks!
    ...

# GOOD: function-scoped session with transaction rollback
@pytest.fixture  # Default scope is function
async def session(engine):
    ...
```

### Missing flush before assertions

```python
# BAD: no flush means no database round-trip
session.add(user)
assert user.id is not None  # May pass with client-side defaults but not server defaults

# GOOD: flush to trigger database interaction
session.add(user)
await session.flush()
assert user.id is not None  # Server-generated ID is now populated
```

### Testing against SQLite instead of target database

- SQLite does not enforce foreign keys by default.
- SQLite accepts any type in any column (type affinity, not strict typing).
- SQLite lacks `ARRAY`, `JSONB`, window functions with `FILTER`, and `INTERVAL`.
- Use the same database engine in tests as production. Testcontainers or Docker Compose make this trivial.
