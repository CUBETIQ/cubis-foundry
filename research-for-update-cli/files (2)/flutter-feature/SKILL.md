---
name: flutter-feature
description: >
  Use when scaffolding a full Flutter feature across data, domain,
  presentation, routing, offline sync, and tests. Do not use for isolated work
  in a single layer when a narrower Flutter skill already fits.
---

# Flutter Feature Scaffold

## Overview

Use this skill when the user describes a new piece of app functionality that
needs more than one layer. The goal is a complete, architecture-compliant
feature instead of a partial stub.

## Gather Before Generating

Clarify or infer:

1. Feature name
2. Data fields
3. Required operations
4. Cross-feature dependencies
5. Whether business logic deserves a domain service
6. Offline conflict strategy when sync is involved

If those answers are unclear, stop and resolve them before generating files.

## Output Contract

- Generate complete files, not placeholders.
- Keep naming and folder structure consistent.
- Only add a domain service when business rules justify it.
- Only add detail/composite providers when multiple features are composed.
- Mirror production structure in tests.

## Quality Bar

- Repository owns local/remote coordination.
- Service owns business rules.
- Notifier owns state transitions.
- Widgets render shared app state and design-system primitives.
- Offline-capable writes follow the outbox pattern.
- New feature work ships with tests.

## Load References When Needed

| File | Load when |
| --- | --- |
| `references/architecture-rules.md` | Checking layer boundaries, naming, AppState rules, and design-system constraints. |
| `references/composite-provider.md` | A screen depends on multiple features and needs provider-layer composition. |
| `references/testing-patterns.md` | Generating repository, service, notifier, or widget tests. |
| `references/outbox-pattern.md` | The feature writes offline, syncs later, or needs conflict/dead-letter behavior. |
