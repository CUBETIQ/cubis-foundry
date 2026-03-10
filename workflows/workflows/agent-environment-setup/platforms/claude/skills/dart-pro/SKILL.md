---
name: "dart-pro"
description: "Use for modern Dart engineering across Flutter, server, and CLI code with Dart 3.9-era language features, package hygiene, isolates, and testing discipline."
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "dart"
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  baseline: "Dart 3.9"
  tags: ["dart", "flutter", "language", "packages", "isolates"]
---

# Dart Pro

## When to use

- Designing Dart libraries, Flutter app logic, or Dart CLI tooling.
- Refactoring null-safety, sealed classes, records, or pattern matching.
- Improving package structure, async correctness, and testability.

## When not to use

- Pure Flutter design-system or platform UX decisions — use `mobile-developer`.
- Database-only tuning with no Dart code changes.
- Simple config edits with no language-level consequence.

## Core workflow

1. Confirm runtime context: Flutter UI, server, or CLI.
2. Keep null safety and type intent explicit.
3. Prefer sealed models, records, and pattern matching for state clarity.
4. Isolate heavy compute from UI-sensitive paths when needed.
5. Validate with focused tests and analyzer-clean output.

## Baseline standards

- Target sound null safety — no `// ignore: null_check` suppressions without justification.
- Run `dart analyze` with zero warnings before committing. Treat analyzer warnings as defects.
- Use `dart format` for consistent style. Do not override formatter rules per-file.
- Pin SDK constraint in `pubspec.yaml` to the minimum required version.
- Keep `pubspec.lock` in version control for applications (not for libraries).

## Null safety and types

- Prefer non-nullable types by default. Use `?` only when null is a valid domain value.
- Use `late` only when initialization is guaranteed before access and a non-nullable type is required.
- Avoid `!` (null assertion) except in tests or after an explicit null check in the same scope.
- Use sealed classes for closed type hierarchies — exhaustive `switch` catches missing cases at compile time.
- Use records `(int, String)` for lightweight grouped returns instead of creating one-off classes.

## Pattern matching

- Use `switch` expressions with pattern matching for state machines and variant handling.
- Prefer destructuring in `if-case` and `switch` over manual `is` checks and casts.
- Exhaustive matching on sealed types ensures new variants cause compile errors, not runtime surprises.

## Async and isolates

- Use `async`/`await` for I/O-bound work. Keep `Future` chains flat — avoid nested `.then()`.
- Use `Stream` for event-driven data. Prefer `StreamController.broadcast()` only when multiple listeners are needed.
- Offload CPU-heavy work to isolates via `Isolate.run()` or `compute()` in Flutter.
- Never block the main isolate with synchronous I/O or heavy computation.
- Cancel subscriptions and close controllers in `dispose()` to prevent memory leaks.

## Package hygiene

- Keep `pubspec.yaml` dependencies minimal. Audit transitive dependencies periodically.
- Use `dart pub outdated` to identify stale dependencies.
- Export only the public API from `lib/src/` via a barrel file. Keep implementation details private.
- Split large packages into focused sub-packages when responsibilities diverge.

## Testing

- Use `package:test` for unit tests, `package:mockito` or `package:mocktail` for mocking.
- Test business logic independently of Flutter widgets — keep logic in plain Dart classes.
- Use `setUp`/`tearDown` for shared fixture setup. Avoid test interdependence.
- Run tests with `--coverage` and review uncovered branches.

## Avoid

- `dynamic` as a type — it disables all static checking. Use `Object` or generics instead.
- `!` null assertions in production code without a preceding null check.
- Importing implementation files from `lib/src/` directly in other packages.
- Ignoring analyzer warnings with `// ignore:` comments without a justification comment.
- Mixing business logic into widget `build()` methods.

## Reference files

| File                                           | Load when                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `references/null-safety-and-async-patterns.md` | Null safety migration, sealed class patterns, async/isolate architecture, or stream lifecycle management is needed. |
