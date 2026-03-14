# FastAPI Skill Assertions

## Eval 1: Authenticated API with Pydantic Validation

| # | Assertion | Type | Expected Value | Rationale |
|---|-----------|------|----------------|-----------|
| 1 | Uses OAuth2PasswordBearer | contains | `OAuth2PasswordBearer` | Token-based authentication must use OAuth2PasswordBearer to integrate with FastAPI's security scheme and auto-generate the OpenAPI securitySchemes section. |
| 2 | Defines Pydantic BaseModel | contains | `BaseModel` | All request and response types must inherit from Pydantic BaseModel for automatic validation, serialization, and OpenAPI schema generation. |
| 3 | Uses Depends() | contains | `Depends(` | Shared logic (auth, DB sessions, pagination) must use Depends() for dependency injection, enabling per-request caching and test overrides. |
| 4 | Declares response_model | contains | `response_model` | Path operations must specify response_model to enforce Pydantic serialization, filter internal fields, and keep the OpenAPI contract accurate. |
| 5 | Raises HTTPException | contains | `HTTPException` | Error responses must use HTTPException with specific status codes for consistent JSON error formatting that matches consumer expectations. |

## Eval 2: Async Background Tasks

| # | Assertion | Type | Expected Value | Rationale |
|---|-----------|------|----------------|-----------|
| 1 | Uses AsyncSession | contains | `AsyncSession` | Async endpoints must use SQLAlchemy 2.0 AsyncSession to avoid blocking the event loop with synchronous database I/O. |
| 2 | Uses BackgroundTasks | contains | `BackgroundTasks` | Fire-and-forget work must use FastAPI's BackgroundTasks to execute after the response is sent, keeping endpoint latency low. |
| 3 | Declares async def | contains | `async def` | Endpoint functions performing async I/O must be declared as async def so FastAPI runs them on the event loop instead of a thread pool. |
| 4 | Overrides dependencies in tests | contains | `dependency_overrides` | Tests must use app.dependency_overrides to replace real database and auth dependencies with test doubles for isolation. |
| 5 | Uses httpx | contains | `httpx` | Async HTTP calls and async test clients must use httpx for non-blocking I/O and proper ASGI lifecycle testing. |
