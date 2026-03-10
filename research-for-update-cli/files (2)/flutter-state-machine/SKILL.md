---
name: flutter-state-machine
description: >
  Use when implementing or auditing the shared Flutter screen-state contract:
  loading, data, empty, error, and dead-letter rendering plus consistent error
  mapping. Do not use for generic Riverpod work when the project does not use
  this AppState pattern.
---

# Flutter State Machine

## Overview

Use this skill when a screen or feature needs a consistent app-state contract
instead of ad hoc loading and error handling.

## When to Use

- Adding AppState/AppError infrastructure
- Refactoring a screen away from raw async branching
- Auditing notifier state transitions
- Standardizing error and dead-letter rendering

## Core Workflow

1. Identify whether the screen is list, detail, or mutation-heavy.
2. Map repository or service output into the shared state contract.
3. Keep notifier transition logic small and explicit.
4. Render through a shared state widget or equivalent adapter.
5. Ensure every error path exposes a usable request ID.

## Core Rules

- Handle loading, data, empty, error, and dead-letter intentionally.
- Keep AppError typed and request-ID aware.
- Notifiers translate failures into app-state cases; widgets render them.
- UI should not duplicate error-state mapping logic across screens.

## Load References When Needed

| File | Load when |
| --- | --- |
| `references/app-state-contract.md` | Defining `AppState`, `AppError`, and notifier mapping rules. |
| `references/ui-rendering.md` | Building or reviewing the shared widget that renders each state consistently. |
