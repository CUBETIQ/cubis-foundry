---
name: golang-best-practices
description: "Use when writing production Go 1.24+ code: generics with constraints, structured concurrency via errgroup and context, comprehensive error handling with wrapped sentinels, and performance-profiled service design."
allowed-tools: Read Grep Glob Bash Edit Write
user-invocable: true
argument-hint: "Go module, package, or pattern to analyze"
---

# Golang Best Practices

## Purpose

Production-grade guidance for Go 1.24+ covering generics with practical constraints, structured concurrency using errgroup and context propagation, comprehensive error handling with sentinel values and wrapped chains, module design for libraries and services, and performance profiling discipline with pprof and benchmarks.

## When to Use

- Building APIs, workers, CLIs, or microservices in Go 1.24+.
- Designing concurrent systems with goroutines, channels, and context cancellation.
- Implementing error handling strategies with wrapping, sentinels, and custom types.
- Structuring Go modules for internal libraries or public packages.
- Profiling and optimizing allocation-sensitive or latency-critical paths.

## Instructions

1. **Accept interfaces, return structs** — define small interfaces (1–3 methods) at the call site, not the implementation site, because Go interfaces are implicitly satisfied and defining them at the consumer avoids coupling to implementation details. Return concrete types so callers get full access without type assertion.

2. **Pass `context.Context` as the first parameter everywhere** — every function that touches the network, disk, or a database must accept `ctx context.Context` as its first argument. Never store a context in a struct field because contexts carry request-scoped deadlines and cancellation signals that become stale when the struct outlives the request.

3. **Wrap errors with `fmt.Errorf("operation: %w", err)`** — use `%w` to create error chains that `errors.Is` and `errors.As` can traverse. Define sentinel errors (`var ErrNotFound = errors.New("not found")`) for well-known failure modes. Create custom error types when the caller needs structured data (HTTP status, retry hint) because stringly-typed error matching breaks on rewording.

4. **Use `errgroup.Group` for coordinated fan-out** — replace manual `sync.WaitGroup` + channel error collection with `errgroup.Group` because it propagates the first error and cancels sibling goroutines via the derived context. Set concurrency limits with `g.SetLimit(n)` to prevent resource exhaustion.

5. **Bound every goroutine's lifetime** — never launch a goroutine without a cancellation path. Use `select` with `ctx.Done()` in loops and `defer cancel()` at the launch site. Leaked goroutines are the Go equivalent of memory leaks and they do not show up in standard tests; use `goleak` in CI to detect them.

6. **Choose channels for ownership transfer, mutexes for shared state** — channels excel when one goroutine produces a value and another consumes it. Use `sync.Mutex` or `sync.RWMutex` when multiple goroutines read/write the same struct field because channels for shared-state access create unnecessary complexity and deadlock risk.

7. **Apply generics when the abstraction covers 3+ concrete types** — write `func Map[S any, T any](s []S, f func(S) T) []T` when the function genuinely applies to multiple types. Avoid generics for 1–2 callers because the cognitive overhead exceeds the duplication cost. Limit type parameter lists to 2–3 parameters; if you need more, decompose.

8. **Use `iter.Seq` and `iter.Seq2` for lazy iteration (Go 1.23+)** — implement range-over-function iterators for collections that should not allocate a full slice. This replaces callback-based iteration with a first-class language construct because range-func is composable and works with `break`/`continue`.

9. **Test with table-driven subtests and race detection** — structure tests as `[]struct{ name string; input X; want Y }` with `t.Run(tc.name, ...)` for each case. Run `go test -race -count=1 ./...` in CI because the race detector catches data races that are invisible to functional tests. Use `t.Parallel()` where safe to speed up the suite.

10. **Benchmark before optimizing** — write `func BenchmarkX(b *testing.B)` with `b.ReportAllocs()` and `b.ResetTimer()` to isolate the hot path. Use `go tool pprof` (CPU, heap, goroutine, block, mutex profiles) for production profiling. Never optimize based on intuition because Go's escape analysis and GC behavior make allocation patterns non-obvious.

11. **Structure modules with internal packages** — use `internal/` to hide implementation details from external consumers. Keep `cmd/` for entry points, `pkg/` only if the code is genuinely reusable outside the module, and domain packages at the root. Avoid `util` or `common` packages because they become dumping grounds with no cohesion.

12. **Lint with `golangci-lint` and enforce in CI** — enable `govet`, `staticcheck`, `errcheck`, `gosec`, `revive`, `gocritic`, and `exhaustive` at minimum. Use `gofumpt` for stricter formatting than `gofmt`. Treat lint failures as CI failures because linter findings in merged code are much more expensive to fix.

13. **Build reproducible binaries** — use `go build -trimpath -ldflags='-s -w -X main.version=v1.2.3'` for release builds. Keep `go.mod` tidy with `go mod tidy`. Use multi-stage Docker builds or `ko` for container images because they produce minimal images without a Go toolchain.

14. **Instrument with OpenTelemetry** — add tracing spans at service boundaries and structured logging with `slog` (Go 1.21+). Attach trace IDs, request IDs, and operation names to every log entry because correlated telemetry is the fastest path to diagnosing production incidents.

## Output Format

Produces Go code following standard project layout with explicit error handling, context propagation, errgroup-based concurrency, and table-driven tests. Includes module structure guidance, benchmark setups, and inline comments explaining concurrency and error design choices.

## References

| File | Load when |
| --- | --- |
| `references/concurrency.md` | Goroutine management, channels, errgroup, or context cancellation patterns needed. |
| `references/error-handling.md` | Error wrapping, sentinel errors, custom error types, or error middleware needed. |
| `references/testing.md` | Table-driven tests, race detection, benchmarks, or test fixtures needed. |
| `references/module-design.md` | Package layout, internal packages, dependency management, or API surface needed. |
| `references/performance.md` | Profiling, allocation analysis, escape analysis, or GC tuning needed. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Design the error handling strategy for this Go API with custom error types and middleware-based error mapping."
- "Refactor this unbounded goroutine fan-out into an errgroup worker pool with context cancellation and concurrency limits."
- "Set up a benchmark suite with pprof integration to identify allocation hot spots in this parser."

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
