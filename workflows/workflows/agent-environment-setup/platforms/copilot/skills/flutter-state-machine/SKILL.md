---
name: flutter-state-machine
description: "Use when implementing or auditing the shared Flutter screen-state contract: loading, data, empty, error, and dead-letter rendering plus consistent error mapping. Do not use for generic Riverpod work when the project does not use this AppState pattern."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Flutter State Machine

## Purpose

Guide a consistent Flutter screen-state contract so loading, data, empty,
error, and dead-letter behavior are handled predictably across features.

## When to Use

- Adding app-state infrastructure
- Refactoring a screen away from ad hoc async branching
- Auditing notifier state transitions
- Standardizing error and dead-letter rendering

## Instructions

1. Identify whether the screen is list, detail, or mutation-heavy.
2. Map repository or service output into the shared app-state contract.
3. Keep notifier transition logic small and explicit.
4. Keep AppError typed and request-ID aware.
5. Render through a shared state widget or equivalent adapter where possible.
6. Ensure every failure path carries enough context for support and debugging.

## Output Format

Produce app-state guidance or code that:

- names the expected state cases,
- shows where notifier mapping stops and widget rendering starts,
- keeps error and dead-letter behavior distinct,
- includes the shared rendering expectations for state-specific UI.

## References

Load only what the current step needs.

| File | Load when |
| --- | --- |
| `references/app-state-contract.md` | Defining `AppState`, `AppError`, and notifier mapping rules. |
| `references/ui-rendering.md` | Building or reviewing the shared widget that renders each state consistently. |

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Standardize this Flutter screen on the shared AppState contract."
- "Review these notifier transitions for missing error or dead-letter cases."
