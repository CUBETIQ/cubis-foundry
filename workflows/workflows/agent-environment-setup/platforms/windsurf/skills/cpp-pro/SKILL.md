---
name: "cpp-pro"
description: "Use for modern C++23-era systems and application engineering with RAII, value semantics, toolchain awareness, and performance-safe design."
metadata:
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  tags: ["cpp", "c++", "language", "systems", "performance"]
---

# Cpp Pro

## When to Use

- Building or refactoring modern C++ libraries, services, or native apps.
- Improving ownership, templates, performance boundaries, or build structure.
- Fixing correctness or maintainability issues in large native codebases.

## When Not to Use

- Pure C code.
- High-level product planning with no native implementation issue.
- One-off build scripting with no C++ change.

## Core workflow

1. Confirm toolchain, standard level, and module/library boundaries.
2. Prefer RAII, value semantics, and explicit ownership over raw lifetime juggling.
3. Keep templates readable and avoid metaprogramming when simpler designs suffice.
4. Separate correctness fixes from performance tuning unless the two are inseparable.
5. Validate with targeted tests, warnings, and native build checks.
