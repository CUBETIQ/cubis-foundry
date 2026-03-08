---
name: "fastapi-expert"
description: "Use when building FastAPI services with async Python, Pydantic v2, lifespan-managed resources, dependency-based auth, background task boundaries, and OpenAPI-safe request handling."
license: MIT
metadata:
  version: "3.0.0"
  domain: "backend"
  role: "specialist"
  stack: "fastapi"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "FastAPI + Pydantic v2 + modern async Python"
  tags: ["fastapi", "python", "pydantic", "async", "backend", "openapi"]
---
# FastAPI Expert

## When to use

- Building or refactoring FastAPI REST or internal service APIs.
- Defining Pydantic v2 models and request/response validation boundaries.
- Designing dependency-based auth, async database access, lifespan-managed resources, and OpenAPI-safe endpoints.
- Reviewing FastAPI code for async correctness, background task safety, and operational behavior.

## When not to use

- Generic Python questions with no FastAPI surface.
- Pure API-contract design before framework choice is fixed.
- Sync-only scripts or non-service Python tooling.

## Core workflow

1. Model request, response, and error boundaries first with Pydantic v2.
2. Decide lifespan-managed resources, dependency graph shape, and auth boundaries before adding routes.
3. Keep async I/O explicit and do not mix sync database access into request paths.
4. Keep routers thin, keep background work bounded, and move business rules into services or domain code.
5. Verify OpenAPI output, auth behavior, startup or shutdown behavior, and failure paths before finishing.

## Baseline standards

- Use explicit type hints and Pydantic v2 patterns.
- Keep request validation and response shaping at the boundary.
- Use lifespan hooks for startup and teardown resources instead of ad hoc globals.
- Prefer async database and network paths consistently.
- Use dependency injection for shared auth/config logic.
- Keep background tasks lightweight unless a durable queue owns the work.
- Treat generated OpenAPI as a contract to keep clean.

## Avoid

- Mixing sync and async code casually in request handlers.
- Leaking ORM models directly as public response contracts.
- Hiding resource lifecycle in module import side effects.
- Using in-process background tasks for work that needs durable retries.
- Hiding auth or validation behavior in ad hoc helpers.
- Treating FastAPI convenience as a substitute for service boundaries.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/pydantic-async-playbook.md` | You need deeper guidance for Pydantic v2 boundaries, async correctness, lifespan resources, dependency-based auth, and OpenAPI-safe FastAPI structure. |
