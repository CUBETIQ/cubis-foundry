---
name: "java-pro"
description: "Use for modern Java backend and platform engineering with Java 25-era language/runtime practices."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Java Pro

## Purpose

Expert-level guidance for modern Java backend and platform engineering. Covers records, sealed types, virtual threads (Project Loom), null handling, performance profiling, and production observability using current JDK practices.

## When to Use

- Building or modernizing Java backend services.
- Designing JVM architecture for high-throughput systems.
- Improving reliability, observability, and maintainability of Java codebases.

## Instructions

1. **Clarify runtime target and deployment constraints** — confirm the JDK baseline approved by project policy and deployment environment before choosing language features.

2. **Define module boundaries and API contracts** — separate domain, service, and infrastructure layers. Use records for immutable data carriers (API responses, DTOs, event payloads). Use sealed classes/interfaces for closed domain hierarchies with exhaustive pattern matching.

3. **Implement with explicit null handling** — use `Optional<T>` for return types that may legitimately have no value, but never for parameters or fields. Use `@Nullable`/`@NonNull` annotations from JSpecify or Checker Framework. Fail fast with `Objects.requireNonNull()` at method entry. Do not return raw `null` from methods that could return `Optional` or empty collections because it creates silent NPE pathways.

4. **Use virtual threads for blocking I/O workloads** — HTTP calls, database queries, and file reads benefit from virtual threads via `Executors.newVirtualThreadPerTaskExecutor()`. Do not use virtual threads for CPU-bound work because they share carrier threads and cause starvation. Do not use `synchronized` blocks in virtual-thread code because it causes carrier-thread pinning — use `ReentrantLock` instead.

5. **Add structured logging and trace propagation** — capture request/job correlation IDs in logs and traces. Keep exception handling consistent between transport, service, and persistence layers. Do not expose stack traces in production responses.

6. **Enforce dependency and API compatibility checks in CI** — use current JDK tooling, static analysis, and dependency verification. Separate transport DTOs from domain and persistence models to reduce cascade failures.

7. **Profile before optimizing** — use `jcmd`, `async-profiler`, or JFR for production diagnostics without restart. Profile GC behavior with `-Xlog:gc*` before tuning heap sizes. Use escape analysis awareness to avoid large short-lived objects in hot loops. Prefer explicit timeouts, bulkheads, and retry budgets at I/O boundaries.

8. **Add tests and performance checks for critical paths** — use JUnit 5, parameterized tests, and Testcontainers for integration testing. Do not use `Thread.sleep()` for retry logic because it blocks threads — use structured retry with backoff. Do not leak persistence entities directly into API contracts because it couples layers.

9. **Do not use reflection-heavy magic when explicit code is clearer** because it hurts readability and debuggability. Do not build monolithic service classes with mixed responsibilities because they resist testing and change.

## Output Format

Produces Java code using records, sealed types, and modern JDK APIs with clear layer separation, explicit null handling, and structured error propagation. Includes virtual-thread-aware patterns where applicable.

## References

| File                                     | Load when                                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `references/virtual-threads-patterns.md` | Virtual thread adoption, carrier pinning avoidance, or Loom migration patterns need detail.              |
| `references/records-sealed-types.md`     | Record design, sealed hierarchy modeling, or pattern matching with switch expressions need detail.       |
| `references/stream-api-patterns.md`      | Stream pipeline design, collector patterns, parallel stream tradeoffs, or functional idioms need detail. |
| `references/modern-testing.md`           | JUnit 5 patterns, parameterized tests, Testcontainers, or test architecture decisions need detail.       |
| `references/gc-and-allocation.md`        | GC tuning, allocation profiling, escape analysis, or memory-sensitive design decisions need detail.      |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Migrate this blocking HTTP client code to use virtual threads with proper carrier-thread pinning avoidance."
- "Refactor this service to use sealed classes and pattern matching instead of the visitor pattern."
- "Design the null-handling strategy for this API layer using Optional returns and JSpecify annotations."
