---
name: swift-best-practices
description: "Use when writing, reviewing, or refactoring modern Swift, including strict concurrency, actors, SwiftUI with @Observable, structured concurrency, protocol-oriented design, and SPM modules."
allowed-tools: Read Grep Glob Bash Edit Write
user-invocable: true
argument-hint: "Swift file, protocol, or SwiftUI view to analyze"
---

# Swift Best Practices

## Purpose

Production-grade guidance for Swift 6.0+ application and systems engineering. Covers strict concurrency with complete Sendable checking, actor isolation, SwiftUI patterns using @Observable and the observation framework, structured concurrency, protocol-oriented design, memory management, and modern Swift Package Manager workflows.

## When to Use

- Building new Swift applications, packages, or frameworks targeting Swift 6.0+.
- Migrating to strict concurrency checking and fixing Sendable diagnostics.
- Designing actor-based services with proper isolation boundaries.
- Building SwiftUI views with @Observable macro and modern state management.
- Structuring multi-module Swift packages with clean dependency graphs.
- Reviewing Swift code for concurrency safety, performance, or architectural issues.

## Instructions

1. **Confirm Swift version and platform targets first** because Swift 6.0 enables strict concurrency by default and earlier versions require opt-in flags, which changes every Sendable and isolation decision downstream.

2. **Enable strict concurrency checking across all targets** by setting `-strict-concurrency=complete` in Package.swift or Xcode build settings, because partial checking hides data races that only surface in production under load.

3. **Use actors as the primary tool for mutable shared state** because actors provide compiler-enforced mutual exclusion without manual locking. Keep actor methods short and non-blocking — long-running work should be dispatched to detached tasks or task groups and results forwarded back.

4. **Annotate UI-bound code with @MainActor at the type level** because annotating individual methods creates isolation gaps where state can be accessed off-main-thread. Apply @MainActor to the entire view model or observable type, not to scattered methods.

5. **Adopt @Observable macro for SwiftUI state management** because it eliminates the need for @Published property wrappers and gives SwiftUI fine-grained tracking of which properties each view actually reads, reducing unnecessary redraws. Use @State for view-local observable objects and @Environment for shared ones.

6. **Design structured concurrency with TaskGroup for parallel work** because structured concurrency guarantees child task cancellation when the parent scope exits, preventing resource leaks. Use `withThrowingTaskGroup` for fallible parallel operations and propagate cancellation by checking `Task.isCancelled` in long loops.

7. **Use AsyncSequence and AsyncStream for event-driven data flow** because they integrate naturally with for-await-in loops and support backpressure. Prefer `AsyncStream.makeStream()` factory (Swift 5.9+) over the closure-based initializer because it separates the continuation from the stream, making it easier to pass into actor-isolated contexts.

8. **Enforce Sendable conformance on every type that crosses isolation boundaries** because the compiler cannot verify thread safety for non-Sendable types passed between actors or tasks. Value types with all-Sendable stored properties are automatically Sendable. Use `@unchecked Sendable` only when you can prove safety through manual synchronization and document the invariant with a comment.

9. **Use typed throws for closed error domains** (Swift 6.0+) because `throws(MyError)` lets callers exhaustively match error cases without a default catch, improving error handling precision at module boundaries.

10. **Design protocol-oriented seams at module boundaries** because protocols enable test doubles, alternative implementations, and dependency inversion without inheritance hierarchies. Use `some Protocol` return types to hide concrete types, and `any Protocol` only when heterogeneous collections or runtime polymorphism are genuinely needed.

11. **Manage memory with explicit weak/unowned capture lists** because reference cycles between closures, delegates, and observed objects are the most common Swift memory leak. Use `[weak self]` in escaping closures stored by the callee. Prefer value types (`struct`, `enum`) over classes to eliminate reference counting overhead entirely.

12. **Organize code into focused Swift Package Manager modules** because module boundaries enforce access control at compile time and speed up incremental builds. Keep the target dependency graph acyclic, expose only public API, and use `@testable import` exclusively in test targets.

13. **Write tests using Swift Testing framework (@Test, #expect)** because it supports parameterized tests, async test functions, and structured assertions out of the box. Test actor-isolated behavior with `await` and use `confirmation()` for verifying callbacks.

14. **Use dependency injection through protocol-typed initializer parameters** because constructor injection makes dependencies explicit and testable. Avoid singletons and global mutable state — use @MainActor-isolated containers or environment values instead.

15. **Prefer value types and immutability by default** because structs are stack-allocated, Sendable by default, and eliminate reference-counting overhead. Use `let` over `var` unless mutation is required. When classes are needed, make them `final` to enable compiler optimizations.

16. **Avoid DispatchQueue, locks, and semaphores in new code** because Swift concurrency replaces these with compiler-checked constructs. Legacy dispatch code mixed with async/await creates subtle deadlocks and priority inversions that are difficult to diagnose.

17. **Profile before optimizing with Instruments** because premature optimization in Swift often trades readability for negligible gains. Use the Allocations, Time Profiler, and Swift Concurrency instruments to identify actual bottlenecks before restructuring hot paths with `Span`, `UnsafeBufferPointer`, or manual memory management.

18. **Keep SwiftUI view bodies pure and side-effect-free** because SwiftUI may evaluate body multiple times and in any order. Trigger side effects in `.task` modifiers (which auto-cancel on view disappearance) or in observable object methods, never in computed body properties.

## Output Format

Produces Swift 6.0+ code with strict concurrency annotations, actor isolation, @Observable state management, structured error handling with typed throws, and protocol-oriented architecture. Includes Package.swift configuration and test examples where relevant.

## References

| File | Load when |
| --- | --- |
| `references/concurrency.md` | You need actor design, TaskGroup usage, AsyncStream patterns, or isolation boundary strategies. |
| `references/protocol-oriented.md` | You need protocol design, opaque/existential types, generic constraints, or dependency inversion patterns. |
| `references/testing.md` | You need Swift Testing framework patterns, async test strategies, or mock/stub architecture. |
| `references/swiftui-patterns.md` | You need @Observable integration, SwiftUI state management, navigation, or view composition patterns. |
| `references/memory-management.md` | You need ARC optimization, weak/unowned capture strategies, value type design, or leak detection. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Design an actor-based networking service with proper isolation and cancellation support."
- "Migrate this SwiftUI view from ObservableObject to @Observable with proper state management."

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
