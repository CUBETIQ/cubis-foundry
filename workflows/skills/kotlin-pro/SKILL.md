---
name: "kotlin-pro"
description: "Use for modern Kotlin backend/mobile/shared code with Kotlin 2.3-era language tooling and production patterns."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Kotlin Pro

## Purpose

Expert-level guidance for modern Kotlin development across JVM, Android, and multiplatform targets. Covers null safety, coroutine-based concurrency, Flow patterns, sealed type hierarchies, and Kotlin Multiplatform architecture with production testing discipline.

## When to Use

- Building Kotlin services or Android/shared modules.
- Designing coroutine-based async flows and reactive patterns.
- Improving null-safety, domain model clarity, and testability.

## Instructions

1. **Establish target platform** — confirm JVM, Android, or Kotlin Multiplatform before choosing runtime-specific APIs. Put shared logic in `commonMain`; platform-specific implementations in `androidMain`/`iosMain`/`jvmMain`.

2. **Design types with null safety** — keep nullability explicit. Prefer non-null types by default; use `?` only when null is valid domain state. Use `sealed class`/`sealed interface` for closed type hierarchies with exhaustive `when`. Use `data class` for value objects. Use `value class` for type-safe wrappers with zero runtime overhead. Do not use `!!` (forced non-null) in production code because it crashes at runtime — use `requireNotNull` with a message or safe alternatives (`?.`, `?:`, `let`).

3. **Model concurrency with structured coroutines** — always launch coroutines in a scope with clear ownership (`viewModelScope`, `lifecycleScope`, custom `CoroutineScope`). Use `supervisorScope` when child failures should not cancel siblings. Use `withContext(Dispatchers.IO)` for blocking I/O. Use `withTimeout` for time-bounded operations. Respect cancellation by checking `isActive` in loops and letting `CancellationException` propagate. Do not use `GlobalScope` because it breaks structured concurrency and hides lifecycle bugs. Do not use `runBlocking` on the main thread because it deadlocks on Android and blocks server threads.

4. **Use Flow for reactive streams** — use `StateFlow` for observable state; `SharedFlow` for events. Use `stateIn`/`shareIn` to share upstream flows. Prefer `flow {}` for cold streams; `channelFlow` when coroutine interleaving is needed. Use `flowOn(Dispatchers.IO)` for upstream context shifting. Handle backpressure with `conflate()`, `buffer()`, or `collectLatest`.

5. **Keep serialization and transport separate from domain** — use `kotlinx.serialization` for cross-platform serialization (not Gson or Moshi in multiplatform code). Keep platform boundary interfaces thin; heavy logic belongs in common code. Use `expect`/`actual` declarations for platform abstractions.

6. **Use extensions and DSLs judiciously** — prefer member functions for core type behavior; extensions for cross-cutting concerns. Scope extensions to the narrowest visibility. Use receiver-based DSLs for configuration blocks. Do not overuse extension properties because functions are more discoverable in IDE completion.

7. **Validate with tests, detekt, and ktlint** — keep coroutine context, dispatcher use, and cancellation visible in logs and traces. Use `-Dkotlinx.coroutines.debug` for coroutine creation stack traces in development. Use `CoroutineExceptionHandler` at scope boundaries. Bound coroutine fan-out with `limitedParallelism` or `Semaphore`. Do not launch coroutines without lifecycle ownership because it causes leaks on Android and servers.

8. **Optimize with measurement** — use `Sequence` for lazy evaluation of large collections; `List` for small, eager operations. Prefer `buildList`, `buildMap`, `buildSet` for efficient construction. Use `value class` for primitive wrappers in hot paths. Do not allow platform-specific leakage into shared/core modules because it breaks multiplatform portability. Measure with profiling tools before micro-optimizing.

## Output Format

Produces Kotlin code using data classes, sealed hierarchies, structured coroutines, and Flow patterns with explicit null safety and platform-appropriate architecture. Includes multiplatform separation where applicable.

## References

| File                                      | Load when                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `references/operational-baseline.md`      | You need Kotlin coroutine, modularity, testing, and production guardrails.                              |
| `references/coroutine-patterns.md`        | You need structured concurrency, scope management, dispatcher selection, or cancellation design.        |
| `references/flow-and-channels.md`         | You need StateFlow/SharedFlow patterns, reactive streams, backpressure, or channel-based communication. |
| `references/sealed-types-and-dsl.md`      | You need sealed class hierarchies, value classes, pattern matching, or DSL builder patterns.            |
| `references/multiplatform-and-testing.md` | You need KMP architecture, expect/actual patterns, or coroutine test strategies.                        |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Design a coroutine-based repository layer with StateFlow for UI state and proper cancellation handling."
- "Refactor this Java-style service to use sealed classes, when expressions, and value classes for type safety."
- "Set up the Kotlin Multiplatform module structure with shared business logic and platform-specific implementations."
