---
name: flutter-riverpod
description: "Use when creating, refactoring, or auditing Riverpod 3 providers and notifiers in Flutter with code generation and correct lifecycle boundaries. Do not use for widget-local ephemeral state that should stay inside the UI."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Flutter Riverpod

## Purpose

Guide production Riverpod usage in Flutter with code generation, correct
lifecycle boundaries, explicit side-effect handling, and testable provider
design.

## When to Use

- Adding a provider or notifier
- Refactoring provider lifecycles
- Fixing rebuild storms or dependency loops
- Designing async loading and mutation flows
- Writing or reviewing Riverpod tests

## Instructions

1. Confirm the current package set before making version-sensitive changes. When the task touches `pubspec.yaml` or migration guidance, verify Riverpod package versions against the official docs and the project's Flutter SDK constraints instead of assuming an old example is current.
2. Choose the narrowest provider type that matches the problem.
3. Default to generated providers for app code.
4. Keep business logic in repositories and services behind injected providers.
5. Use `ref.watch` for build-time dependency tracking, `ref.read` for callbacks and mutation methods, and `ref.listen` for UI side effects.
6. Default to auto-dispose and opt into `keepAlive` only when the state clearly needs it.
7. Guard post-`await` writes with `ref.mounted` when disposal is possible.
8. Prefer targeted invalidation and rebuilds over broad refresh behavior.
9. Treat experimental Riverpod features as optional and follow project conventions if they are already in use.
10. Test provider behavior directly with overrides and `ProviderContainer` or scoped widget tests.

## Output Format

Produce Riverpod guidance or code that:

- uses provider types intentionally,
- keeps side effects out of build paths,
- exposes clear override points for repositories and services,
- includes verification guidance where behavior is non-trivial.

## References

Load only what the current step needs.

| File | Load when |
| --- | --- |
| `references/version-matrix.md` | You need package-selection guidance or need to verify Riverpod versions against current docs and Flutter SDK constraints. |
| `references/provider-selection.md` | You need to choose provider types, keep-alive policy, family inputs, or side-effect boundaries. |
| `references/async-lifecycle.md` | You are designing async flows, refresh or retry behavior, stream-backed state, invalidation, or disposal boundaries. |
| `references/testing.md` | You need `ProviderContainer`, widget test, or provider override patterns. |

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Refactor this feature from manual providers to generated `AsyncNotifier` providers."
- "Choose the right Riverpod provider types for auth, paging, and per-item state."
