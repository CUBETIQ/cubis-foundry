# Java Best Practices - Eval Assertions

## Eval 1: Virtual Threads Migration

This eval tests the skill's ability to guide a migration from platform thread pools to virtual threads with structured concurrency.

### Assertions

1. **Uses virtual thread executor** -- The migration must replace the fixed `ThreadPoolTaskExecutor` with `Executors.newVirtualThreadPerTaskExecutor()` or Spring Boot 3.2+'s `spring.threads.virtual.enabled=true`. Virtual threads eliminate the thread-per-request bottleneck by allowing millions of concurrent tasks on a small number of carrier threads.

2. **Replaces synchronized with ReentrantLock** -- `synchronized` blocks pin virtual threads to their carrier thread, negating the scalability benefit. The code must identify all `synchronized` usage in the request path and convert to `ReentrantLock.lock()`/`unlock()` in try-finally blocks. This is the most critical correctness issue in virtual thread adoption.

3. **Uses StructuredTaskScope for parallel calls** -- The 3 downstream HTTP calls should be forked within a `StructuredTaskScope.ShutdownOnFailure` so that if any call fails, the others are cancelled automatically. The scope must be used in a try-with-resources block with `scope.join()` and `scope.throwIfFailed()`.

4. **Warns about CPU-bound work** -- Virtual threads should not be used for computation-heavy tasks (JSON parsing of large payloads, encryption, image processing) because they share carrier threads. The response must explain this limitation and recommend keeping CPU-bound work on platform thread pools or `ForkJoinPool`.

5. **Includes monitoring guidance** -- Virtual thread debugging differs from platform threads. The response should mention JDK Flight Recorder (JFR) events for virtual threads, `jcmd Thread.dump_to_file` for structured thread dumps, or testing strategies to verify the migration works under load.

## Eval 2: Domain Modeling with Sealed Classes

This eval tests the skill's ability to model a complex state machine using sealed classes, records, and pattern matching.

### Assertions

1. **Sealed interface with permits** -- The Payment type must be a `sealed interface` or `sealed class` with a `permits` clause explicitly listing all allowed subtypes (Pending, Authorized, Captured, Refunded, Declined, Cancelled). This makes the type hierarchy closed and enables exhaustive pattern matching.

2. **Records for state variants** -- Each payment state should be a `record` carrying only the data relevant to that state. For example, `Authorized` carries an auth code, `Captured` carries a capture timestamp. Records provide immutability and structural equality, which are ideal for state representations.

3. **Pattern matching switch for transitions** -- State transition logic should use Java 21's switch expression with pattern matching rather than instanceof chains or the visitor pattern. The compiler verifies exhaustiveness against the sealed hierarchy, catching missing cases at compile time.

4. **Guarded patterns for transition validation** -- Valid state transitions should be enforced using guarded patterns (`case Authorized a when isWithinAuthWindow(a)`) or explicit validation in the transition method. Invalid transitions (e.g., Refunded -> Authorized) should throw a descriptive exception.

5. **Serialization strategy for sealed hierarchy** -- Persisting and transmitting the payment hierarchy requires a discriminator-based serialization strategy. Jackson's `@JsonTypeInfo` with `@JsonSubTypes` is the standard approach. The response should show how to configure this for the sealed hierarchy so that deserialization produces the correct record subtype.
