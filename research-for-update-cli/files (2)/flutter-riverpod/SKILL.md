---
name: flutter-riverpod
description: >
  Use when creating, refactoring, or auditing Riverpod 3 providers and
  notifiers in Flutter with code generation and correct lifecycle boundaries.
  Do not use for widget-local ephemeral state that should stay inside the UI.
---

# Flutter Riverpod

## Overview

Use this skill for production Riverpod patterns with codegen. Favor stable
provider boundaries, predictable rebuild behavior, and clear separation between
rendering, state transitions, and side effects.

## When to Use

- Adding a provider or notifier
- Refactoring provider lifecycles
- Fixing rebuild storms or dependency loops
- Designing async loading and mutation flows
- Writing or reviewing Riverpod tests

## Core Workflow

1. Choose the right provider type for the state shape.
2. Default to codegen-based providers and notifiers.
3. Keep `watch`, `read`, and `listen` used in the right places.
4. Keep business logic outside widgets.
5. Add tests for provider behavior and edge cases.

## Core Rules

- Default to auto-dispose unless the state is clearly app-wide and long-lived.
- Use `ref.watch` in build/render paths.
- Use `ref.read` for imperative callbacks and mutation methods.
- Use `ref.listen` or equivalent for side effects.
- Avoid `StateNotifierProvider` and `ChangeNotifierProvider` in new code unless the project already depends on them.
- Verify package versions against current official Riverpod docs and the project's Flutter SDK constraints before pinning them in code or docs.

## Load References When Needed

| File | Load when |
| --- | --- |
| `references/provider-selection.md` | Choosing between function providers, `Notifier`, `AsyncNotifier`, streams, or keep-alive behavior. |
| `references/async-and-mutations.md` | Designing refresh, async guards, stream-backed state, or mutation flows. |
| `references/testing.md` | Writing `ProviderContainer` tests or widget tests around Riverpod state. |
