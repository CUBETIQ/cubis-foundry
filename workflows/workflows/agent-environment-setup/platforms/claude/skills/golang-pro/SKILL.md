---
name: "golang-pro"
description: "Use for modern Go services and tooling with Go 1.26-era language/runtime patterns, concurrency safety, and production operations."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Golang Pro

## Purpose

Expert-level guidance for modern Go development covering APIs, workers, CLIs, and microservices. Focuses on explicit error handling, context-propagated concurrency, generics where they simplify, and production profiling discipline.

## When to Use

- Building APIs, workers, CLIs, and microservices in Go.
- Designing concurrency patterns with goroutines, channels, and context.
- Optimizing latency, allocations, and reliability in Go services.

## Instructions

1. **Define package boundaries and interfaces** — keep interfaces small and accept them where consumed, not where implemented. Prefer composition over deep inheritance-like abstractions.

2. **Pass `context.Context` as the first parameter** in all APIs that cross network or scheduling boundaries. Do not store contexts in structs because they represent request-scoped lifetimes.

3. **Handle every error with actionable wrapping** — wrap with `%w` for traceable error chains. Define sentinel errors for well-known failure conditions. Use custom error types when errors carry structured context. Do not discard errors silently; document any intentional discard with a comment. Do not use stringly-typed error comparisons (`err.Error() == "something"`) because sentinel values and type assertions are safer and refactor-proof.

4. **Design concurrency with clear ownership** — use channels for ownership transfer, not shared mutation. Choose sync primitives (`Mutex`, `RWMutex`, `atomic`) deliberately. Keep goroutine lifecycles bounded with cancellation via `select` with `ctx.Done()`. Bound worker pools with fixed goroutine counts reading from a shared channel. Use `errgroup.Group` for coordinated fan-out with shared error propagation.

5. **Use generics where they simplify** — generics serve well when the abstraction covers 3+ distinct types. Prefer concrete types when a function has only one or two callers because generics add cognitive cost. Avoid deeply nested type parameter lists; if a generic needs 4+ parameters, break it into smaller pieces.

6. **Test with table-driven subtests and race detection** — use `t.Run` for systematic input coverage. Run `go test -race -count=1 ./...` in CI. Use `httptest.NewServer` for HTTP handler tests. Use `t.Cleanup()` for teardown. Use `testing.B` benchmarks with `b.ReportAllocs()` to prove optimization impact.

7. **Lint and format consistently** — use `golangci-lint` with `govet`, `staticcheck`, `errcheck`, `gosec`, and `revive` at minimum. Enforce `gofmt`/`goimports` in CI. Use `gofumpt` for stricter formatting.

8. **Thread observability through the stack** — use structured logs with request IDs and trace context. Make cancellation, retries, and deadlines visible in logging. Reproduce concurrency issues with race tests and deterministic fixtures first.

9. **Profile before optimizing** — benchmark hot paths with `testing.B` and `b.ReportAllocs()`. Use `pprof` (CPU, heap, goroutine, block, mutex) for production profiling. Do not fire-and-forget goroutines without a cancellation path because they leak resources. Do not use panic-based control flow because it circumvents explicit error handling. Do not create over-generalized interfaces without real callers because they add indirection without value.

10. **Build for production** — use `go build -trimpath -ldflags='-s -w'` for release binaries. Keep `go.mod` tidy. Use `ko` or multi-stage Docker for container builds.

## Output Format

Produces Go code following standard project layout with explicit error handling, context propagation, and bounded concurrency patterns. Includes table-driven tests and structured error types where applicable.

## References

| File                              | Load when                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `references/concurrency.md`       | Concurrency ownership, channels, mutexes, or cancellation safety need detail. |
| `references/generics.md`          | Generics tradeoffs or reusable type-safe helpers are in scope.                |
| `references/interfaces.md`        | Interface boundaries and package seams need review.                           |
| `references/testing.md`           | Test strategy, race checks, or benchmark setup is needed.                     |
| `references/project-structure.md` | Package layout or service/module decomposition needs guidance.                |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Design the error handling strategy for this Go API service with custom error types and middleware-based error mapping."
- "Refactor this unbounded goroutine fan-out into a bounded worker pool with context cancellation."
- "Set up a table-driven test suite for this parser with race detection and benchmark coverage."
