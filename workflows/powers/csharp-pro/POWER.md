````markdown
---
inclusion: manual
name: "csharp-pro"
description: "Use for modern C# backend/application engineering with C# 14 and .NET 10-era production practices."
license: MIT
metadata:
  version: "1.0.0"
  domain: "language"
  role: "specialist"
  stack: "csharp"
  baseline: "C# 14 / .NET 10"
---

# C# Pro

## When to use

- Building APIs, workers, and services in .NET.
- Refactoring legacy C# into modern, testable architecture.
- Improving async correctness and operational resilience.

## Core workflow

1. Confirm target framework/runtime constraints.
2. Define clean contracts (DTOs, domain, persistence boundaries).
3. Implement async-first I/O and cancellation-aware flows.
4. Validate with tests, analyzers, and profiling.

## Baseline standards

- Use nullable reference types and treat warnings as actionable.
- Use `async`/`await` with `CancellationToken` in public async APIs.
- Keep exception handling consistent and observable.
- Use dependency injection with explicit lifetimes.
- Keep API contracts versioned and backward-compatible.

## Avoid

- Sync-over-async (`.Result`, `.Wait()`) in request paths.
- Fat controllers with business logic and persistence mixed.
- Global static mutable state in multi-request services.
````
