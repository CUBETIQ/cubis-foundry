````markdown
---
inclusion: manual
name: nestjs-expert
description: "Use when building NestJS services that need strong module boundaries, dependency injection, DTO validation, guards or interceptors, auth boundaries, transport-aware module design, and production-safe TypeScript backend structure."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# NestJS Expert

## Purpose

Use when building NestJS services that need strong module boundaries, dependency injection, DTO validation, guards or interceptors, auth boundaries, transport-aware module design, and production-safe TypeScript backend structure.

## When to Use

- Building or refactoring NestJS APIs and service modules.
- Designing providers, controllers, DTOs, guards, interceptors, pipes, and auth boundaries.
- Enforcing modular TypeScript backend boundaries in a Nest app or monorepo.
- Reviewing Nest code for dependency direction, transport separation, validation, and operational safety.

## Instructions

1. Define module boundaries, provider ownership, and transport boundaries before adding endpoints.
2. Keep controllers thin and push logic into services or domain layers.
3. Validate input with DTOs and explicit boundary rules.
4. Apply guards, interceptors, filters, and auth wiring intentionally rather than globally by habit.
5. Verify testability, error behavior, dependency direction, and bootstrap posture before shipping.

### Baseline standards

- Use modules to express bounded context, not folder cosmetics.
- Keep DI graphs simple and acyclic.
- Treat DTOs as boundary contracts, not domain models.
- Keep transport concerns, auth policy, and domain logic separate.
- Use guards/interceptors/pipes only where their responsibility is clear.
- Keep config and infrastructure concerns explicit and testable.

### Constraints

- Avoid fat controllers and hidden business logic in decorators.
- Avoid circular module/provider dependencies.
- Avoid dTO reuse that leaks transport concerns across layers.
- Avoid request-scoped providers by default when singleton or explicit factory wiring is enough.
- Avoid global framework magic when local explicit behavior is safer.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/module-dto-guard-playbook.md` | You need a more explicit Nest playbook for modules, DTOs, guards, auth, transports, config, and testable dependency graphs. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with nestjs expert best practices in this project"
- "Review my nestjs expert implementation for issues"
````
