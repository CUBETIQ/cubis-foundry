---
name: "rust-pro"
description: "Use for modern Rust systems/services with stable 1.94-era patterns, async correctness, and performance-focused design."
license: MIT
metadata:
  author: cubis-foundry
  version: "2.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Rust Pro

## Purpose

Expert-level guidance for modern Rust development covering high-reliability services, CLIs, and systems components. Focuses on ownership and lifetime design, async correctness with cancellation safety, explicit error modeling, and performance optimization through profiling discipline.

## When to Use

- Building high-reliability services, CLIs, and systems components in Rust.
- Solving ownership, lifetime, and borrowing design problems.
- Optimizing memory safety and runtime performance together.

## Instructions

1. **Define ownership and error model first** — design data flow so each value has one clear owner. Clone only when shared ownership is genuinely required. Keep borrow scopes tight. Use `Cow<'_, T>` when a function sometimes needs to allocate and sometimes can borrow. Avoid lifetime annotations in public APIs unless the caller truly controls the borrowed data's scope.

2. **Choose async runtime and crates intentionally** — use `tokio` as the default async runtime. Pin to a specific runtime version in `Cargo.lock`. Make every async function cancellation-safe: dropping a future must not corrupt state. Use `tokio::select!` with care because the unselected branch is dropped and state mutations before `.await` are lost.

3. **Model errors as enums with context** — use `thiserror` for library error enums exposed in public APIs; `anyhow` for application-level error propagation. Use `?` for propagation with `.context()` / `.with_context()` at layer boundaries. Map foreign errors into domain types at crate boundaries. Do not use `.unwrap()` or `.expect()` outside tests and provably-infallible paths because they cause panics in production. Do not leak dependency error types across crate boundaries because it couples consumers to transitive dependencies.

4. **Design traits and types for the problem** — model closed variant sets with enums and exhaustive `match`. Use trait objects (`dyn Trait`) only at plugin or boundary points. Implement `From`/`Into` for natural conversions, `TryFrom`/`TryInto` for fallible ones. Keep trait surfaces small. Use newtype wrappers (`struct UserId(u64)`) to prevent primitive type confusion.

5. **Implement in small composable modules** — use `tokio`/`axum`/`tower` patterns for service work. Use `tower` middleware for timeouts, rate limits, and retries at the service boundary. Separate transport DTOs from domain types. Keep `Send + Sync` bounds explicit in trait objects and spawned tasks.

6. **Keep `unsafe` minimal and documented** — document invariants for every `unsafe` block. Prefer safe abstractions. Do not use premature `unsafe` optimization because the compiler and optimizer handle most cases.

7. **Verify with tests, clippy, and formatting** — maintain `rustfmt` + `clippy` clean in CI. Use `cargo test` and targeted benchmarks. Make task cancellation, retries, and error chains visible in `tracing` instrumentation. Prefer iterator/trait composition over macro-heavy complexity.

8. **Profile before low-level optimization** — measure allocations, lock contention, and tail latency before unsafe or low-level tuning. Bound work queues and connection pools explicitly. Do not use unbounded `tokio::spawn` fan-out without backpressure because it exhausts resources. Do not use `Arc<Mutex<T>>` when a channel-based ownership transfer would be clearer because it adds unnecessary contention. Do not use global mutable state for request data because it creates race conditions.

## Output Format

Produces Rust code with explicit ownership design, structured error enums, cancellation-safe async patterns, and bounded concurrency. Includes trait-based abstractions and newtype wrappers where applicable.

## References

| File                                    | Load when                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `references/ownership-and-borrowing.md` | Ownership transfer, borrow scope design, lifetime annotations, or `Cow`/`Arc` tradeoffs need detail.       |
| `references/async-safety-patterns.md`   | Cancellation safety, `select!` pitfalls, structured concurrency, or runtime configuration need detail.     |
| `references/error-handling-design.md`   | Error enum design, `thiserror`/`anyhow` layering, context chains, or foreign error mapping need detail.    |
| `references/trait-design-patterns.md`   | Trait object vs enum dispatch, newtype patterns, `From`/`Into` design, or generic constraints need detail. |
| `references/unsafe-and-ffi-guide.md`    | Unsafe blocks, FFI boundaries, raw pointer invariants, or soundness documentation need detail.             |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Design the error type hierarchy for this multi-crate workspace with thiserror for libraries and anyhow at the application layer."
- "Refactor this async handler to be cancellation-safe when using tokio::select! with shared state."
- "Implement a bounded worker pool with backpressure using tokio channels and a semaphore."
