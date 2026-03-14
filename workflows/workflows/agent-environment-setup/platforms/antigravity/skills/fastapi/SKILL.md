---
name: fastapi
description: "Use when building FastAPI 0.115+ applications with Pydantic v2 models, async endpoints, dependency injection, OpenAPI documentation, background tasks, and security patterns."
---
# FastAPI

## Purpose

Guide the design and implementation of production-grade FastAPI 0.115+ applications using Pydantic v2 for data validation, async/await for concurrent I/O, the dependency injection system for composable request handling, automatic OpenAPI schema generation, and security utilities for OAuth2 and JWT authentication. Every instruction prioritizes runtime type safety, async correctness, and API contract accuracy.

## When to Use

- Scaffolding a new FastAPI application or adding routers to an existing one.
- Designing Pydantic v2 models for request validation, response serialization, and settings management.
- Implementing authentication and authorization with OAuth2 password flow, JWT tokens, or API keys.
- Building async endpoints with SQLAlchemy 2.0 async sessions, httpx, or other async I/O libraries.
- Configuring background tasks, WebSocket endpoints, or middleware chains.
- Reviewing FastAPI code for blocking call leaks, validation gaps, or OpenAPI schema drift.

## Instructions

1. **Confirm the FastAPI and Pydantic versions before generating code** because FastAPI 0.115+ requires Pydantic v2, whose `model_validator`, `field_validator`, and `ConfigDict` APIs are incompatible with Pydantic v1's `validator`, `root_validator`, and inner `Config` class.

2. **Define Pydantic models with explicit `Field()` declarations including `description`, `examples`, and constraints** because FastAPI derives the OpenAPI schema directly from Pydantic models, and undocumented fields produce an API contract that consumers cannot rely on.

3. **Separate request models, response models, and database models into distinct classes** because reusing a single model for input, output, and ORM conflates validation rules with serialization rules and leaks internal fields like password hashes into API responses.

4. **Use `Depends()` for all shared logic including database sessions, authentication, pagination, and feature flags** because the dependency injection system handles caching per request, supports overrides in tests, and integrates with OpenAPI security schemes automatically.

5. **Declare path operation functions as `async def` only when they perform async I/O; use plain `def` for CPU-bound or blocking operations** because FastAPI runs `async def` endpoints on the event loop and `def` endpoints in a thread pool, and a blocking call inside `async def` freezes the entire server.

6. **Use `AsyncSession` from SQLAlchemy 2.0 with `async with` context managers in async endpoints** because mixing sync `Session` with async endpoints forces SQLAlchemy into implicit I/O that blocks the event loop and causes connection pool exhaustion under load.

7. **Implement authentication with `OAuth2PasswordBearer` and a dependency that decodes and validates JWT tokens** because FastAPI's security utilities auto-generate the OpenAPI `securitySchemes` section, enabling interactive token-based testing in the Swagger UI.

8. **Return explicit `response_model` types on every path operation** because without `response_model`, FastAPI returns the raw dict or ORM object, bypassing Pydantic serialization and potentially exposing internal fields.

9. **Use `HTTPException` with specific status codes and `detail` strings for all error paths** because FastAPI converts `HTTPException` into a consistent JSON error response that matches the OpenAPI error schema consumers expect.

10. **Register middleware with `@app.middleware("http")` or `add_middleware()` and keep middleware functions lightweight** because middleware runs on every request, and slow middleware (especially blocking I/O) degrades throughput for the entire application.

11. **Use `BackgroundTasks` for fire-and-forget work like sending emails or writing audit logs** because background tasks run after the response is sent, keeping endpoint latency low without requiring an external task queue for simple workloads.

12. **Configure `BaseSettings` with Pydantic v2 for environment variable management with type coercion and validation** because `os.getenv()` returns unvalidated strings, and missing or malformed environment variables cause runtime crashes instead of startup failures.

13. **Write tests with `httpx.AsyncClient` and `ASGITransport` using dependency overrides for database and auth** because `TestClient` is synchronous, and async test clients exercise the actual ASGI lifecycle including middleware, dependencies, and background tasks.

14. **Use `APIRouter` with `prefix`, `tags`, and `dependencies` to organize endpoints into logical groups** because flat route registration in a single file creates merge conflicts, makes permission auditing difficult, and produces an unnavigable OpenAPI schema.

15. **Add `Annotated` type aliases for repeated dependency signatures** because `Annotated[User, Depends(get_current_user)]` is reusable across endpoints, reduces boilerplate, and keeps the dependency visible in the function signature for IDE support.

16. **Run the application with `uvicorn` behind a reverse proxy and configure CORS, trusted hosts, and HTTPS redirect middleware** because FastAPI does not enforce transport security by default, and missing CORS headers cause silent failures in browser-based API consumers.

## Output Format

Provide implementation code, Pydantic model definitions, dependency functions, configuration snippets, and architectural guidance as appropriate. Include file paths relative to the project root. When generating endpoints, always show the Pydantic request/response models alongside the path operation function.

## References

| File | Load when |
| --- | --- |
| `references/dependency-injection.md` | You need dependency design, sub-dependencies, yield dependencies, or request-scoped caching patterns. |
| `references/pydantic-models.md` | You need Pydantic v2 model patterns, validators, serialization customization, or settings management. |
| `references/async-patterns.md` | You need async SQLAlchemy sessions, httpx client usage, background tasks, or event loop safety guidance. |
| `references/testing.md` | You need async test client setup, dependency overrides, fixture patterns, or test database strategies. |
| `references/security.md` | You need OAuth2 flows, JWT token handling, API key authentication, or CORS/HTTPS configuration. |

## Antigravity Platform Notes

- Use Agent Manager for parallel agent coordination and task delegation.
- Skill and agent files are stored under `.agent/skills/` and `.agent/agents/` respectively.
- TOML command files in `.agent/commands/` provide slash-command entry points for workflows.
- Replace direct `@agent-name` delegation with Agent Manager dispatch calls.
- Reference files are loaded relative to the skill directory under `.agent/skills/<skill-id>/`.
