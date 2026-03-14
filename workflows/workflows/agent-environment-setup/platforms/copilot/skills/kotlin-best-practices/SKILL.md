---
name: kotlin-best-practices
description: "Use when writing, refactoring, or reviewing modern Kotlin (2.1+) code across JVM, Android, iOS, and multiplatform targets. Covers coroutines, Flow, Compose patterns, KMP architecture, DSL design, and production testing. Replaces kotlin-pro."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Kotlin Best Practices

## Purpose

Production-grade guidance for modern Kotlin development using Kotlin 2.1+ features across JVM backend, Android, iOS (via KMP), and server-side targets. Covers structured coroutines, StateFlow/SharedFlow, Compose UI and Compose Multiplatform, Kotlin Multiplatform module architecture, DSL builder patterns, and testing strategies that handle concurrency correctly.

## When to Use

- Building Kotlin services, Android apps, or multiplatform shared modules.
- Designing coroutine-based async pipelines with proper scope management.
- Adopting Compose or Compose Multiplatform for UI development.
- Setting up Kotlin Multiplatform with expect/actual abstractions.
- Writing DSLs, extension functions, or type-safe builder APIs.
- Establishing testing patterns for coroutines, Flow, and Compose.

## Instructions

1. **Establish the target platform(s) before writing code** because Kotlin compiles to JVM bytecode, JavaScript, Native (iOS/macOS/Linux), and Wasm, each with different API availability and performance characteristics. Put shared business logic in `commonMain`. Put platform-specific implementations in `androidMain`, `iosMain`, `jvmMain`, or `jsMain`. Check `kotlin.target` and `kotlin.mpp` configuration before choosing APIs.

2. **Use Kotlin's type system to make illegal states unrepresentable** because the compiler catches mistakes that would be runtime errors in less expressive languages. Use `sealed class`/`sealed interface` for closed hierarchies with exhaustive `when`. Use `data class` for value objects with structural equality. Use `value class` for zero-overhead type-safe wrappers (e.g., `value class UserId(val value: String)`). Use `enum class` for fixed finite sets. Do not use `!!` (non-null assertion) in production code because it crashes at runtime -- use `requireNotNull()` with a descriptive message or safe alternatives (`?.`, `?:`, `let`).

3. **Model concurrency with structured coroutines and explicit scope ownership** because unscoped coroutines leak resources and hide lifecycle bugs. Always launch coroutines in a scope with clear ownership (`viewModelScope`, `lifecycleScope`, or a custom `CoroutineScope` tied to a component's lifecycle). Use `supervisorScope` when child failures should not cancel siblings. Use `coroutineScope` when any child failure should cancel all siblings. Do not use `GlobalScope` because it breaks structured concurrency guarantees.

4. **Select dispatchers deliberately for each workload type** because using the wrong dispatcher blocks threads or wastes resources. Use `Dispatchers.Main` for UI updates only. Use `Dispatchers.IO` for blocking I/O (network, disk, JDBC). Use `Dispatchers.Default` for CPU-intensive computation. Use `limitedParallelism(n)` to create a confined dispatcher for resources with limited concurrency (e.g., a database connection pool with 10 connections). Use `withContext()` to switch dispatchers within a coroutine.

5. **Use Flow for reactive data streams with proper lifecycle awareness** because hot subscriptions that outlive their consumer cause memory leaks. Use `StateFlow` for observable state with a current value. Use `SharedFlow` for event streams without replay. Use `stateIn()` and `shareIn()` with `SharingStarted.WhileSubscribed(5000)` to share upstream flows efficiently and stop collection when no subscribers exist. Use `flowOn()` to shift upstream execution context. Handle backpressure with `conflate()`, `buffer()`, or `collectLatest`.

6. **Respect cancellation throughout the coroutine call chain** because ignoring cancellation causes resource leaks and delays shutdown. Check `isActive` in CPU-bound loops. Let `CancellationException` propagate without catching it. Use `withTimeout()` or `withTimeoutOrNull()` for deadline-based operations. Use `ensureActive()` at checkpoints in long-running computations. Use `NonCancellable` context only for cleanup logic in `finally` blocks.

7. **Structure Compose UI with unidirectional data flow** because bidirectional state mutation causes inconsistent UI and hard-to-trace bugs. Hoist state to the nearest common ancestor. Pass state down as parameters and events up as lambda callbacks. Use `remember` and `derivedStateOf` to minimize recomposition. Keep `@Composable` functions small and focused. Use `LaunchedEffect` for coroutine side effects tied to composition lifecycle. Use `rememberCoroutineScope()` for event-handler-initiated coroutines.

8. **Design Kotlin Multiplatform modules with thin platform layers** because heavy platform-specific code defeats the purpose of sharing. Define interfaces in `commonMain` using `expect`/`actual` for platform abstractions. Use `kotlinx.serialization` for cross-platform serialization (not Gson or Jackson in shared code). Use `kotlinx.datetime` instead of `java.time` in shared modules. Use `Ktor` client with engine injection for cross-platform networking.

9. **Write extension functions and DSLs with restraint** because overuse makes code harder to discover and debug. Prefer member functions for core type behavior. Use extensions for cross-cutting utilities that do not need access to private state. Scope extensions to the narrowest visibility (`internal` or `private`). Use receiver-based DSL builders (e.g., `buildList { }`, `apply { }`) for configuration APIs. Mark DSL scopes with `@DslMarker` to prevent accidental scope leakage.

10. **Handle errors with sealed result types instead of exceptions for expected failures** because exceptions are expensive to create (stack trace capture) and invisible in type signatures. Define `sealed interface Result<out T>` with `Success` and `Failure` variants. Use exceptions only for truly exceptional conditions (programming errors, infrastructure failures). Use `runCatching` sparingly because it catches `CancellationException` which breaks structured concurrency -- always rethrow it.

11. **Write tests that verify concurrent behavior correctly** because coroutine timing bugs are invisible in sequential tests. Use `runTest` from `kotlinx-coroutines-test` for coroutine testing with virtual time. Use `Turbine` for testing Flow emissions and completion. Inject dispatchers via constructor parameters so tests can use `UnconfinedTestDispatcher` or `StandardTestDispatcher`. Use `TestScope.advanceUntilIdle()` to process all pending coroutines. Test Compose UI with `ComposeTestRule` and semantic matchers.

12. **Configure Kotlin compiler options for safety and performance** because defaults are lenient for backward compatibility. Enable `-Xjvm-default=all` for interface methods with default implementations. Enable `-opt-in=kotlin.RequiresOptIn` to use experimental APIs explicitly. Use `-progressive` mode to get future deprecation warnings early. In Kotlin 2.1+, use the K2 compiler for faster compilation and improved type inference.

13. **Use `kotlinx.serialization` correctly for data interchange** because incorrect configuration causes runtime crashes or security issues. Annotate classes with `@Serializable`. Use `@SerialName` when wire format differs from property names. Use `@Transient` for computed properties. Configure `Json { ignoreUnknownKeys = true }` for forward-compatible parsing. Use sealed class serialization with `@SerialName` discriminators for polymorphic types.

14. **Enforce code quality with detekt and ktlint** because consistent style reduces review friction and catches bugs early. Configure detekt with `complexity`, `coroutines`, and `exceptions` rule sets. Use ktlint for formatting enforcement. Run both in CI as pre-merge checks. Suppress rules with `@Suppress` annotations only with a comment explaining why.

15. **Optimize with measurement, not intuition** because Kotlin's inline functions, value classes, and coroutine machinery have non-obvious performance characteristics. Use `Sequence` for lazy evaluation of large collections; `List` for small eager operations. Use `inline` functions for lambdas in hot paths to eliminate allocation overhead. Use `value class` for primitive wrappers to avoid boxing. Profile with `async-profiler` or Android Studio Profiler before micro-optimizing.

16. **Manage dependencies with version catalogs and BOM alignment** because transitive dependency conflicts cause runtime `NoSuchMethodError` and `ClassNotFoundException`. Use Gradle version catalogs (`libs.versions.toml`) for centralized version management. Align Kotlin, coroutines, and serialization versions using the Kotlin BOM. Use `dependencyResolutionManagement` in `settings.gradle.kts` to enforce repository declarations. Run `./gradlew dependencies` to audit the resolution tree.

## Output Format

Produces Kotlin code using data classes, sealed hierarchies, structured coroutines with explicit scope ownership, and Flow-based reactive patterns. Code follows non-null-by-default conventions, uses value classes for type safety, and separates platform-specific implementations behind expect/actual declarations. Includes coroutine-aware test patterns.

## References

| File | Load when |
| --- | --- |
| `references/coroutines.md` | Structured concurrency, scope management, dispatcher selection, cancellation, or timeout patterns. |
| `references/multiplatform.md` | KMP module setup, expect/actual patterns, shared serialization, or platform-specific implementations. |
| `references/testing.md` | Coroutine testing with runTest, Flow testing with Turbine, Compose testing, or test architecture. |
| `references/dsl-patterns.md` | DSL builder design, @DslMarker, receiver types, or type-safe configuration APIs. |
| `references/interop.md` | Java-Kotlin interop, annotation processing, JVM target compatibility, or migration patterns. |

## Copilot Platform Notes

- Skill files are stored under `.github/prompts/` (prompt files) and `.github/instructions/` (instruction files).
- Copilot does not support subagent spawning — all skill guidance executes within the current conversation context.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context`, `agent`, and `allowed-tools` are not supported; guidance is advisory only.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
