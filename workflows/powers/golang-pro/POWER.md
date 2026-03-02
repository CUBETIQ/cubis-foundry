````markdown
---
inclusion: manual
name: "golang-pro"
description: "Use for modern Go services and tooling with Go 1.26-era language/runtime patterns, concurrency safety, and production operations."
license: MIT
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "go"
  baseline: "Go 1.26"
---

# Golang Pro

## When to use

- Building APIs, workers, CLIs, and microservices in Go.
- Designing concurrency with goroutines/channels/context.
- Optimizing latency, allocations, and reliability.

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

## Avoid

- Fire-and-forget goroutines without cancellation path.
- Panic-based control flow.
- Over-generalized interfaces without real callers.

## Reference files

- `references/concurrency.md`
- `references/generics.md`
- `references/interfaces.md`
- `references/testing.md`
- `references/project-structure.md`
````
