---
name: "dart-pro"
description: "Use for modern Dart engineering across Flutter, server, and CLI code with Dart 3.11-era language features, package hygiene, isolates, and testing discipline."
license: MIT
metadata:
  author: cubis-foundry
  version: "2.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Dart Pro

## Purpose

Expert-level guidance for modern Dart development across Flutter app logic, server applications, and CLI tooling. Covers null safety, sealed classes with pattern matching, async and isolate patterns, package hygiene, and testing discipline using current Dart language features.

## When to Use

- Designing Dart libraries, Flutter app logic, or Dart CLI tooling.
- Refactoring null-safety, sealed classes, records, or pattern matching.
- Improving package structure, async correctness, and testability.

## Instructions

1. **Confirm runtime context** — identify whether the code targets Flutter UI, server, or CLI. This determines available APIs, isolate patterns, and testing approaches.

2. **Keep null safety and type intent explicit** — prefer non-nullable types by default. Use `?` only when null is a valid domain value. Use `late` only when initialization is guaranteed before access. Target sound null safety with no `// ignore: null_check` suppressions without justification. Do not use `!` (null assertion) in production code without a preceding null check because it crashes at runtime.

3. **Use sealed models, records, and pattern matching** — use sealed classes for closed type hierarchies with exhaustive `switch` that catches missing cases at compile time. Use records `(int, String)` for lightweight grouped returns. Use `switch` expressions with pattern matching for state machines. Prefer destructuring in `if-case` and `switch` over manual `is` checks and casts.

4. **Design async flows with proper lifecycle** — use `async`/`await` for I/O-bound work. Keep `Future` chains flat. Use `Stream` for event-driven data with `StreamController.broadcast()` only when multiple listeners are needed. Cancel subscriptions and close controllers in `dispose()` to prevent memory leaks. Do not block the main isolate with synchronous I/O or heavy computation because it freezes the UI.

5. **Offload compute to isolates when needed** — use `Isolate.run()` or `compute()` in Flutter for CPU-heavy work. Keep the main isolate responsive for UI and event handling.

6. **Maintain package hygiene** — keep `pubspec.yaml` dependencies minimal. Use `dart pub outdated` to identify stale dependencies. Export only the public API from `lib/src/` via a barrel file. Pin SDK constraint to the minimum required version. Keep `pubspec.lock` in version control for applications (not for libraries). Do not import implementation files from `lib/src/` directly in other packages because it breaks encapsulation.

7. **Run analysis before committing** — run `dart analyze` with zero warnings. Treat analyzer warnings as defects. Use `dart format` for consistent style. Do not override formatter rules per-file. Do not ignore analyzer warnings with `// ignore:` comments without a justification comment because it hides real defects.

8. **Test business logic independently** — use `package:test` for unit tests, `package:mocktail` or `package:mockito` for mocking. Test logic in plain Dart classes independent of Flutter widgets. Run tests with `--coverage` and review uncovered branches. Do not mix business logic into widget `build()` methods because it prevents isolated testing.

9. **Do not use `dynamic` as a type** because it disables all static checking — use `Object` or generics instead.

## Output Format

Produces Dart code with sound null safety, sealed class hierarchies, pattern matching, and clean async patterns. Includes barrel exports and analyzer-clean output with proper package structure.

## References

| File                                           | Load when                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `references/null-safety-and-async-patterns.md` | Null safety migration, sealed class patterns, async/isolate architecture, or stream lifecycle management is needed. |
| `references/sealed-records-patterns.md`        | You need sealed class hierarchies, records, destructuring, or exhaustive switch patterns for state modeling.        |
| `references/isolate-and-concurrency.md`        | You need isolate architecture, compute offload, port communication, or Flutter isolate integration patterns.        |
| `references/package-structure-and-linting.md`  | You need pub workspace layout, barrel exports, analysis_options rules, or dependency audit workflow.                |
| `references/testing-and-mocking.md`            | You need test patterns with mockito/mocktail, widget testing, golden tests, or coverage-driven CI.                  |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Refactor this state management code to use sealed classes with exhaustive pattern matching instead of enum flags."
- "Design the isolate architecture for this image processing pipeline in a Flutter app."
- "Set up the package structure for this shared Dart library with proper barrel exports and analysis_options."
