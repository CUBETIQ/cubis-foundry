---
name: "rust-pro"
description: "Use for modern Rust systems/services with stable 1.91-era patterns, async correctness, and performance-focused design."
license: MIT
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "rust"
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  aliases: ["rust-engineer"]
  baseline: "Rust stable 1.91"
  tags: ["rust", "async", "systems", "performance", "services"]
---

# Rust Pro

## When to use

- Building high-reliability services, CLIs, and systems components.
- Solving ownership/lifetime design problems.
- Optimizing memory safety and runtime performance together.

## When not to use

- Browser/frontend-only work with no Rust component.
- Database-only tuning without Rust service or library changes.
- Small scripts where shell or existing project tooling is the intended path.

## Core workflow

1. Define ownership and error model first.
2. Choose async/runtime crates intentionally.
3. Implement small composable modules.
4. Verify with tests, clippy, and formatting.
5. Profile before low-level optimization.

## Baseline standards

- `rustfmt` + `clippy` clean in CI.
- Use explicit error types (`thiserror`/`anyhow` by layer).
- Keep `unsafe` minimal and documented with invariants.
- Prefer iterator/trait composition over macro-heavy complexity.
- Make concurrency cancellation-safe and backpressure-aware.

## Ownership and borrowing

- Design data flow so each value has one clear owner. Clone only when shared ownership is genuinely required.
- Keep borrow scopes tight — release borrows before calling functions that need `&mut self`.
- Prefer returning owned types from constructors and factory functions. Accept `&self`/`&mut self` in methods.
- Use `Cow<'_, T>` when a function sometimes needs to allocate and sometimes can borrow.
- Avoid lifetime annotations in public APIs unless the caller truly controls the borrowed data's scope.

## Error handling

- Use `thiserror` for library error enums exposed in public APIs. Use `anyhow` for application-level error propagation.
- Model error variants as enums with context fields — not string messages.
- Use `?` for propagation. Avoid `.unwrap()` and `.expect()` outside tests and provably-infallible paths.
- Add `.context()` / `.with_context()` at layer boundaries so error chains show where failures occurred.
- Map foreign errors into domain error types at crate boundaries — do not leak dependency error types.

## Async patterns

- Use `tokio` as the default async runtime. Pin to a specific runtime version in `Cargo.lock`.
- Make every async function cancellation-safe: dropping a future must not corrupt state.
- Use `tokio::select!` with care — the unselected branch is dropped, so state mutations before `.await` are lost.
- Prefer `tokio::spawn` with bounded concurrency (semaphores) over unbounded fan-out.
- Use `tower` middleware for timeouts, rate limits, and retries at the service boundary.
- Keep `Send + Sync` bounds explicit in trait objects and spawned tasks.

## Trait and type design

- Model closed variant sets with enums and exhaustive `match`. Prefer enums over trait objects for known types.
- Use trait objects (`dyn Trait`) at plugin/boundary points where the set of implementations is open.
- Implement `From`/`Into` for natural type conversions. Use `TryFrom`/`TryInto` for fallible ones.
- Keep trait surface small — split large traits into focused capability traits.
- Use newtype wrappers (`struct UserId(u64)`) to prevent primitive type confusion.

## Implementation guidance

- Use `tokio`/`axum`/`tower` patterns for service work.
- Model domain states with enums and exhaustive matching.
- Use `Arc` + interior mutability only when ownership alternatives fail.
- Keep borrow scopes tight to improve readability and compile times.
- Separate transport DTOs from domain types.

## Debugging and observability

- Prefer reproducible failing tests and `tracing` instrumentation before redesigning ownership or async structure.
- Make task cancellation, retries, and error chains visible in logs/telemetry.
- Use `cargo test`, `clippy`, and targeted benchmarks to isolate regressions.

## Performance and reliability

- Keep async flows cancellation-safe and backpressure-aware.
- Measure allocations, lock contention, and tail latency before unsafe or low-level tuning.
- Bound work queues and connection pools explicitly.

## Avoid

- Premature `unsafe` optimization.
- Silent `unwrap`/`expect` in non-test code paths.
- Global mutable state for request data.
- Unbounded `tokio::spawn` fan-out without backpressure.
- Leaking dependency error types across crate boundaries.
- `Arc<Mutex<T>>` when a channel-based ownership transfer would be clearer.

## Reference files

| File                                    | Load when                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `references/ownership-and-borrowing.md` | Ownership transfer, borrow scope design, lifetime annotations, or `Cow`/`Arc` tradeoffs need detail.       |
| `references/async-safety-patterns.md`   | Cancellation safety, `select!` pitfalls, structured concurrency, or runtime configuration need detail.     |
| `references/error-handling-design.md`   | Error enum design, `thiserror`/`anyhow` layering, context chains, or foreign error mapping need detail.    |
| `references/trait-design-patterns.md`   | Trait object vs enum dispatch, newtype patterns, `From`/`Into` design, or generic constraints need detail. |
| `references/unsafe-and-ffi-guide.md`    | Unsafe blocks, FFI boundaries, raw pointer invariants, or soundness documentation need detail.             |
