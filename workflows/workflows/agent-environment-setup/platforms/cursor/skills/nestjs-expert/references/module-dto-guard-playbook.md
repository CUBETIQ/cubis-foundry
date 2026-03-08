# Module, DTO, And Guard Playbook

Load this when NestJS design needs more detail than the root skill.

## Modules and providers

- Use modules to express bounded context and ownership.
- Keep provider graphs acyclic and easy to trace.
- Avoid hiding core business rules in framework decorators.

## DTO and validation boundaries

- Treat DTOs as transport contracts, not domain models.
- Keep validation explicit at the boundary.
- Avoid reusing DTOs across unrelated routes when that leaks coupling.

## Guards, interceptors, filters, pipes

- Apply each abstraction only where its responsibility is clear.
- Prefer explicit local behavior over global framework magic when blast radius is high.
- Keep auth, logging, and error shaping testable and visible.

## Auth and transports

- Keep auth strategy, guard composition, and policy checks explicit at the module boundary.
- Do not hide business authorization rules inside decorators without service-level ownership.
- Keep HTTP, GraphQL, queue, and event transport concerns from bleeding into each other.
- Treat monorepo shared modules as contracts, not a dumping ground for cross-cutting shortcuts.

## Maintainability

- Keep controllers thin.
- Push domain logic into services or domain modules.
- Re-check config, bootstrap, and infrastructure coupling before shipping.
