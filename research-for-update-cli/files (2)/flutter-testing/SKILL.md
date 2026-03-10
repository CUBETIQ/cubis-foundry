---
name: flutter-testing
description: >
  Use when adding or refactoring Flutter tests for repositories, services,
  Riverpod notifiers, widgets, and golden coverage around a feature. Do not
  use for production feature implementation unless the task is explicitly test
  focused.
---

# Flutter Testing

## Overview

Use this skill to design verification around a Flutter feature instead of
shipping only happy-path code. Favor a layered test strategy that matches the
feature's actual risk.

## When to Use

- Adding missing test coverage
- Writing tests for a new feature
- Verifying offline sync behavior
- Testing provider state transitions
- Adding widget or golden regression coverage

## Core Workflow

1. Identify the feature layers that exist.
2. Cover repository behavior with local persistence and sync expectations.
3. Cover service rules separately when business logic exists.
4. Cover notifier/provider transitions and widget rendering.
5. Add goldens only where visual regression risk is real.

## Core Rules

- Do not collapse all verification into widget tests.
- Test local-first and offline behavior where relevant.
- Assert state transitions, not only final snapshots.
- Keep test setup reusable and explicit through helpers, fakes, or overrides.

## Load References When Needed

| File | Load when |
| --- | --- |
| `references/test-layers.md` | Choosing which repository, service, notifier, widget, or golden tests to generate. |
| `references/offline-sync-tests.md` | Verifying outbox, retry, conflict, or dead-letter behavior. |
