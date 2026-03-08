---
name: "c-pro"
description: "Use for modern C23-era systems and embedded engineering with memory safety discipline, build reproducibility, and low-level debugging awareness."
metadata:
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  tags: ["c", "language", "systems", "embedded", "memory-safety"]
---
# C Pro

## When to Use

- Writing or refactoring C systems, embedded, or low-level runtime code.
- Tightening memory ownership, ABI boundaries, and build hygiene.
- Debugging undefined behavior, portability, or toolchain-sensitive code.

## When Not to Use

- C++ feature work.
- High-level architecture tasks with no low-level code changes.
- Pure build or infrastructure work with no C logic.

## Core workflow

1. Confirm platform, compiler, and ABI constraints.
2. Make ownership, lifetime, and error handling explicit.
3. Prefer simple control flow over macro-heavy indirection.
4. Validate assumptions with warnings, sanitizers, or focused repros when available.
5. Keep portability and deterministic builds in view throughout the change.
