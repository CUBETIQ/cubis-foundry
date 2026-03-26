> This file extends [common.md](./common.md) with Rust-specific guidance.

## Rust Rules

- Use the type system to encode invariants rather than deferring them to comments.
- Prefer explicit error types over opaque panics in recoverable flows.
- Keep unsafe code isolated, documented, and justified.
