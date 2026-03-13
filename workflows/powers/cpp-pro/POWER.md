````markdown
---
inclusion: manual
name: cpp-pro
description: "Use for modern C++23-era systems and application engineering with RAII, value semantics, toolchain awareness, and performance-safe design."
license: MIT
metadata:
  author: cubis-foundry
  version: "2.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Cpp Pro

## Purpose

Use for modern C++23-era systems and application engineering with RAII, value semantics, toolchain awareness, and performance-safe design.

## When to Use

- Building or refactoring modern C++ libraries, services, or native apps.
- Improving ownership, templates, performance boundaries, or build structure.
- Fixing correctness or maintainability issues in large native codebases.

## Instructions

1. Confirm toolchain, standard level, and module/library boundaries.
2. Prefer RAII, value semantics, and explicit ownership over raw lifetime juggling.
3. Keep templates readable and avoid metaprogramming when simpler designs suffice.
4. Separate correctness fixes from performance tuning unless the two are inseparable.
5. Validate with targeted tests, warnings, and native build checks.

### Baseline standards

- Compile with `-std=c++23` (or project minimum). Enable `-Wall -Wextra -Wpedantic -Werror`.
- Use smart pointers (`unique_ptr`, `shared_ptr`) instead of raw `new`/`delete`. Raw pointers are non-owning observers only.
- Prefer value types and move semantics over heap allocation and pointer indirection.
- Mark functions `[[nodiscard]]` when ignoring the return value is always a bug.
- Use `constexpr` and `consteval` for compile-time computation where possible.
- Keep header includes minimal. Use forward declarations to reduce coupling.

### RAII and ownership

- Every resource (memory, file handle, mutex lock, socket) must be managed by an RAII wrapper.
- Use `unique_ptr` for exclusive ownership, `shared_ptr` only when shared ownership is genuinely required.
- Prefer moving over copying for expensive types. Delete copy constructors when copying is semantically wrong.
- Use `std::optional` instead of nullable pointers for optional values.
- Scope-guard patterns for cleanup when RAII wrappers don't exist yet.

### Templates and generics

- Use concepts (C++20/23) to constrain template parameters. Unconstrained templates produce unreadable error messages.
- Prefer `auto` with trailing return types for function templates. Avoid deep template nesting.
- Keep template definitions in headers. Use explicit instantiation only for build-time improvement in large projects.
- Prefer `std::variant` and `std::visit` over inheritance hierarchies for closed type sets.

### Concurrency

- Use `std::jthread` and `std::stop_token` for manageable thread lifecycles.
- Prefer `std::mutex` with `std::lock_guard`/`std::scoped_lock` — never lock/unlock manually.
- Use `std::atomic` for lock-free counters and flags. Profile before choosing lock-free data structures.
- Propagate cancellation through `stop_token` rather than shared booleans.
- Run ThreadSanitizer in CI for all concurrent code paths.

### Performance

- Profile with `perf`, `VTune`, or `Instruments` before optimizing. Measure hot paths, not hunches.
- Prefer contiguous containers (`std::vector`) over node-based containers (`std::list`, `std::map`) for cache efficiency.
- Use `std::string_view` and `std::span` to avoid unnecessary copies at function boundaries.
- Avoid virtual dispatch in hot loops. Prefer CRTP or `std::variant` when static dispatch suffices.
- Enable LTO for release builds. Benchmark with and without to verify gains.

### Debugging

- Compile debug builds with `-g -O0 -fsanitize=address,undefined`.
- Use `static_assert` for compile-time invariants. Use `assert` for runtime invariants in debug mode.
- When debugging crashes: reproduce under sanitizers first, then inspect with gdb/lldb.
- Use structured error types (`std::expected` in C++23) instead of exceptions for recoverable errors in performance-sensitive code.

### Constraints

- Avoid raw `new`/`delete` — use smart pointers or containers.
- Avoid c-style casts — use `static_cast`, `dynamic_cast`, `const_cast`, or `reinterpret_cast` with justification.
- Avoid deep inheritance hierarchies — prefer composition and type erasure.
- Avoid `using namespace std;` in headers — pollutes all includers.
- Avoid exceptions for control flow — use them for truly exceptional conditions only.
- Avoid premature micro-optimization without profiling evidence.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

| File                                           | Load when                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `references/raii-and-modern-cpp-checklist.md`  | RAII patterns, smart pointer selection, value semantics, move correctness, or template constraint review is needed. |
| `references/move-semantics-and-value-types.md` | Move constructor/assignment design, perfect forwarding, copy elision, or value category questions arise.            |
| `references/template-and-concepts-patterns.md` | Concept constraints, SFINAE replacement, variadic templates, or compile-time computation patterns are needed.       |
| `references/concurrency-primitives.md`         | Thread management, mutex strategies, atomic operations, lock-free patterns, or coroutine design is needed.          |
| `references/performance-and-profiling.md`      | Cache optimization, allocation reduction, benchmark setup, or profiler-driven tuning is needed.                     |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with cpp pro best practices in this project"
- "Review my cpp pro implementation for issues"
````
