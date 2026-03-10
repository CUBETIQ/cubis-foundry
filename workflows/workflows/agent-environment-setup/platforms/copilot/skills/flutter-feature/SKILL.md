---
name: flutter-feature
description: "Use when scaffolding a full Flutter feature across data, domain, presentation, routing, offline sync, and tests. Do not use for isolated single-layer work when a narrower Flutter skill already fits."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Flutter Feature Scaffold

## Purpose

Generate a complete, architecture-compliant Flutter feature instead of shipping
partial stubs across disconnected layers.

## When to Use

- Adding a new feature with UI, state, data, and tests
- Scaffolding a feature that spans multiple layers
- Defining a feature that needs routing or offline support
- Generating a consistent feature folder structure

## Instructions

1. Clarify or infer the feature name, data fields, operations, cross-feature dependencies, business-logic needs, and offline conflict strategy.
2. Stop and resolve missing requirements before generating files.
3. Keep naming and folder structure consistent across data, domain, presentation, routing, and tests.
4. Add a domain service only when business rules justify it.
5. Add composite providers only when a screen composes multiple features.
6. Keep repository, service, notifier, and widget responsibilities separate.
7. Ship tests with the feature instead of leaving verification for later.

## Output Format

Produce feature scaffolding guidance or code that:

- names the expected files and layer ownership,
- calls out optional pieces such as domain services or composite providers,
- keeps offline writes on the outbox path when needed,
- includes the test surface that should ship with the feature.

## References

Load only what the current step needs.

| File | Load when |
| --- | --- |
| `references/architecture-rules.md` | Checking layer boundaries, naming, app-state rules, and design-system constraints. |
| `references/composite-provider.md` | A screen depends on multiple features and needs provider-layer composition. |
| `references/testing-patterns.md` | Generating repository, service, notifier, or widget tests. |
| `references/outbox-pattern.md` | The feature writes offline, syncs later, or needs conflict or dead-letter behavior. |

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Scaffold a Flutter inventory feature with offline edits and tests."
- "Generate the full feature structure for a new sales module."
