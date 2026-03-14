# Async Sessions

Load this when configuring async engine, session factories, connection pooling, or diagnosing MissingGreenlet errors in SQLAlchemy 2.0+.

## Engine and session factory setup

```python
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# Use async driver: asyncpg (Postgres), aiosqlite (SQLite), aiomysql (MySQL)
engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost:5432/mydb",
    echo=False,          # True only for debugging
    pool_size=10,        # Base connections held open
    max_overflow=20,     # Extra connections under load
    pool_recycle=3600,   # Recycle connections after 1 hour (prevents stale conn)
    pool_pre_ping=True,  # Verify connection liveness before checkout
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # CRITICAL for async: prevents MissingGreenlet
)
```

### Why `expire_on_commit=False`

- After commit, SQLAlchemy expires all loaded attributes by default.
- Next attribute access triggers a lazy load to refresh.
- In async mode, lazy loads require a greenlet context that does not exist.
- Result: `MissingGreenlet` exception on any attribute access after commit.
- Setting `expire_on_commit=False` keeps loaded data available. Refresh explicitly when needed.

## Session lifecycle patterns

### Request-scoped session (FastAPI)

```python
from fastapi import Depends
from collections.abc import AsyncGenerator

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        async with session.begin():
            yield session
        # Transaction commits on clean exit, rolls back on exception

@app.get("/users/{user_id}")
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
) -> UserResponse:
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404)
    return UserResponse.model_validate(user)
```

### Unit-of-work pattern

```python
async def transfer_funds(
    from_id: int, to_id: int, amount: Decimal
) -> None:
    async with async_session() as session:
        async with session.begin():
            from_acct = await session.get(Account, from_id)
            to_acct = await session.get(Account, to_id)

            if from_acct.balance < amount:
                raise InsufficientFunds()

            from_acct.balance -= amount
            to_acct.balance += amount
        # Commit happens here. Rollback on exception.
```

- Always use `session.begin()` as context manager. Manual `commit()` / `rollback()` is error-prone.
- One session per unit of work. Never share sessions across concurrent tasks.

## Relationship loading in async

```python
from sqlalchemy.orm import selectinload, joinedload, subqueryload

# selectinload: separate SELECT with IN clause. Best for collections.
stmt = (
    select(User)
    .where(User.is_active == True)
    .options(selectinload(User.posts))
)

# joinedload: LEFT JOIN in same query. Best for single-object relationships.
stmt = (
    select(Post)
    .where(Post.id == post_id)
    .options(joinedload(Post.author))
)

# Chained loading: load nested relationships
stmt = (
    select(User)
    .options(
        selectinload(User.posts).selectinload(Post.comments),
        joinedload(User.profile),
    )
)
```

### Loading strategy decision matrix

| Strategy | Use when | Avoid when |
| --- | --- | --- |
| `selectinload` | Loading collections (one-to-many). Efficient IN query. | Very large result sets where IN clause exceeds DB limits. |
| `joinedload` | Loading single related objects (many-to-one, one-to-one). | Collections on large datasets (creates cartesian product). |
| `subqueryload` | Legacy compatibility. Uses a correlated subquery. | Async code (can cause unexpected lazy load triggers). |
| `lazyload` | Sync-only code where you accept N+1 as acceptable. | Any async code. Will raise `MissingGreenlet`. |

## Connection pooling tuning

### General-purpose web application

```python
engine = create_async_engine(
    url,
    pool_size=10,       # Workers * 2 is a starting point
    max_overflow=20,    # Burst capacity
    pool_recycle=1800,  # 30 min recycle
    pool_pre_ping=True, # Liveness check
)
```

### Serverless / Lambda environment

```python
from sqlalchemy.pool import NullPool

engine = create_async_engine(
    url,
    poolclass=NullPool,  # No persistent connections
)
```

- Serverless functions create new processes per invocation. Connection pools waste resources.
- Use external connection poolers (PgBouncer, Supabase Pooler) instead.

### Container / Kubernetes

```python
engine = create_async_engine(
    url,
    pool_size=5,         # Lower per-pod; total = pods * pool_size
    max_overflow=5,
    pool_recycle=600,    # Aggressive recycle for ephemeral pods
    pool_pre_ping=True,
)
```

- Calculate total connections: `pods * (pool_size + max_overflow)` must not exceed `max_connections`.
- Set `pool_recycle` lower than database `idle_timeout` to avoid broken pipe errors.

## Common async pitfalls

### MissingGreenlet after commit

```python
# BAD: accessing expired attributes after commit
async with session.begin():
    user = await session.get(User, 1)
await session.commit()
print(user.name)  # MissingGreenlet if expire_on_commit=True

# FIX: set expire_on_commit=False in session factory
```

### Lazy load in async

```python
# BAD: implicit lazy load
user = await session.get(User, 1)
posts = user.posts  # MissingGreenlet — lazy load not allowed in async

# FIX: explicit eager load
stmt = select(User).where(User.id == 1).options(selectinload(User.posts))
result = await session.execute(stmt)
user = result.scalar_one()
posts = user.posts  # Already loaded
```

### Sharing sessions across tasks

```python
# BAD: concurrent tasks sharing one session
session = async_session()
await asyncio.gather(
    task_a(session),  # Race condition on session state
    task_b(session),
)

# FIX: one session per task
async def task_a():
    async with async_session() as session:
        ...
```

## Engine disposal

```python
# Application shutdown
async def shutdown():
    await engine.dispose()
```

- Always dispose the engine on shutdown. Prevents connection leaks and warnings.
- In tests, dispose after each test module or session-scoped fixture teardown.
