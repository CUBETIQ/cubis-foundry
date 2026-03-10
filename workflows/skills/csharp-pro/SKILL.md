---
name: "csharp-pro"
description: "Use for modern C# backend/application engineering with C# 15 and .NET 11-era production practices."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# C# Pro

## Purpose

Expert-level guidance for modern C# backend and application engineering. Covers async/await patterns with cancellation, nullable reference types, records, dependency injection lifetimes, and production diagnostics using current .NET practices.

## When to Use

- Building APIs, workers, and services in .NET.
- Refactoring legacy C# into modern, testable architecture.
- Improving async correctness and operational resilience.

## Instructions

1. **Confirm target framework and language version** — establish .NET version (.NET 11 LTS, etc.) and C# language version constraints before choosing features.

2. **Define clean contracts with modern types** — use `record` for immutable DTOs and value objects. Use `record struct` for small value types to avoid heap allocation. Use primary constructors (C# 12+) for concise DI. Prefer `sealed` on classes not designed for inheritance. Use pattern matching (`is`, `switch` expressions) instead of type-checking cascades.

3. **Enable nullable reference types project-wide** — set `<Nullable>enable</Nullable>` and treat warnings as errors. Use null-forgiving (`!`) only at boundaries with external proof (deserialization, DI resolution). Use `required` modifier on properties that must be set at construction. Use `[NotNullWhen]` and `[MaybeNullWhen]` on bool-returning try-pattern methods.

4. **Implement async-first I/O with CancellationToken propagation** — every public async method takes `CancellationToken` as its last parameter. Use `ConfigureAwait(false)` in library code. Use `ValueTask<T>` when the common path completes synchronously. Use `await using` for `IAsyncDisposable` resources. Do not use `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()` in request paths because it causes threadpool starvation and deadlocks.

5. **Wire dependency injection with explicit lifetimes** — `Transient` for stateless, `Scoped` for per-request, `Singleton` for shared. Do not inject `Scoped` services into `Singleton` because it causes captive dependency and stale data. Use `IOptions<T>` / `IOptionsSnapshot<T>` / `IOptionsMonitor<T>` for configuration with proper reload semantics. Use `IServiceScopeFactory` when a Singleton needs to create scoped work.

6. **Handle errors consistently at boundaries** — use `IExceptionHandler` (ASP.NET 8+) or middleware for error-to-response mapping. Throw domain exceptions for business rule violations; use `Result<T>` patterns for expected failures. Use `ActivitySource` and `Activity` for distributed tracing. Log exceptions at the boundary, not at every catch. Do not catch `Exception` in deep code without rethrowing because it swallows unexpected errors.

7. **Observe and diagnose** — use structured logging (Serilog, Microsoft.Extensions.Logging) with request/job correlation IDs. Use `dotnet-counters`, `dotnet-trace`, and `dotnet-dump` for runtime diagnostics. Do not expose stack traces in production.

8. **Optimize with measurement** — use `dotnet-trace` or BenchmarkDotNet to identify allocation hotspots before changing data structures. Use `Span<T>`, `ReadOnlySpan<T>`, and `Memory<T>` for zero-copy slicing in hot paths. Use `ArrayPool<T>.Shared` over repeated allocations. Use `FrozenDictionary` / `FrozenSet` (.NET 8+) for read-heavy lookup tables.

9. **Validate with tests and analyzers** — use Roslyn analyzers and `dotnet test`. Bound retries and timeouts explicitly for network and queue work. Do not build fat controllers with mixed business logic and persistence because it resists testing. Do not use `string` concatenation in loops because `StringBuilder` or interpolated string handlers are more efficient. Do not ignore `CancellationToken` in long-running operations because it makes services unresponsive to shutdown. Do not use global static mutable state in multi-request services because it creates race conditions — use DI with proper lifetimes.

## Output Format

Produces C# code using records, nullable reference types, async/await with cancellation, and explicit DI lifetimes. Includes structured error handling and pattern matching where applicable.

## References

| File                                          | Load when                                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `references/operational-baseline.md`          | You need current async, logging, testing, and deployment guardrails for C#/.NET services.           |
| `references/async-await-patterns.md`          | You need async/await patterns, ValueTask usage, cancellation design, or threadpool management.      |
| `references/modern-csharp-features.md`        | You need patterns for records, pattern matching, primary constructors, or collection expressions.   |
| `references/dependency-injection-patterns.md` | You need DI lifetime management, keyed services, option patterns, or service resolution strategies. |
| `references/testing-and-analyzers.md`         | You need testing patterns, analyzer configuration, BenchmarkDotNet setup, or CI validation.         |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Refactor this controller to use async/await with CancellationToken propagation and proper DI lifetime management."
- "Enable nullable reference types in this project and fix all the null-safety warnings with appropriate patterns."
- "Design the error handling middleware for this ASP.NET API using IExceptionHandler and Result<T> patterns."
