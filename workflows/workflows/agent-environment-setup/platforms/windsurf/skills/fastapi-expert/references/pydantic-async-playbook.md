# Pydantic And Async Playbook

Load this when FastAPI work needs deeper structure guidance.

## Boundary models

- Model request and response contracts first with Pydantic v2.
- Keep public response models separate from ORM or persistence models.
- Make validation and serialization behavior explicit.

## Async correctness

- Keep async I/O consistent through request paths.
- Do not mix blocking database or network work casually into handlers.
- Keep background tasks, retries, and timeouts visible.

## Lifespan and background work

- Use lifespan-managed startup and shutdown for shared clients, pools, and caches.
- Keep per-request state out of global mutable singletons.
- Use in-process background tasks only for short, non-durable follow-up work.
- Move durable or slow work into a queue or worker boundary.

## Dependencies and auth

- Use dependencies for shared auth, config, and request-scoped behavior.
- Make token parsing, session lookup, or scope enforcement explicit in dependencies.
- Keep dependency trees understandable and testable.
- Treat generated OpenAPI as a contract that should stay clean.

## Service boundaries

- Keep routers thin.
- Move business rules into services or domain modules.
- Re-check failure paths, auth, and OpenAPI output before finishing.
