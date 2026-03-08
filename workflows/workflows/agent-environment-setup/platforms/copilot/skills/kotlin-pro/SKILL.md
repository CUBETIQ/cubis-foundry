---
name: "kotlin-pro"
description: "Use for modern Kotlin backend/mobile/shared code with Kotlin 2.3-era language tooling and production patterns."
license: MIT
metadata:
  version: "1.0.0"
  domain: "language"
  role: "specialist"
  stack: "kotlin"
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  baseline: "Kotlin 2.3 line (2.2.20+ compatible)"
  tags: ["kotlin", "coroutines", "android", "jvm", "multiplatform"]
---
# Kotlin Pro

## When to use

- Building Kotlin services or Android/shared modules.
- Designing coroutine-based async flows.
- Improving null-safety and domain model clarity.

## When not to use

- Frontend-only work with no Kotlin/JVM/Android/shared module in scope.
- Database-only tuning without Kotlin code changes.
- Tiny scripts that should stay in existing project tooling.

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

## Debugging and observability

- Keep coroutine context, dispatcher use, and cancellation visible in logs/traces.
- Reproduce lifecycle-related failures with focused tests before broader rewrites.
- Prefer deterministic `Flow`/coroutine tests for race-prone logic.

## Performance and reliability

- Bound coroutine fan-out and avoid hidden blocking on default dispatchers.
- Keep Android/shared/JVM boundaries explicit to avoid platform leakage.
- Favor allocation-light data flows in hot paths and measure before micro-optimizing.

## References

| File | Load when |
| --- | --- |
| `references/operational-baseline.md` | You need Kotlin coroutine, modularity, testing, and production guardrails. |

## Avoid

- Coroutine launches without lifecycle ownership.
- Platform-specific leakage into shared/core modules.
- Overusing extension magic that hurts readability.
