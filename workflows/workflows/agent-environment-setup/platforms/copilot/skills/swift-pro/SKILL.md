---
name: "swift-pro"
description: "Use for modern Swift 6.1-era application and systems engineering with strong concurrency, protocol boundaries, package structure, and Apple-platform correctness."
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "swift"
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  baseline: "Swift 6.1"
  tags: ["swift", "language", "concurrency", "spm", "apple-platforms"]
---
# Swift Pro

## When to use

- Building or refactoring Swift application, package, or platform code.
- Tightening Swift concurrency, Sendable safety, and package structure.
- Improving protocol boundaries, async code, and testability.

## When not to use

- SwiftUI-specific design work with no language issue — use `mobile-developer`.
- Backend or database tasks outside Swift code.
- Build-system work with no code or package change.

## Core workflow

1. Confirm platform targets and package boundaries.
2. Keep concurrency annotations and ownership rules explicit.
3. Prefer protocol-driven seams where they improve testing or substitution.
4. Reduce shared mutable state and actor-boundary confusion.
5. Validate with focused tests and compiler-clean concurrency output.

## Baseline standards

- Enable strict concurrency checking (`-strict-concurrency=complete`). Fix all diagnostics.
- Use `Sendable` conformance on all types that cross isolation boundaries.
- Prefer `let` over `var`. Mutable state must be justified and contained.
- Use access control (`public`, `internal`, `private`, `fileprivate`) deliberately. Default to `private`.
- Keep Swift Package Manager as the primary dependency manager. Pin exact versions in `Package.resolved`.

## Concurrency (Swift 6)

- Use `async`/`await` for all asynchronous work. Eliminate completion handler callbacks in new code.
- Use `actor` for mutable state that needs thread-safe access. Keep actor methods focused and fast.
- Use `@MainActor` for UI-bound state and methods. Never call `MainActor.run` from UI code — annotate instead.
- Use `Task` and `TaskGroup` for structured concurrency. Cancel child tasks explicitly when the parent scope ends.
- Use `AsyncSequence` and `AsyncStream` for event-driven data flow.
- Avoid `nonisolated(unsafe)` unless you can prove thread safety with external synchronization.

## Sendable safety

- Value types (`struct`, `enum`) are `Sendable` when all stored properties are `Sendable`.
- Reference types must explicitly conform to `Sendable` — use `@unchecked Sendable` only with audited manual synchronization.
- Use `sending` parameter annotation (Swift 6) when transferring ownership of a value into another isolation domain.
- Closures crossing isolation boundaries must capture only `Sendable` values.

## Protocol-oriented design

- Use protocols to define capability contracts at module boundaries.
- Prefer protocol extensions for default implementations over base classes.
- Use `some Protocol` (opaque types) for return types to hide concrete implementations.
- Use `any Protocol` (existential types) only when dynamic dispatch is genuinely needed — it has runtime cost.
- Keep protocol requirements minimal. Clients should not be forced to implement methods they don't need.

## Error handling

- Use `throws` for recoverable errors. Use typed throws (`throws(MyError)`) in Swift 6 when the error domain is closed.
- Define specific error enums per module. Include context (e.g., the ID that wasn't found).
- Use `Result` when errors must be stored or passed as values.
- Use `do`/`catch` at the boundary layer (view model, controller). Don't catch errors deep in business logic unless recovery is possible.

## Testing

- Use Swift Testing framework (`@Test`, `#expect`) for new test targets. XCTest for existing targets.
- Use protocol-based dependency injection for testable architecture. Avoid singletons.
- Test async code with `await` — Swift Testing supports async test functions natively.
- Use `confirmation()` for testing actor-isolated behavior.
- Keep tests fast: mock network and persistence. No real I/O in unit tests.

## Package structure

- Organize code into focused packages/modules with clear public APIs.
- Use `Package.swift` targets to enforce module boundaries. Keep target dependency graphs acyclic.
- Export only the public API. Use `internal` for implementation details.
- Use `@testable import` only in test targets — never in production code.

## Avoid

- Force unwrapping (`!`) without a preceding guard or nil check.
- Massive view controllers or view models — split into focused components.
- `class` when `struct` would suffice — value types are cheaper, safer, and `Sendable` by default.
- `DispatchQueue` for new concurrent code — use Swift concurrency instead.
- Retain cycles from strong `self` captures in closures — use `[weak self]` or `[unowned self]` appropriately.
- Global mutable state (`static var`) — use actor isolation or dependency injection.

## Reference files

| File                                            | Load when                                                                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `references/swift-concurrency-and-protocols.md` | Swift concurrency migration, Sendable audit, actor design, protocol-oriented architecture, or structured concurrency patterns are needed. |
