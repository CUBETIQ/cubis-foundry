# Python Async Patterns

## Structured Concurrency with TaskGroup

`asyncio.TaskGroup` (Python 3.11+) is the primary tool for structured concurrency. It replaces `asyncio.gather` with proper exception handling and cancellation.

### Basic TaskGroup

```python
async def fetch_all(urls: list[str]) -> list[Response]:
    results: list[Response] = []

    async with asyncio.TaskGroup() as tg:
        for url in urls:
            tg.create_task(fetch_one(url, results))

    # All tasks complete before reaching this line.
    # If any task raised, TaskGroup cancels siblings and raises ExceptionGroup.
    return results
```

### TaskGroup vs gather

| Feature | TaskGroup | asyncio.gather |
| --- | --- | --- |
| Error propagation | Cancels siblings, raises ExceptionGroup | Requires `return_exceptions=True` to avoid losing errors |
| Cancellation | Automatic sibling cancellation | Manual cancellation logic needed |
| Nesting | Natural with `async with` scoping | Awkward nested `gather` calls |
| Exception type | `ExceptionGroup` (catchable with `except*`) | Single exception or list with `return_exceptions` |

### Handling ExceptionGroup

```python
try:
    async with asyncio.TaskGroup() as tg:
        tg.create_task(might_fail_1())
        tg.create_task(might_fail_2())
except* ValueError as eg:
    # Handle all ValueErrors from the group
    for exc in eg.exceptions:
        logger.error("value_error", error=str(exc))
except* ConnectionError as eg:
    # Handle connection errors separately
    for exc in eg.exceptions:
        logger.error("connection_error", error=str(exc))
```

## Event Loop Discipline

### Never Block the Loop

```python
# WRONG: blocks the entire event loop
async def bad_handler(request):
    result = heavy_computation(request.data)  # CPU-bound, stalls all coroutines
    return result

# CORRECT: offload to thread pool
async def good_handler(request):
    result = await asyncio.to_thread(heavy_computation, request.data)
    return result

# CORRECT: offload to process pool for CPU-bound work
async def cpu_handler(request):
    loop = asyncio.get_running_loop()
    with ProcessPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, heavy_computation, request.data)
    return result
```

### Common Blocking Traps

- `time.sleep()` — use `asyncio.sleep()`
- `open()` for file I/O — use `aiofiles` or `asyncio.to_thread(Path.read_text, path)`
- `requests.get()` — use `httpx.AsyncClient` or `aiohttp`
- DNS resolution — use `aiodns` or `asyncio.to_thread`
- Database drivers without async — use `asyncio.to_thread` or switch to async driver

## Graceful Shutdown

### Signal-Based Shutdown

```python
class Service:
    def __init__(self) -> None:
        self._shutdown = asyncio.Event()

    async def run(self) -> None:
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, self._shutdown.set)

        async with self._resource_manager() as resources:
            async with asyncio.TaskGroup() as tg:
                tg.create_task(self._worker(resources))
                tg.create_task(self._health_server())

                # Block until shutdown signal
                await self._shutdown.wait()

                # TaskGroup scope ends — all tasks are cancelled
                # and awaited (they should check shutdown event)

        logger.info("service_stopped")
```

### Timeout on Shutdown Drain

```python
async def drain_with_timeout(tasks: list[asyncio.Task], timeout: float) -> None:
    """Cancel tasks and wait with a timeout."""
    for task in tasks:
        task.cancel()

    results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, Exception) and not isinstance(result, asyncio.CancelledError):
            logger.error("drain_error", error=str(result))
```

## Resource Management

### Async Context Managers for Connection Pools

```python
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

@asynccontextmanager
async def create_app_resources() -> AsyncIterator[AppResources]:
    """Manage all application resources with guaranteed cleanup."""
    db_pool = await asyncpg.create_pool(dsn=DB_URL)
    redis = await aioredis.from_url(REDIS_URL)
    http_client = httpx.AsyncClient()

    try:
        yield AppResources(db=db_pool, redis=redis, http=http_client)
    finally:
        # Cleanup in reverse order of creation
        await http_client.aclose()
        await redis.aclose()
        await db_pool.close()
```

### Semaphore for Bounded Concurrency

```python
async def process_batch(items: list[Item], max_concurrent: int = 10) -> list[Result]:
    semaphore = asyncio.Semaphore(max_concurrent)
    results: list[Result] = []

    async def process_one(item: Item) -> None:
        async with semaphore:
            result = await do_work(item)
            results.append(result)

    async with asyncio.TaskGroup() as tg:
        for item in items:
            tg.create_task(process_one(item))

    return results
```

## Async Iterator Patterns

### Async Generators

```python
async def stream_records(query: str) -> AsyncIterator[Record]:
    """Yield records one at a time from database cursor."""
    async with db_pool.acquire() as conn:
        async with conn.transaction():
            async for row in conn.cursor(query):
                yield Record.from_row(row)

# Usage
async for record in stream_records("SELECT * FROM events"):
    await process(record)
```

### Async Comprehensions

```python
results = [await process(item) async for item in stream_items()]
filtered = [item async for item in stream_items() if item.is_valid()]
```

## Testing Async Code

### pytest-asyncio Setup

```toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

```python
import pytest

# No marker needed with asyncio_mode = "auto"
async def test_fetch_all():
    results = await fetch_all(["http://example.com"])
    assert len(results) == 1

# Async fixtures
@pytest.fixture
async def db_pool():
    pool = await asyncpg.create_pool(dsn=TEST_DB_URL)
    yield pool
    await pool.close()

async def test_repository(db_pool):
    repo = Repository(db_pool)
    await repo.save(item)
    result = await repo.get(item.id)
    assert result == item
```
