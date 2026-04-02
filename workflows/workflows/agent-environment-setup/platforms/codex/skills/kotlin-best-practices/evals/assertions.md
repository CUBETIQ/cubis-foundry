# Kotlin Best Practices - Eval Assertions

## Eval 1: Coroutine-Based Service Implementation

This eval tests the skill's ability to design a concurrent service layer with structured concurrency, timeouts, and graceful degradation.

### Assertions

1. **Uses supervisorScope for independent parallel calls** -- The 3 enrichment API calls are independent, so one failure should not cancel the others. `supervisorScope` or launching `async` within a `SupervisorJob` allows sibling coroutines to complete even when one fails. Using plain `coroutineScope` would cancel all siblings on the first failure, which contradicts the graceful degradation requirement.

2. **Applies timeouts at both overall and individual levels** -- The 2-second deadline for the entire operation should use `withTimeout(2000)` or `withTimeoutOrNull(2000)` wrapping all parallel calls. Individual API calls should also have timeouts to prevent one slow call from consuming the entire budget. `withTimeoutOrNull` is preferred for individual calls to enable partial results.

3. **Models partial success with sealed types** -- When some enrichment calls fail or time out, the service should return partial data rather than failing entirely. A sealed class (e.g., `sealed interface EnrichmentResult`) or nullable fields with documentation captures which data is available. Raw exceptions should not leak to the caller.

4. **Uses Dispatchers.IO for blocking calls** -- Network and database calls must run on `Dispatchers.IO` via `withContext(Dispatchers.IO)` to avoid blocking the caller's dispatcher. Blocking `Dispatchers.Default` (the computation pool) with I/O calls would starve CPU-bound coroutines.

5. **Does not catch CancellationException** -- Structured concurrency relies on `CancellationException` propagating correctly. Code that catches `Exception` broadly (e.g., in `runCatching`) accidentally catches `CancellationException`, breaking cancellation. The response must either avoid catching it or explicitly rethrow it.

## Eval 2: Multiplatform Module Design

This eval tests the skill's ability to architect a Kotlin Multiplatform module with proper source set separation and cross-platform patterns.

### Assertions

1. **Correct KMP source set structure** -- The Gradle configuration must define `commonMain`, `androidMain`, and `iosMain` source sets within the shared module. This is the fundamental KMP architecture. The build file should use `kotlin { sourceSets { } }` DSL with proper dependency declarations.

2. **Sealed types in commonMain** -- Domain modeling with sealed classes/interfaces belongs in `commonMain` because it is pure Kotlin with no platform dependencies. Each order state variant should be a `data class` carrying state-specific data. The compiler enforces exhaustive `when` matching across all platforms.

3. **Repository interface returning Flow** -- The repository abstraction in `commonMain` should return `Flow<T>` for reactive data access. `Flow` is part of `kotlinx.coroutines` which is available in `commonMain`. The actual database implementation lives in platform source sets, but the interface is shared.

4. **kotlinx.serialization for API models** -- Cross-platform serialization must use `kotlinx.serialization` (not Gson, Moshi, or Jackson, which are JVM-only). Models should be annotated with `@Serializable` in `commonMain`. The serialization plugin must be applied in the Gradle build.

5. **expect/actual for platform logging** -- Platform-specific functionality like logging requires the `expect`/`actual` mechanism. An `expect fun log(message: String)` in `commonMain` has `actual fun log(message: String)` implementations in `androidMain` (using Android `Log`) and `iosMain` (using `NSLog` or `println`). This demonstrates the standard pattern for platform abstraction in KMP.
