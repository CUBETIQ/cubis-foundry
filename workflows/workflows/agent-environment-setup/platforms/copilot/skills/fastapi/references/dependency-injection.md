# Dependency Injection

## How FastAPI DI Works

FastAPI's dependency injection system uses `Depends()` to declare that a path operation parameter should be resolved by calling a function (or class). Dependencies are called once per request and cached for the duration of that request.

```
Request arrives -> Path operation params resolved -> Dependencies called (depth-first) -> Cached per request -> Handler executes -> Response sent -> Cleanup (yield deps)
```

## Basic Dependency

```python
from typing import Annotated
from fastapi import Depends, Query

async def common_pagination(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> dict[str, int]:
    return {"skip": skip, "limit": limit}

PaginationParams = Annotated[dict[str, int], Depends(common_pagination)]

@router.get("/items")
async def list_items(pagination: PaginationParams):
    return await item_service.find_all(
        skip=pagination["skip"],
        limit=pagination["limit"],
    )
```

## Sub-Dependencies

Dependencies can depend on other dependencies. FastAPI resolves the entire tree depth-first.

```python
from fastapi import Depends, HTTPException, status

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    user = await authenticate_token(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user

async def get_current_active_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user

# Shorthand type aliases
CurrentUser = Annotated[User, Depends(get_current_user)]
ActiveUser = Annotated[User, Depends(get_current_active_user)]
```

## Yield Dependencies (Context Manager Pattern)

Yield dependencies execute cleanup code after the response is sent. Use for database sessions, file handles, and external connections.

```python
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

### Lifecycle

1. Code before `yield` runs before the handler.
2. The yielded value is injected into the handler.
3. Code after `yield` runs after the response is sent (including on error).

Important: if an exception occurs in the handler, it propagates into the `except` block of the yield dependency. Always wrap yield dependencies with try/except/finally.

## Class-Based Dependencies

```python
class ItemQueryFilter:
    def __init__(
        self,
        name: str | None = Query(default=None),
        min_price: float | None = Query(default=None, ge=0),
        max_price: float | None = Query(default=None, ge=0),
        category: str | None = Query(default=None),
    ):
        self.name = name
        self.min_price = min_price
        self.max_price = max_price
        self.category = category

    def apply(self, query):
        if self.name:
            query = query.where(Item.name.ilike(f"%{self.name}%"))
        if self.min_price is not None:
            query = query.where(Item.price >= self.min_price)
        if self.max_price is not None:
            query = query.where(Item.price <= self.max_price)
        if self.category:
            query = query.where(Item.category == self.category)
        return query

@router.get("/items")
async def list_items(
    filters: Annotated[ItemQueryFilter, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    query = filters.apply(select(Item))
    result = await db.execute(query)
    return result.scalars().all()
```

`Depends()` with no argument uses the type annotation class as the dependency callable.

## Router-Level Dependencies

```python
# All endpoints in this router require authentication
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_active_user)],
)
```

Router-level dependencies apply to every endpoint in the router. They do not inject into the handler -- use them for side effects like auth checks.

## Application-Level Dependencies

```python
app = FastAPI(dependencies=[Depends(verify_api_key)])
```

Applies to every endpoint in the application.

## Dependency Caching

FastAPI caches dependency return values per request. If two parameters depend on `get_db`, the session is created once.

```python
# Both depend on get_db -- only one session is created
@router.get("/dashboard")
async def dashboard(
    user: Annotated[User, Depends(get_current_user)],    # calls get_db internally
    db: Annotated[AsyncSession, Depends(get_db)],         # reuses the same session
):
    ...
```

To disable caching (get a fresh instance each time):

```python
Depends(get_db, use_cache=False)
```

## Testing with Dependency Overrides

```python
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies.database import get_db

# Override for tests
async def override_get_db():
    async with test_session_factory() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

# Reset after tests
app.dependency_overrides.clear()
```

Overrides replace the dependency globally. The override function must have the same signature (or a compatible one) as the original.

## Common Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Calling `get_db()` directly in handler | Bypasses DI cache and cleanup | Use `Depends(get_db)` |
| Global singleton session | Shared state across requests | Use yield dependency per request |
| Importing `request` object globally | Not available outside request context | Inject via dependency parameter |
| Nested `Depends` in function body | Hidden dependencies, untestable | Declare all deps as function params |
| `Depends(lambda: ...)` | Lambda has no identity for override | Use named functions |
