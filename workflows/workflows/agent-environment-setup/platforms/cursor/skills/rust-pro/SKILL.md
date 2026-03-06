---
name: "rust-pro"
description: "Use for modern Rust systems/services with stable 1.91-era patterns, async correctness, and performance-focused design."
license: MIT
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "rust"
  baseline: "Rust stable 1.91"
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

## References

| File | Load when |
| --- | --- |
| `references/operational-baseline.md` | You need service-level guardrails for async, errors, tracing, and test discipline. |

## Avoid

- Premature `unsafe` optimization.
- Silent `unwrap`/`expect` in non-test code paths.
- Global mutable state for request data.
