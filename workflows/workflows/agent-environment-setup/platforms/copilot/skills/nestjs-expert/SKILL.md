---
name: "nestjs-expert"
description: "Use when building NestJS services that need strong module boundaries, dependency injection, DTO validation, guards or interceptors, auth boundaries, transport-aware module design, and production-safe TypeScript backend structure."
license: MIT
metadata:
  version: "3.0.0"
  domain: "backend"
  role: "specialist"
  stack: "nestjs"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "NestJS 11-era backend patterns"
  tags: ["nestjs", "typescript", "backend", "di", "modules", "guards", "dto"]
---
# NestJS Expert

## When to use

- Building or refactoring NestJS APIs and service modules.
- Designing providers, controllers, DTOs, guards, interceptors, pipes, and auth boundaries.
- Enforcing modular TypeScript backend boundaries in a Nest app or monorepo.
- Reviewing Nest code for dependency direction, transport separation, validation, and operational safety.

## When not to use

- Generic Node runtime decisions with no Nest-specific surface.
- Pure API-contract design before framework choice is fixed.
- Database-only tuning or schema design with no Nest integration concern.

## Core workflow

1. Define module boundaries, provider ownership, and transport boundaries before adding endpoints.
2. Keep controllers thin and push logic into services or domain layers.
3. Validate input with DTOs and explicit boundary rules.
4. Apply guards, interceptors, filters, and auth wiring intentionally rather than globally by habit.
5. Verify testability, error behavior, dependency direction, and bootstrap posture before shipping.

## Baseline standards

- Use modules to express bounded context, not folder cosmetics.
- Keep DI graphs simple and acyclic.
- Treat DTOs as boundary contracts, not domain models.
- Keep transport concerns, auth policy, and domain logic separate.
- Use guards/interceptors/pipes only where their responsibility is clear.
- Keep config and infrastructure concerns explicit and testable.

## Avoid

- Fat controllers and hidden business logic in decorators.
- Circular module/provider dependencies.
- DTO reuse that leaks transport concerns across layers.
- Request-scoped providers by default when singleton or explicit factory wiring is enough.
- Global framework magic when local explicit behavior is safer.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/module-dto-guard-playbook.md` | You need a more explicit Nest playbook for modules, DTOs, guards, auth, transports, config, and testable dependency graphs. |
