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

1. Establish target platform (JVM/Android/Kotlin Multiplatform).
2. Define domain types with data classes, sealed hierarchies, and value classes.
3. Model concurrency with structured coroutines and Flow.
4. Keep serialization, transport, and domain models separate.
5. Validate with tests, detekt, and ktlint before shipping.

## Null safety and type design

- Keep nullability explicit. Prefer non-null types by default; use `?` only when null is valid domain state.
- Never use `!!` (forced non-null) in production code — use `requireNotNull` with a message, or safe alternatives (`?.`, `?:`, `let`).
- Use `sealed class`/`sealed interface` for closed type hierarchies with exhaustive `when`.
- Use `data class` for value objects — gets `equals`, `hashCode`, `copy`, `toString` for free.
- Use `value class` (inline class) for type-safe wrappers with zero runtime overhead.
- Prefer `enum class` for fixed sets; sealed classes when variants carry different data.

## Coroutines and structured concurrency

- Always launch coroutines in a scope with clear ownership (viewModelScope, lifecycleScope, custom CoroutineScope).
- Never use `GlobalScope` — it breaks structured concurrency and hides lifecycle bugs.
- Use `supervisorScope` when child failures should not cancel siblings.
- Use `withContext(Dispatchers.IO)` for blocking I/O; keep `Dispatchers.Main` for UI updates.
- Use `withTimeout` and `withTimeoutOrNull` for time-bounded operations.
- Respect cancellation — check `isActive` in loops, use `ensureActive()`, and let `CancellationException` propagate.
- Prefer `coroutineScope` for parallel decomposition — launches complete before returning.

## Flow patterns

- Use `StateFlow` for observable state (replaces LiveData); `SharedFlow` for events.
- Use `stateIn` and `shareIn` to share upstream flows with configurable replay and start behavior.
- Prefer `flow {}` builder for cold streams; `channelFlow` when coroutine interleaving is needed.
- Use `flowOn(Dispatchers.IO)` to shift upstream execution context — never use `withContext` inside `flow {}`.
- Handle backpressure with `conflate()`, `buffer()`, or `collectLatest`.
- Use `combine`, `zip`, and `flatMapLatest` for multi-source reactive patterns.

## Extension functions and DSLs

- Use extension functions to add capabilities without inheritance — keep them discoverable and scoped.
- Prefer member functions for core type behavior; extensions for cross-cutting concerns.
- Scope extensions to the narrowest visibility (`internal`, `private`) when possible.
- Use receiver-based DSLs (`buildString`, `apply`, `with`) for configuration blocks.
- Avoid extension property overuse — functions are more discoverable in IDE completion.

## Kotlin Multiplatform

- Put shared logic in `commonMain`; platform-specific implementations in `androidMain`/`iosMain`/`jvmMain`.
- Use `expect`/`actual` declarations for platform abstractions.
- Use `kotlinx.serialization` for cross-platform serialization (not Gson or Moshi).
- Keep platform boundary interfaces thin — heavy logic belongs in common code.

## Debugging and observability

- Keep coroutine context, dispatcher use, and cancellation visible in logs/traces.
- Use `-Dkotlinx.coroutines.debug` for coroutine creation stack traces in development.
- Reproduce lifecycle-related failures with focused coroutine tests before broader rewrites.
- Use `CoroutineExceptionHandler` at scope boundaries to catch unhandled exceptions.

## Performance and reliability

- Bound coroutine fan-out with `limitedParallelism` or `Semaphore` — avoid unbounded `launch` in loops.
- Keep Android/shared/JVM boundaries explicit to avoid platform leakage.
- Use `Sequence` for lazy evaluation of large collections; `List` for small, eager operations.
- Prefer `buildList`, `buildMap`, `buildSet` for efficient collection construction.
- Favor allocation-light data flows in hot paths — use `value class` for primitive wrappers.
- Measure with profiling tools before micro-optimizing.

## References

| File                                      | Load when                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `references/operational-baseline.md`      | You need Kotlin coroutine, modularity, testing, and production guardrails.                              |
| `references/coroutine-patterns.md`        | You need structured concurrency, scope management, dispatcher selection, or cancellation design.        |
| `references/flow-and-channels.md`         | You need StateFlow/SharedFlow patterns, reactive streams, backpressure, or channel-based communication. |
| `references/sealed-types-and-dsl.md`      | You need sealed class hierarchies, value classes, pattern matching, or DSL builder patterns.            |
| `references/multiplatform-and-testing.md` | You need KMP architecture, expect/actual patterns, or coroutine test strategies.                        |

## Avoid

- `GlobalScope.launch` — breaks structured concurrency, leaks coroutines.
- `!!` (forced non-null) in production code — use `requireNotNull` or safe alternatives.
- Coroutine launches without lifecycle ownership — causes leaks on Android/server.
- Platform-specific leakage into shared/core modules — breaks multiplatform portability.
- Overusing extension magic that hurts readability — prefer members for core behavior.
- `runBlocking` on the main thread — deadlocks on Android and blocks server threads.
