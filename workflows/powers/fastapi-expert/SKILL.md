---
name: fastapi-expert
description: "Use when building FastAPI services with async Python, Pydantic v2, lifespan-managed resources, dependency-based auth, background task boundaries, and OpenAPI-safe request handling."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# FastAPI Expert

## Purpose

Use when building FastAPI services with async Python, Pydantic v2, lifespan-managed resources, dependency-based auth, background task boundaries, and OpenAPI-safe request handling.

## When to Use

- Building or refactoring FastAPI REST or internal service APIs.
- Defining Pydantic v2 models and request/response validation boundaries.
- Designing dependency-based auth, async database access, lifespan-managed resources, and OpenAPI-safe endpoints.
- Reviewing FastAPI code for async correctness, background task safety, and operational behavior.

## Instructions

1. Model request, response, and error boundaries first with Pydantic v2.
2. Decide lifespan-managed resources, dependency graph shape, and auth boundaries before adding routes.
3. Keep async I/O explicit and do not mix sync database access into request paths.
4. Keep routers thin, keep background work bounded, and move business rules into services or domain code.
5. Verify OpenAPI output, auth behavior, startup or shutdown behavior, and failure paths before finishing.

### Baseline standards

- Use explicit type hints and Pydantic v2 patterns.
- Keep request validation and response shaping at the boundary.
- Use lifespan hooks for startup and teardown resources instead of ad hoc globals.
- Prefer async database and network paths consistently.
- Use dependency injection for shared auth/config logic.
- Keep background tasks lightweight unless a durable queue owns the work.
- Treat generated OpenAPI as a contract to keep clean.

### Constraints

- Avoid mixing sync and async code casually in request handlers.
- Avoid leaking ORM models directly as public response contracts.
- Avoid hiding resource lifecycle in module import side effects.
- Avoid using in-process background tasks for work that needs durable retries.
- Avoid hiding auth or validation behavior in ad hoc helpers.
- Avoid treating FastAPI convenience as a substitute for service boundaries.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/pydantic-async-playbook.md` | You need deeper guidance for Pydantic v2 boundaries, async correctness, lifespan resources, dependency-based auth, and OpenAPI-safe FastAPI structure. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with fastapi expert best practices in this project"
- "Review my fastapi expert implementation for issues"
