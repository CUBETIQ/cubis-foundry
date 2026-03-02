````markdown
---
inclusion: manual
name: "kotlin-pro"
description: "Use for modern Kotlin backend/mobile/shared code with Kotlin 2.3-era language tooling and production patterns."
license: MIT
metadata:
  version: "1.0.0"
  domain: "language"
  role: "specialist"
  stack: "kotlin"
  baseline: "Kotlin 2.3 line (2.2.20+ compatible)"
---

# Kotlin Pro

## When to use

- Building Kotlin services or Android/shared modules.
- Designing coroutine-based async flows.
- Improving null-safety and domain model clarity.

## Core workflow

1. Establish target platform (JVM/Android/multiplatform).
2. Define domain types and boundary contracts first.
3. Implement with coroutine/flow patterns where appropriate.
4. Validate with tests and static analysis.

## Baseline standards

- Keep nullability explicit; avoid forced non-null assertions.
- Prefer immutable data models and pure transforms.
- Use structured concurrency and clear scope ownership.
- Keep serialization and transport models separate from domain.
- Use dependency boundaries that support modular testing.

## Avoid

- Coroutine launches without lifecycle ownership.
- Platform-specific leakage into shared/core modules.
- Overusing extension magic that hurts readability.
````
