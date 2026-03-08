---
name: "swift-pro"
description: "Use for modern Swift 6.1-era application and systems engineering with strong concurrency, protocol boundaries, package structure, and Apple-platform correctness."
metadata:
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  tags: ["swift", "language", "concurrency", "spm", "apple-platforms"]
---

# Swift Pro

## When to Use

- Building or refactoring Swift application, package, or platform code.
- Tightening Swift concurrency, Sendable safety, and package structure.
- Improving protocol boundaries, async code, and testability.

## When Not to Use

- SwiftUI-specific design work with no language issue.
- Backend or database tasks outside Swift code.
- Build-system work with no code or package change.

## Core workflow

1. Confirm platform targets and package boundaries.
2. Keep concurrency annotations and ownership rules explicit.
3. Prefer protocol-driven seams where they improve testing or substitution.
4. Reduce shared mutable state and actor-boundary confusion.
5. Validate with focused tests and compiler-clean concurrency output.
