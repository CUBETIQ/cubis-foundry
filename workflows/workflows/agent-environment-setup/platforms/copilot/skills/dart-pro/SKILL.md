---
name: "dart-pro"
description: "Use for modern Dart engineering across Flutter, server, and CLI code with Dart 3.9-era language features, package hygiene, isolates, and testing discipline."
metadata:
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  tags: ["dart", "flutter", "language", "packages", "isolates"]
---
# Dart Pro

## When to Use

- Designing Dart libraries, Flutter app logic, or Dart CLI tooling.
- Refactoring null-safety, sealed classes, records, or pattern matching.
- Improving package structure, async correctness, and testability.

## When Not to Use

- Pure Flutter design-system or platform UX decisions.
- Database-only tuning with no Dart code changes.
- Simple config edits with no language-level consequence.

## Core workflow

1. Confirm runtime context: Flutter UI, server, or CLI.
2. Keep null safety and type intent explicit.
3. Prefer sealed models, records, and pattern matching for state clarity.
4. Isolate heavy compute from UI-sensitive paths when needed.
5. Validate with focused tests and analyzer-clean output.
