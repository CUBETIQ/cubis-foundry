---
name: "java-pro"
description: "Use for modern Java backend and platform engineering with Java 25-era language/runtime practices."
license: MIT
metadata:
  version: "1.0.0"
  domain: "language"
  role: "specialist"
  stack: "java"
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  baseline: "Java SE 25"
  tags: ["java", "jvm", "backend", "services", "observability"]
---

# Java Pro

## When to use

- Building or modernizing Java backend services.
- Designing JVM architecture for high-throughput systems.
- Improving reliability, observability, and maintainability.

## When not to use

- Frontend-only tasks with no JVM component.
- Pure schema/index work better handled as database design or optimization.
- Low-level native systems work where Rust/Go is the actual project stack.

## Core workflow

1. Clarify runtime target and deployment constraints.
2. Define module boundaries and API contracts.
3. Implement with clear domain/service/infrastructure separation.
4. Add tests and performance checks for critical paths.

## Baseline standards

- Use current LTS/JDK baseline approved by project policy.
- Prefer records/sealed hierarchies where they simplify modeling.
- Keep null-handling explicit; avoid silent NPE pathways.
- Use structured logging and trace propagation.
- Enforce dependency and API compatibility checks in CI.

## Debugging and observability

- Capture request/job correlation IDs in logs and traces.
- Keep exception handling consistent between transport, service, and persistence layers.
- Reproduce performance or memory issues with focused benchmarks/profilers before redesigning.

## Performance and reliability

- Prefer explicit timeouts, bulkheads, and retry budgets at I/O boundaries.
- Keep thread/virtual-thread usage bounded and observable.
- Separate transport DTOs from domain and persistence models to reduce cascade failures.

## References

| File | Load when |
| --- | --- |
| `references/operational-baseline.md` | You need current Java service guardrails for logging, testing, dependency hygiene, and runtime operations. |

## Avoid

- Monolithic service classes with mixed responsibilities.
- Reflection-heavy magic when explicit code is clearer.
- Leaking persistence entities directly into API contracts.
