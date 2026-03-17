---
name: rust-best-practices
description: "Use when writing production Rust (2024 edition): ownership and borrowing patterns, async with tokio, error handling with thiserror/anyhow, comprehensive testing, and disciplined use of unsafe."
---
# Rust Best Practices

## Purpose

Production-grade guidance for Rust 2024 edition covering ownership and borrowing patterns for zero-cost abstractions, async services with tokio and structured concurrency, error handling with `thiserror` and `anyhow`, testing strategies including integration tests and property-based testing, and disciplined use of `unsafe` with documented safety invariants.

## When to Use

- Building services, CLIs, libraries, or systems-level code in Rust 2024 edition.
- Designing ownership hierarchies to avoid unnecessary cloning or `Arc` proliferation.
- Writing async services with tokio, tower, axum, or tonic.
- Implementing error types for libraries or error reporting for applications.
- Reviewing or writing `unsafe` code that requires soundness justification.

## Instructions

1. **Model ownership as a design decision, not an afterthought** — decide who owns each piece of data before writing code. Use owned types (`String`, `Vec<T>`) for data that lives beyond a single function call and borrowed references (`&str`, `&[T]`) for read-only access within a scope because Rust's borrow checker enforces these decisions at compile time and fighting it after the fact creates painful refactors.

2. **Prefer borrowing over cloning** — pass `&self` and `&str` to functions that only read data. Clone only when you need independent ownership (e.g., spawning a task that outlives the caller). Use `Cow<'_, str>` when a function sometimes needs to allocate and sometimes does not because `Cow` defers the allocation decision to runtime without sacrificing the borrowing-first default.

3. **Use `Arc<T>` and `Arc<Mutex<T>>` deliberately** — `Arc` is for sharing ownership across threads or tasks. Avoid wrapping everything in `Arc<Mutex<T>>` by default; instead, restructure to pass owned values into spawned tasks. When shared state is unavoidable, prefer `Arc<RwLock<T>>` for read-heavy workloads because `RwLock` allows concurrent reads.

4. **Define library errors with `thiserror`, application errors with `anyhow`** — use `#[derive(thiserror::Error)]` for public library errors because callers need to match on specific variants. Use `anyhow::Result` in application code and binary entry points because applications log errors rather than match on them. Never use `unwrap()` or `expect()` in library code; reserve them for tests and infallible cases with a comment explaining why.

5. **Propagate errors with `?` and add context** — use `.context("loading config")` (from `anyhow`) or `.map_err(|e| MyError::Config(e))` to add context at each layer. Avoid `.unwrap()` chains in production paths because a bare unwrap provides no context in the panic message and crashes the program.

6. **Structure async code with tokio and structured concurrency** — use `tokio::select!` for racing futures with cancellation, `tokio::JoinSet` for managed fan-out, and `tokio::spawn` with `CancellationToken` for background tasks. Avoid `tokio::spawn` without a shutdown signal because orphaned tasks leak resources. Use `#[tokio::main]` only at the binary entry point; libraries should accept a runtime handle or be runtime-agnostic.

7. **Never block the async runtime** — offload CPU-bound work with `tokio::task::spawn_blocking` or `rayon`. Synchronous I/O, `std::thread::sleep`, and compute-heavy loops inside an `async fn` stall the executor because tokio's work-stealing scheduler assumes tasks yield frequently.

8. **Use the type system to encode invariants** — create newtype wrappers (`struct UserId(u64)`) for domain primitives to prevent mixing user IDs with post IDs. Use the builder pattern or typestate pattern for complex construction because compile-time validation eliminates entire categories of invalid-state bugs that tests catch only probabilistically.

9. **Implement `From` conversions instead of manual `.into()` calls everywhere** — define `impl From<X> for Y` when the conversion is infallible and natural. Use `TryFrom` when conversion can fail. This enables the `?` operator to convert error types automatically because `From` implementations wire into the error propagation chain.

10. **Test at multiple levels** — unit tests go in `#[cfg(test)] mod tests` inside each module, integration tests in `tests/`, and examples in `examples/`. Use `#[should_panic]` for panic-path tests, `proptest` or `quickcheck` for property-based testing, and `insta` for snapshot testing of complex output because diverse test strategies catch different classes of bugs.

11. **Write benchmarks with `criterion`** — use `criterion::black_box` to prevent dead-code elimination and compare benchmarks across commits with `critcmp`. Profile with `cargo flamegraph` or `perf` to find hot spots because micro-benchmarks without profiling context optimize the wrong thing.

12. **Contain `unsafe` to minimal, documented blocks** — every `unsafe` block must have a `// SAFETY:` comment explaining which invariant the programmer is upholding that the compiler cannot verify. Wrap unsafe operations in safe abstractions with `#[deny(unsafe_op_in_unsafe_fn)]` enabled. Audit unsafe code with `cargo miri` in CI because Miri detects undefined behavior that tests miss.

13. **Use `clippy` at the `pedantic` level** — run `cargo clippy -- -W clippy::pedantic -W clippy::nursery` in CI. Allow specific lints at the item level with `#[allow(clippy::specific_lint)]` and a justification comment. Treat clippy warnings as CI failures because pedantic clippy catches idiomatic issues and subtle correctness bugs.

14. **Structure crates with a clean public API surface** — use `pub(crate)` for internal helpers, keep `lib.rs` as a thin re-export module, and organize with feature flags for optional functionality. Document public items with `///` doc comments and include examples that compile under `cargo test` because doc-tests are the most trustworthy form of documentation.

15. **Manage dependencies with `cargo deny`** — check for duplicate versions, unmaintained crates, and license compatibility. Use `cargo audit` for known vulnerabilities. Pin `Cargo.lock` for binaries, leave it out of version control for libraries because binaries need reproducibility while libraries need flexibility.

16. **Leverage edition 2024 features** — use `gen` blocks for custom iterators (when stabilized), `async fn` in traits (RPITIT), and the updated borrow checker with NLL improvements. The 2024 edition tightens `unsafe` requirements (`unsafe_op_in_unsafe_fn` is warn by default) so existing code may need `// SAFETY:` annotations when migrating.

## Output Format

Produces Rust code using 2024 edition idioms with explicit ownership design, `thiserror`/`anyhow` error handling, tokio-based async patterns, and multi-level test suites. Includes `// SAFETY:` comments for any unsafe blocks and doc comments on all public APIs.

## References

| File | Load when |
| --- | --- |
| `references/ownership-borrowing.md` | Ownership hierarchies, borrowing strategies, lifetime annotations, or Cow usage needed. |
| `references/async-runtime.md` | Tokio patterns, structured concurrency, spawn_blocking, or cancellation design needed. |
| `references/error-handling.md` | thiserror/anyhow patterns, error conversion, context propagation, or Result design needed. |
| `references/testing.md` | Unit/integration test structure, proptest, criterion benchmarks, or miri usage needed. |
| `references/unsafe-patterns.md` | Unsafe block design, SAFETY comments, miri, FFI, or raw pointer patterns needed. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Design the ownership hierarchy for this data pipeline so no unnecessary cloning occurs between parsing, transformation, and serialization stages."
- "Implement an async HTTP service with axum, graceful shutdown via CancellationToken, and structured error handling with thiserror."
- "Review this unsafe block for soundness and add SAFETY documentation explaining the invariants."

## Gemini Platform Notes

- Workflow and agent routes are compiled into `.gemini/commands/*.toml` TOML command files.
- Commands use `{{args}}` for user input, `!{shell command}` for shell output, `@{file}` for file content.
- Specialists are internal postures (modes of reasoning), not spawned subagent processes.
- Gemini does not support `context: fork` — all skill execution is inline within the current session.
- Skills are loaded via MCP when the Cubis Foundry MCP server is configured. Local `.agents/skills/` paths serve as hints.
- User arguments are passed as natural language in the activation prompt.
- Rules file: `.gemini/GEMINI.md`.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when MCP is connected.
