---
name: "golang-pro"
description: "Use for modern Go services and tooling with Go 1.26-era language/runtime patterns, concurrency safety, and production operations."
license: MIT
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "go"
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  baseline: "Go 1.26"
  tags: ["go", "golang", "concurrency", "services", "tooling"]
---

# Golang Pro

## When to use

- Building APIs, workers, CLIs, and microservices in Go.
- Designing concurrency with goroutines/channels/context.
- Optimizing latency, allocations, and reliability.

## When not to use

- Database-only tuning with no Go code change.
- Browser/frontend tasks outside Go-backed services or tooling.
- Small shell automation already well-covered by existing scripts.

## Core workflow

1. Define package boundaries and interfaces.
2. Implement with explicit error handling and context propagation.
3. Add tests and race checks for behavior under load.
4. Profile before optimization.

## Baseline standards

- Keep APIs context-aware: pass `context.Context` first.
- Handle every error with actionable wrapping.
- Use table-driven tests and subtests for logic coverage.
- Run `go test -race` for concurrency-sensitive paths.
- Prefer composition over deep inheritance-like abstractions.

## Implementation guidance

- Use channels for ownership transfer, not shared mutation.
- Choose sync primitives deliberately (`Mutex`, `RWMutex`, `atomic`).
- Keep goroutine lifecycles bounded with cancellation.
- Use generics where they simplify, not where they obscure.
- Benchmark hot paths (`testing.B`, `pprof`) before tuning.

## Debugging and observability

- Thread request IDs and trace context through handlers and workers.
- Use structured logs that make cancellation, retries, and deadlines visible.
- Reproduce concurrency issues with race tests and deterministic fixtures first.

## Performance and reliability

- Prefer bounded worker pools over unbounded goroutine fan-out.
- Make timeout/cancellation behavior explicit at every network boundary.
- Profile CPU, heap, and block contention before low-level rewrites.

## Avoid

- Fire-and-forget goroutines without cancellation path.
- Panic-based control flow.
- Over-generalized interfaces without real callers.

## Reference files

| File | Load when |
| --- | --- |
| `references/concurrency.md` | Concurrency ownership, channels, mutexes, or cancellation safety need detail. |
| `references/generics.md` | Generics tradeoffs or reusable type-safe helpers are in scope. |
| `references/interfaces.md` | Interface boundaries and package seams need review. |
| `references/testing.md` | Test strategy, race checks, or benchmark setup is needed. |
| `references/project-structure.md` | Package layout or service/module decomposition needs guidance. |
