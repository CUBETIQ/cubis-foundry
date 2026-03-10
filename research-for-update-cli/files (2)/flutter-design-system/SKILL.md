---
name: flutter-design-system
description: >
  Use when creating, auditing, or extending shared Flutter theme tokens,
  ThemeData, and reusable state widgets such as loading, error, empty, dead
  letter, or sync-status components. Do not use for one-off feature styling
  that should stay local to a single screen.
---

# Flutter Design System

## Overview

Use this skill to keep visual decisions centralized in shared theme tokens and
shared UI primitives. Prefer small, reusable design-system changes over
copy-pasted widget styling.

## When to Use

- Adding or changing colors, spacing, radius, typography, or elevations
- Wiring or refactoring app-wide `ThemeData`
- Creating shared widgets used across multiple screens
- Replacing hard-coded `Color`, `TextStyle`, padding, or radius values
- Auditing feature UI for token compliance

## Core Workflow

1. Inspect the existing theme contract before adding new tokens.
2. Reuse an existing token or shared widget when possible.
3. Add new tokens only when the concept is reusable across features.
4. Keep shared widgets generic and feature-agnostic.
5. Replace hard-coded values in consuming widgets after updating the system.

## Core Rules

- Colors come from `AppColors` only.
- Spacing comes from `AppSpacing` only.
- Text styles come from `AppTypography` only.
- Radius comes from `AppRadius` only.
- Shared widgets must not import feature repositories, notifiers, or routes.
- Prefer Material 3 theming through `ThemeData` before per-widget overrides.

## Load References When Needed

| File | Load when |
| --- | --- |
| `references/tokens-and-theme.md` | Adding tokens, changing `ThemeData`, or reviewing how shared theme files should be organized. |
| `references/shared-widgets.md` | Creating or auditing shared widgets such as `LoadingView`, `ErrorView`, `EmptyView`, `DeadLetterView`, or `SyncStatusBadge`. |
