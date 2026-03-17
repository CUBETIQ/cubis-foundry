---
name: csharp-best-practices
description: "Use when writing, reviewing, or refactoring modern C#/.NET code, including minimal APIs, records, async streams, pattern matching, DI lifetimes, and memory-efficient performance tuning."
---
# C# Best Practices

## Purpose

Production-grade guidance for C# 13 and .NET 9 application engineering. Covers minimal APIs with records and TypedResults, async streams and IAsyncEnumerable processing, source generators for compile-time code generation, advanced pattern matching, dependency injection with keyed services, and performance optimization with modern collection types and memory primitives.

## When to Use

- Building new .NET 9 APIs, workers, or services with minimal API patterns.
- Designing data pipelines with async streams and IAsyncEnumerable.
- Implementing source generators for compile-time code generation.
- Refactoring legacy C# toward records, pattern matching, and modern idioms.
- Optimizing hot paths with Span<T>, FrozenDictionary, and pool-based allocations.
- Reviewing C# code for async correctness, DI lifetime issues, or performance problems.

## Instructions

1. **Pin the target framework and C# language version in the project file** because .NET 9 enables C# 13 features by default but multi-targeting or SDK mismatches silently downgrade available features, leading to confusing compiler errors on collection expressions or `params` spans.

2. **Use records for immutable data contracts and DTOs** because `record` types provide value equality, `with` expressions for non-destructive mutation, and built-in `ToString` formatting. Use `record struct` for small value types (under 16 bytes) to avoid heap allocation. Use `required` properties on records that must be fully initialized at construction.

3. **Design minimal APIs with TypedResults for compile-time route contracts** because `TypedResults` (e.g., `Results<Ok<Order>, NotFound, ValidationProblem>`) give OpenAPI generators exact response schemas without runtime reflection, and the compiler verifies every return path matches the declared result types.

4. **Enable nullable reference types project-wide and treat warnings as errors** because nullable analysis catches null dereference bugs at compile time. Set `<Nullable>enable</Nullable>` and `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`. Use `[NotNullWhen]`, `[MaybeNullWhen]`, and `[NotNull]` attributes on bool-returning try-pattern methods to preserve flow analysis precision.

5. **Propagate CancellationToken through every async call chain** because missing tokens make services unresponsive to graceful shutdown and request cancellation. Every public async method takes `CancellationToken` as its last parameter. Use `ConfigureAwait(false)` in library code. Never use `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()` because these block the thread pool and cause deadlocks under load.

6. **Use IAsyncEnumerable for streaming data pipelines** because async streams process items as they arrive without buffering entire result sets in memory. Yield results with `await foreach` and pass `[EnumeratorCancellation] CancellationToken` to support cancellation. Compose pipelines with LINQ-style extension methods that accept and return `IAsyncEnumerable<T>`.

7. **Implement source generators for repetitive boilerplate** because source generators run at compile time and produce type-safe code without reflection overhead. Use incremental generators (`IIncrementalGenerator`) for performance. Test generators with the `Microsoft.CodeAnalysis.Testing` framework to verify emitted syntax against snapshots.

8. **Use pattern matching exhaustively with switch expressions** because the compiler verifies all cases are handled when switching on enums, tuples, or discriminated union hierarchies. Use relational patterns (`> 0 and < 100`), property patterns (`{ Status: OrderStatus.Active }`), and list patterns (`[var first, .., var last]`) to express complex conditions concisely.

9. **Wire dependency injection with explicit lifetime semantics** because lifetime mismatches cause captive dependencies, stale data, and memory leaks. Use `Transient` for stateless services, `Scoped` for per-request state, `Singleton` for shared caches. Use keyed services (`.AddKeyedSingleton<T>()`) for strategy/factory patterns. Never inject `Scoped` into `Singleton` — use `IServiceScopeFactory` when a singleton needs scoped work.

10. **Use IOptions<T> / IOptionsSnapshot<T> / IOptionsMonitor<T> for configuration** because raw configuration strings scattered through constructors resist validation and hot-reload. Validate options with `ValidateDataAnnotations()` or `ValidateOnStart()` to fail fast on misconfiguration rather than discovering bad values at runtime.

11. **Handle errors with middleware and Result<T> patterns** because consistent error responses require centralized handling, not scattered try-catch blocks. Use `IExceptionHandler` (ASP.NET 8+) for exception-to-ProblemDetails mapping. Use `Result<T, E>` for expected domain failures (validation, not-found) to keep the happy path clean.

12. **Use structured logging with semantic properties** because string-interpolated log messages defeat log aggregation and search. Use `ILogger` with message templates (`Log.Information("Order {OrderId} shipped", orderId)`) and attach correlation IDs via `Activity` or middleware for distributed tracing.

13. **Optimize hot paths with memory-efficient primitives** because heap allocations in tight loops cause GC pressure that degrades tail latency. Use `Span<T>` and `ReadOnlySpan<T>` for zero-copy slicing, `ArrayPool<T>.Shared` for buffer reuse, `FrozenDictionary<K,V>` for read-heavy lookup tables, and `SearchValues<T>` (.NET 8+) for vectorized character/byte scanning.

14. **Write tests with xUnit and Verify for snapshot testing** because parameterized theory tests and snapshot assertions catch regressions without brittle string comparisons. Use `WebApplicationFactory<T>` for integration tests, `NSubstitute` or `Moq` for unit-level fakes, and `Testcontainers` for database integration tests with real engines.

15. **Use collection expressions and params spans for cleaner call sites** because C# 13 collection expressions (`[1, 2, 3]`) work across `List<T>`, arrays, spans, and immutable collections with optimal codegen, while `params ReadOnlySpan<T>` eliminates array allocation for variadic methods.

16. **Run Roslyn analyzers and .NET SDK analyzers in CI** because static analysis catches threading bugs, API misuse, and security issues that tests miss. Enable `<AnalysisLevel>latest-all</AnalysisLevel>` and add `Microsoft.CodeAnalysis.NetAnalyzers` with `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.

## Output Format

Produces C# 13/.NET 9 code using records, pattern matching, minimal APIs with TypedResults, async streams, and explicit DI lifetimes. Includes nullable annotations, structured error handling, and test examples where relevant.

## References

| File | Load when |
| --- | --- |
| `references/modern-csharp.md` | You need records, pattern matching, collection expressions, primary constructors, or source generator patterns. |
| `references/async-patterns.md` | You need async/await design, IAsyncEnumerable pipelines, CancellationToken propagation, or ValueTask usage. |
| `references/testing.md` | You need xUnit patterns, WebApplicationFactory integration tests, snapshot testing, or Testcontainers setup. |
| `references/dependency-injection.md` | You need DI lifetime management, keyed services, IOptions patterns, or service resolution strategies. |
| `references/performance.md` | You need Span<T> optimization, FrozenDictionary, ArrayPool, BenchmarkDotNet, or allocation profiling guidance. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Design a minimal API endpoint with records, TypedResults, and proper DI for an order management service."
- "Build an async stream processing pipeline that reads from a database cursor and transforms records with backpressure."

## Gemini Platform Notes

- Workflow and agent routes are compiled into `.gemini/commands/*.toml` TOML command files.
- Commands use `{{args}}` for user input, `!{shell command}` for shell output, `@{file}` for file content.
- Specialists are internal postures (modes of reasoning), not spawned subagent processes.
- Gemini does not support `context: fork` — all skill execution is inline within the current session.
- Skills are loaded via MCP when the Cubis Foundry MCP server is configured. Local `.agents/skills/` paths serve as hints.
- User arguments are passed as natural language in the activation prompt.
- Rules file: `.gemini/GEMINI.md`.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when MCP is connected.
