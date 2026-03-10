---
name: "csharp-pro"
description: "Use for modern C# backend/application engineering with C# 14 and .NET 10-era production practices."
license: MIT
metadata:
  version: "1.0.0"
  domain: "language"
  role: "specialist"
  stack: "csharp"
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  baseline: "C# 14 / .NET 10"
  tags: ["csharp", "dotnet", "async", "apis", "services"]
---

# C# Pro

## When to use

- Building APIs, workers, and services in .NET.
- Refactoring legacy C# into modern, testable architecture.
- Improving async correctness and operational resilience.

## When not to use

- Frontend-only browser work with no .NET runtime.
- Database-only tuning where query/schema evidence is the primary task.
- Tiny scripting tasks better served by existing shell or project tooling.

## Core workflow

1. Confirm target framework/runtime (.NET 10 LTS vs .NET 9, etc.) and language version constraints.
2. Define clean contracts — DTOs, domain types, persistence boundaries — using records and interfaces.
3. Implement async-first I/O with `CancellationToken` propagation through the call chain.
4. Wire dependency injection with explicit lifetimes (Scoped, Transient, Singleton).
5. Validate with `dotnet test`, Roslyn analyzers, and allocation profiling before shipping.

## Async and cancellation

- Every public async method takes `CancellationToken` as its last parameter.
- Use `ConfigureAwait(false)` in library code (not in ASP.NET controller code — context is managed).
- Never use `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()` in request paths — causes threadpool starvation and deadlocks.
- Use `ValueTask<T>` when the common path completes synchronously (cache hits, buffered reads).
- Prefer `await using` for `IAsyncDisposable` resources (DB connections, HTTP clients).
- Use `Task.WhenAll` for independent concurrent operations; `Task.WhenAny` for timeouts and races.
- Bind retries/timeouts explicitly with Polly or `CancellationTokenSource.CreateLinkedTokenSource`.

## Nullable reference types

- Enable `<Nullable>enable</Nullable>` project-wide and treat warnings as errors.
- Use null-forgiving (`!`) only at the boundary where you have external proof (deserialization, DI resolution).
- Prefer `string.IsNullOrEmpty()` over `== null` checks when empty and null should be treated the same.
- Use `required` modifier (C# 11+) on properties that must be set at construction.
- Use `[NotNullWhen]`, `[MaybeNullWhen]` attributes on bool-returning try-pattern methods.

## Records and modern type design

- Use `record` for immutable DTOs and value objects — gets `Equals`, `GetHashCode`, `ToString`, `with` for free.
- Use `record struct` for small value types (coordinates, identifiers) to avoid heap allocation.
- Use `init`-only properties for types that should be immutable after construction.
- Use primary constructors (C# 12+) for concise DI and simple types.
- Prefer `sealed` on classes that aren't designed for inheritance.
- Use pattern matching (`is`, `switch` expressions) instead of type-checking cascades.

## Dependency injection

- Register services with the narrowest lifetime: `Transient` for stateless, `Scoped` for per-request, `Singleton` for shared.
- Never inject `Scoped` services into `Singleton` — causes captive dependency and stale data.
- Use `IOptions<T>`, `IOptionsSnapshot<T>`, or `IOptionsMonitor<T>` for configuration with proper reload semantics.
- Prefer constructor injection; use `[FromKeyedServices]` (C# 12+) for keyed/named registrations.
- Use `IServiceScopeFactory` when a Singleton needs to create scoped work.

## Error handling

- Use `IExceptionHandler` (ASP.NET 8+) or middleware for consistent error-to-response mapping.
- Throw domain exceptions for business rule violations; use `Result<T>` patterns for expected failures.
- Use `ActivitySource` and `Activity` for distributed tracing instead of rolling custom correlation.
- Log exceptions at the boundary, not at every catch — avoid duplicated log noise.

## Debugging and observability

- Use structured logging (Serilog, Microsoft.Extensions.Logging) with request/job correlation IDs.
- Keep exception-to-response mapping explicit and non-leaky — never expose stack traces in production.
- Use `dotnet-counters`, `dotnet-trace`, and `dotnet-dump` for runtime diagnostics.
- Prefer `dotnet test`, analyzers, and targeted traces before speculative rewrites.

## Performance and reliability

- Measure allocation hotspots with `dotnet-trace` or BenchmarkDotNet before changing data structures.
- Use `Span<T>`, `ReadOnlySpan<T>`, and `Memory<T>` for zero-copy slicing in hot paths.
- Prefer `ArrayPool<T>.Shared` over repeated allocations in buffer-heavy code.
- Use `FrozenDictionary<K,V>` / `FrozenSet<T>` (.NET 8+) for read-heavy lookup tables.
- Propagate `CancellationToken` through request and worker paths.
- Bound retries/timeouts explicitly for network and queue work.

## References

| File                                          | Load when                                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `references/operational-baseline.md`          | You need current async, logging, testing, and deployment guardrails for C#/.NET services.           |
| `references/async-await-patterns.md`          | You need async/await patterns, ValueTask usage, cancellation design, or threadpool management.      |
| `references/modern-csharp-features.md`        | You need patterns for records, pattern matching, primary constructors, or collection expressions.   |
| `references/dependency-injection-patterns.md` | You need DI lifetime management, keyed services, option patterns, or service resolution strategies. |
| `references/testing-and-analyzers.md`         | You need testing patterns, analyzer configuration, BenchmarkDotNet setup, or CI validation.         |

## Avoid

- Sync-over-async (`.Result`, `.Wait()`) in request paths — causes deadlocks and threadpool starvation.
- Fat controllers with business logic and persistence mixed — separate into services and handlers.
- Global static mutable state in multi-request services — use DI with proper lifetimes.
- Catching `Exception` in deep code without rethrowing — swallows unexpected errors.
- `string` concatenation in loops — use `StringBuilder` or interpolated string handlers.
- Ignoring `CancellationToken` in long-running operations — makes services unresponsive to shutdown.
