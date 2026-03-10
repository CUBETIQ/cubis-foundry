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

## Records and sealed types

- Use records for immutable data carriers: API responses, DTOs, event payloads.
- Use sealed classes/interfaces for closed domain hierarchies with exhaustive pattern matching.
- Records are final, transparent, and generate `equals`/`hashCode`/`toString` — do not override unless domain semantics differ.
- Sealed hierarchies + pattern matching replace visitor patterns with less boilerplate.

## Virtual threads (Project Loom)

- Use virtual threads for blocking I/O workloads: HTTP calls, database queries, file reads.
- Do not use virtual threads for CPU-bound work — they share carrier threads and can cause starvation.
- Avoid `synchronized` blocks in virtual-thread code — use `ReentrantLock` instead to prevent carrier-thread pinning.
- Use `Executors.newVirtualThreadPerTaskExecutor()` for task-per-request servers.
- Keep thread-local storage minimal — virtual threads are cheap to create but share carrier thread locals.

## Null handling

- Use `Optional<T>` for return types that may legitimately have no value. Never use `Optional` for parameters or fields.
- Use `@Nullable`/`@NonNull` annotations from JSpecify or Checker Framework for compile-time null safety.
- Fail fast with `Objects.requireNonNull()` at method entry for required parameters.
- Prefer returning empty collections over `null` for collection-typed returns.

## Debugging and observability

- Capture request/job correlation IDs in logs and traces.
- Keep exception handling consistent between transport, service, and persistence layers.
- Reproduce performance or memory issues with focused benchmarks/profilers before redesigning.
- Use `jcmd`, `async-profiler`, or JFR for production diagnostics without restart.

## Performance and reliability

- Prefer explicit timeouts, bulkheads, and retry budgets at I/O boundaries.
- Keep thread/virtual-thread usage bounded and observable.
- Separate transport DTOs from domain and persistence models to reduce cascade failures.
- Profile GC behavior with `-Xlog:gc*` or GC viewers before tuning heap sizes.
- Use escape analysis awareness: avoid creating large short-lived objects in hot loops.

## References

| File                                     | Load when                                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `references/virtual-threads-patterns.md` | Virtual thread adoption, carrier pinning avoidance, or Loom migration patterns need detail.              |
| `references/records-sealed-types.md`     | Record design, sealed hierarchy modeling, or pattern matching with switch expressions need detail.       |
| `references/stream-api-patterns.md`      | Stream pipeline design, collector patterns, parallel stream tradeoffs, or functional idioms need detail. |
| `references/modern-testing.md`           | JUnit 5 patterns, parameterized tests, Testcontainers, or test architecture decisions need detail.       |
| `references/gc-and-allocation.md`        | GC tuning, allocation profiling, escape analysis, or memory-sensitive design decisions need detail.      |

## Avoid

- Monolithic service classes with mixed responsibilities.
- Reflection-heavy magic when explicit code is clearer.
- Leaking persistence entities directly into API contracts.
- `synchronized` blocks in virtual-thread code — causes carrier-thread pinning.
- Raw `null` returns from methods that could return `Optional` or empty collections.
- `Thread.sleep()` for retry logic — use structured retry with backoff.
