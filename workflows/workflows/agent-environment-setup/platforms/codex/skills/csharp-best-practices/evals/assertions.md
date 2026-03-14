# C# Best Practices — Eval Assertions

## Eval 1: Minimal API with Records

Tests whether the agent produces idiomatic .NET 9 minimal API design with modern C# features.

### Assertions

1. **record-types-for-dtos** — Request and response models use `record` (e.g., `public record CreateOrderRequest(string CustomerName, List<OrderLineItem> Items)`) or `record struct` for small value types. Properties should use `required` where initialization is mandatory. Reject plain `class` DTOs with `{ get; set; }` — these lack value equality and encourage mutation.

2. **typed-results-on-endpoints** — Endpoint methods return `Results<T1, T2, ...>` with specific `TypedResults` variants (e.g., `TypedResults.Ok(response)`, `TypedResults.NotFound()`, `TypedResults.ValidationProblem(errors)`). This provides OpenAPI schema generation without manual attributes and compile-time verification of all return paths. Reject endpoints returning `IResult` or `object`.

3. **di-lifetime-correctness** — The service registration code uses `builder.Services.AddScoped<IOrderRepository, OrderRepository>()` for per-request database access, `AddTransient` for stateless operations, and `AddSingleton` for shared, thread-safe caches. Reject code that registers a scoped service and injects it into a singleton, which would cause a captive dependency (stale DbContext, connection leaks).

4. **nullable-annotations** — The project enables `<Nullable>enable</Nullable>`. Optional response fields use `string?`, required fields use `string` (non-nullable). Pattern matching with null checks (`if (order is null)`) or `[NotNullWhen]` attributes on try-methods preserves compiler flow analysis. Reject code that uses `!` (null-forgiving) liberally without justification.

5. **cancellation-token-propagation** — Every async endpoint handler has `CancellationToken cancellationToken` as a parameter (minimal API binds it automatically from the request). The token is passed through `await _repository.GetByIdAsync(id, cancellationToken)` and all downstream calls. Reject code that uses `default` or omits the token from inner calls.

---

## Eval 2: Async Stream Processing

Tests whether the agent builds a correct IAsyncEnumerable pipeline with cancellation and error handling.

### Assertions

1. **iasyncenumerable-pipeline** — Each pipeline stage is a method or extension method with signature like `IAsyncEnumerable<TOut> Transform(this IAsyncEnumerable<TIn> source, ...)`. Stages compose by chaining: `source.Filter(...).Enrich(...).Batch(100).WriteTo(sink)`. Reject implementations that buffer everything into a `List<T>` before processing — that defeats the streaming benefit.

2. **cancellation-with-enumerator-token** — Methods use `[EnumeratorCancellation] CancellationToken ct = default` on the generator parameter and pass it to all awaited operations inside the `await foreach` or `yield` loop. When the consumer stops enumerating (e.g., due to cancellation), the producer's finally block runs for cleanup. Reject code that ignores cancellation in yield loops.

3. **batching-with-backpressure** — The batching stage accumulates items into a `List<T>` or array up to a configured batch size, then yields the batch as `IReadOnlyList<T>`. The upstream producer naturally pauses when the downstream consumer has not yet requested the next batch (cooperative pull-based backpressure). Accept time-based flushing as a bonus. Reject fire-and-forget patterns with unbounded queues.

4. **structured-error-handling** — Individual item failures are caught within the processing loop and handled (logged, counted, or sent to a dead-letter queue) without stopping the entire pipeline. Pipeline-level errors (connection loss, cancellation) propagate to the caller. Reject bare `catch (Exception)` that swallows all errors silently.

5. **testable-stage-isolation** — Tests create in-memory async enumerables using `async IAsyncEnumerable<T>` generator methods or helper factories. Each stage is tested independently: filter stage is tested with known items and expected output count, batching stage is tested with exact batch boundary conditions (e.g., 10 items with batch size 3 yields batches of [3, 3, 3, 1]). Tests include cancellation scenarios.
