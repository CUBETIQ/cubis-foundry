---
name: flutter-testing
description: "Use when adding or refactoring Flutter tests for repositories, services, Riverpod notifiers, widgets, and golden coverage around a feature. Do not use for production feature implementation unless the task is explicitly test-focused."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Flutter Testing

## Purpose

Guide layered Flutter verification so repositories, services, notifiers,
widgets, and high-value UI surfaces are tested at the right level.

## When to Use

- Adding missing test coverage
- Writing tests for a new feature
- Verifying offline-sync behavior
- Testing provider state transitions
- Adding widget or golden regression coverage

## Instructions

1. Identify which feature layers actually exist before generating tests.
2. Cover repository behavior with local persistence and sync expectations.
3. Cover service rules separately when business logic exists.
4. Cover notifier or provider transitions directly.
5. Cover widgets for state-specific rendering and interaction.
6. Add goldens only where visual regression risk is real.
7. Assert transitions and side effects, not only final snapshots.

## Output Format

Produce test guidance or code that:

- identifies the right layers to test,
- names the behaviors that must be verified,
- distinguishes unit, provider, widget, and golden coverage,
- includes offline-sync expectations when the feature needs them.

## References

Load only what the current step needs.

| File | Load when |
| --- | --- |
| `references/test-layers.md` | Choosing which repository, service, notifier, widget, or golden tests to generate. |
| `references/offline-sync-tests.md` | Verifying outbox, retry, conflict, or dead-letter behavior. |

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Add repository, notifier, and widget tests for this Flutter feature."
- "Review the offline-sync tests for retry and dead-letter coverage gaps."
