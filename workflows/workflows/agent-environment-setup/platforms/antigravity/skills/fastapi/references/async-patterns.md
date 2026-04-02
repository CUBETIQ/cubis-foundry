# Async Patterns

## Event Loop Safety

FastAPI runs on `uvicorn`, which uses a single-threaded asyncio event loop. Understanding what blocks the loop is critical for performance.

| Operation Type | Use `async def` | Use `def` | Explanation |
|---------------|----------------|-----------|-------------|
| `await` async DB query | Yes | No | Async I/O runs on the event loop |
| `requests.get()` (sync HTTP) | No | Yes | Blocks the event loop; use thread pool |
| CPU-bound computation | No | Yes | Blocks the event loop; use thread pool |
| `httpx.AsyncClient` call | Yes | No | Async I/O runs on the event loop |
| File I/O with `aiofiles` | Yes | No | Async I/O runs on the event loop |
| `open().read()` (sync file) | No | Yes | Blocks the event loop |

FastAPI automatically runs `def` endpoints in a thread pool (`anyio.to_thread.run_sync`). Do not declare an endpoint as `async def` and then call blocking code inside it.

## SQLAlchemy 2.0 Async Sessions

### Engine and Session Factory

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Use async driver: asyncpg for PostgreSQL, aiosqlite for SQLite
engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/db",
    echo=False,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,       # Verify connections before use
    pool_recycle=3600,         # Recycle connections after 1 hour
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,   # Prevent lazy loads after commit
)
```

### Session Dependency

```python
from typing import AsyncGenerator

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
```

### Query Patterns

```python
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

# Basic query
result = await db.execute(select(User).where(User.email == email))
user = result.scalar_one_or_none()

# Eager loading (prevent N+1)
result = await db.execute(
    select(User)
    .options(selectinload(User.posts))
    .where(User.is_active == True)
)
users = result.scalars().unique().all()

# Aggregation
result = await db.execute(
    select(func.count(User.id)).where(User.is_active == True)
)
count = result.scalar_one()

# Insert
user = User(email="new@example.com", name="New User")
db.add(user)
await db.commit()
await db.refresh(user)  # Reload auto-generated fields (id, created_at)
```

### Important: Lazy Loading is Forbidden in Async

```python
# THIS WILL RAISE MissingGreenlet ERROR:
user = await db.get(User, 1)
print(user.posts)  # Lazy load triggers sync I/O -> crash

# FIX: Use eager loading
result = await db.execute(
    select(User).options(selectinload(User.posts)).where(User.id == 1)
)
user = result.scalar_one()
print(user.posts)  # Already loaded
```

## httpx for Async HTTP Calls

### Client Lifecycle

```python
import httpx

# BAD: Creates a new connection per request
async def fetch_data():
    async with httpx.AsyncClient() as client:
        return await client.get("https://api.example.com/data")

# GOOD: Reuse client across requests via dependency injection
class HttpClientDep:
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=10.0,
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
        )

    async def __aenter__(self):
        return self.client

    async def __aexit__(self, *args):
        await self.client.aclose()

# Application lifespan
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(
        timeout=10.0,
        limits=httpx.Limits(max_connections=100),
    )
    yield
    await app.state.http_client.aclose()

app = FastAPI(lifespan=lifespan)

# Dependency
async def get_http_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http_client
```

### Retry Pattern

```python
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.ConnectTimeout, httpx.ReadTimeout)),
)
async def fetch_with_retry(client: httpx.AsyncClient, url: str) -> dict:
    response = await client.get(url)
    response.raise_for_status()
    return response.json()
```

## BackgroundTasks

```python
from fastapi import BackgroundTasks

async def send_notification(user_id: int, message: str):
    """Runs after the response is sent."""
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://notifications.example.com/send",
            json={"user_id": user_id, "message": message},
        )

@router.post("/orders")
async def create_order(
    order_in: OrderCreate,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    order = await save_order(db, order_in)
    background_tasks.add_task(send_notification, order.user_id, "Order confirmed")
    return order
```

### Limitations of BackgroundTasks

| Good For | Bad For |
|----------|---------|
| Sending emails, push notifications | Long-running jobs (> 30s) |
| Writing audit logs | Jobs that need persistence and retry |
| Triggering webhooks | Jobs that survive server restarts |

For long-running or critical tasks, use Celery, ARQ, or a task queue.

## Concurrent Async Operations

```python
import asyncio

async def fetch_dashboard(user_id: int, db: AsyncSession) -> dict:
    # Run independent queries concurrently
    orders_task = asyncio.create_task(get_recent_orders(db, user_id))
    notifications_task = asyncio.create_task(get_notifications(db, user_id))
    stats_task = asyncio.create_task(get_user_stats(db, user_id))

    orders, notifications, stats = await asyncio.gather(
        orders_task, notifications_task, stats_task,
        return_exceptions=True,  # Don't cancel all on one failure
    )

    return {
        "orders": orders if not isinstance(orders, Exception) else [],
        "notifications": notifications if not isinstance(notifications, Exception) else [],
        "stats": stats if not isinstance(stats, Exception) else {},
    }
```

## WebSocket Endpoints

```python
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active:
            await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

## Startup and Shutdown Events (Lifespan)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create connections, warm caches
    app.state.db_engine = create_async_engine(settings.database_url)
    app.state.redis = await aioredis.from_url(settings.redis_url)

    yield

    # Shutdown: close connections, flush buffers
    await app.state.redis.close()
    await app.state.db_engine.dispose()

app = FastAPI(lifespan=lifespan)
```

The lifespan context manager replaces the deprecated `@app.on_event("startup")` and `@app.on_event("shutdown")` hooks.
