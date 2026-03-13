````markdown
---
inclusion: manual
name: flutter-design-system
description: "Use when creating, auditing, or extending shared Flutter theme tokens, ThemeData, and reusable cross-feature UI primitives such as loading, error, empty, dead-letter, and sync-status components. Do not use for one-off screen styling that should remain local."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Flutter Design System

## Purpose

Keep shared Flutter visual decisions centralized in theme tokens and reusable
UI primitives instead of repeating feature-specific styling.

## When to Use

- Adding or changing colors, spacing, radius, typography, or elevations
- Wiring or refactoring app-wide `ThemeData`
- Creating shared widgets used across multiple screens
- Replacing hard-coded visual values with design-system tokens
- Auditing feature UI for token compliance

## Instructions

1. Inspect the existing theme contract before adding new tokens.
2. Reuse an existing token or shared widget when possible.
3. Add a new token only when the concept is reusable across features.
4. Keep shared widgets generic and free of feature repositories, notifiers, or routes.
5. Prefer Material 3 theming through `ThemeData` before per-widget overrides.
6. Replace hard-coded values in consuming widgets after updating the shared system.

## Output Format

Produce Flutter guidance or code that:

- uses `AppColors`, `AppSpacing`, `AppTypography`, and `AppRadius` consistently,
- keeps shared widgets generic and token-driven,
- identifies which changes belong in theme files versus shared widgets,
- includes audit notes when replacing hard-coded values.

## References

Load only what the current step needs.

| File | Load when |
| --- | --- |
| `references/tokens-and-theme.md` | Adding tokens, changing `ThemeData`, or reviewing shared theme file organization. |
| `references/shared-widgets.md` | Creating or auditing shared widgets such as loading, error, empty, dead-letter, or sync-status components. |

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Replace hard-coded spacing and colors in this Flutter module with shared tokens."
- "Set up a reusable `ErrorView` and `LoadingView` for the app shell."
````
