---
name: "c-pro"
description: "Use for modern C23-era systems and embedded engineering with memory safety discipline, build reproducibility, and low-level debugging awareness."
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "c"
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  baseline: "C23"
  tags: ["c", "language", "systems", "embedded", "memory-safety"]
---

# C Pro

## When to use

- Writing or refactoring C systems, embedded, or low-level runtime code.
- Tightening memory ownership, ABI boundaries, and build hygiene.
- Debugging undefined behavior, portability, or toolchain-sensitive code.

## When not to use

- C++ feature work — use `cpp-pro`.
- High-level architecture tasks with no low-level code changes.
- Pure build or infrastructure work with no C logic.

## Core workflow

1. Confirm platform, compiler, and ABI constraints before writing code.
2. Make ownership, lifetime, and error handling explicit at every interface.
3. Prefer simple control flow over macro-heavy indirection.
4. Validate assumptions with warnings, sanitizers, or focused repros.
5. Keep portability and deterministic builds in view throughout the change.

## Baseline standards

- Compile with `-Wall -Wextra -Werror` (or equivalent) in CI. Treat warnings as defects.
- Enable sanitizers (`-fsanitize=address,undefined`) in debug and test builds.
- Use `static` for file-scoped functions and variables. Minimize public symbols.
- Declare `const` by default. Mutable state must be justified.
- Keep headers self-contained: every `.h` must compile on its own.
- Prefer fixed-width integers (`uint32_t`, `int64_t`) over bare `int` for data structures and protocols.

## Memory safety discipline

- Every allocation must have a single, clear owner and a documented free path.
- Prefer stack allocation and arena allocators over scattered `malloc`/`free`.
- Initialize all variables at declaration. Never rely on implicit zero-initialization.
- Bounds-check array and buffer access at trust boundaries (user input, file I/O, network).
- Use `memset`/`memcpy` with explicit size — never assume buffer sizes from context.
- After `free`, set pointer to `NULL` to catch use-after-free during debugging.

## Build reproducibility

- Pin compiler version and flags in the build system. Builds must produce identical output across machines.
- Prefer CMake, Meson, or a Makefile with explicit dependency tracking over ad-hoc scripts.
- Declare all external dependencies with exact versions. Avoid system-installed headers for portable projects.
- Run CI on at least two compilers (GCC + Clang) and two platforms where applicable.
- Enable Link-Time Optimization (LTO) for release builds but verify correctness with sanitizers first.

## Debugging and diagnostics

- Compile debug builds with `-g -O0` for accurate stack traces and variable inspection.
- Use AddressSanitizer for memory errors, UndefinedBehaviorSanitizer for UB, and ThreadSanitizer for data races.
- Add `assert()` for invariants that must never be violated — strip in release builds.
- Prefer structured error codes with context over errno alone. Return error structs from functions that can fail.
- When debugging crashes: reproduce with sanitizers first, then gdb/lldb with watchpoints.

## Performance

- Profile with `perf`, `Instruments`, or `gprof` before micro-optimizing. Measure, don't guess.
- Prefer cache-friendly data layouts (arrays of structs vs. structs of arrays depending on access pattern).
- Minimize heap allocations in hot paths. Pre-allocate where the upper bound is known.
- Avoid premature inline — let the compiler decide, then verify with benchmarks.

## Avoid

- `void*` casts without size tracking — type-unsafe and bug-prone.
- Variable-length arrays (VLAs) in production code — stack overflow risk.
- Macro-heavy logic that hides control flow (`goto` cleanup patterns are acceptable when simple).
- Ignoring compiler warnings — every warning is a potential bug.
- Global mutable state without synchronization.
- Relying on implementation-defined or undefined behavior for correctness.

## Reference files

| File                                              | Load when                                                                                                      |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `references/memory-safety-and-build-checklist.md` | Memory ownership patterns, sanitizer configuration, build system hygiene, or ABI boundary review is needed.    |
| `references/common-ub-and-portability.md`         | Undefined behavior patterns, implementation-defined traps, or cross-platform portability decisions are needed. |
| `references/build-systems-and-toolchains.md`      | CMake/Meson setup, cross-compilation, CI matrix configuration, or toolchain pinning is needed.                 |
| `references/posix-and-platform-apis.md`           | POSIX system calls, file I/O, signal handling, or platform abstraction layer design is needed.                 |
| `references/debugging-with-sanitizers.md`         | AddressSanitizer, UBSan, ThreadSanitizer configuration, or crash diagnosis workflow is needed.                 |
