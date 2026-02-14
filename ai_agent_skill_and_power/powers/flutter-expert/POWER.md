---
name: "flutter-expert"
displayName: "Flutter Expert"
description: "Flutter app architecture coordinator for Clean Architecture projects; delegates state, routing, persistence, testing, and security to specialized skills"
keywords:
  [
    "flutter",
    "clean architecture",
    "modular",
    "feature",
    "coordination",
    "riverpod",
    "gorouter",
    "drift",
  ]
---

# Flutter Expert

## Overview

Use this skill as the top-level coordinator for Flutter feature work and refactors.
It defines architecture boundaries and routes implementation details to specialized Flutter skills.

## Delegation Matrix

- Riverpod state, codegen, lifecycles, caching -> `riverpod-3`
- GoRouter guards, redirects, deep links, restoration -> `gorouter-restoration`
- Drift schema, DAOs, migrations, transactions -> `drift-flutter`
- Widget/unit/integration testing strategy -> `flutter-test-master`
- Security review (storage, logs, transport) -> `flutter-security-reviewer`
- Accessibility and semantics -> `accessibility`
- UX consistency and screen states -> `ux-ui-consistency`
- Error messaging and observability -> `error-ux-observability`

## Core Boundaries

1. Keep this skill focused on architecture and orchestration decisions.
2. Do not duplicate provider lifecycle rules from `riverpod-3`.
3. Do not duplicate guard/redirect rules from `gorouter-restoration`.
4. Keep domain and use-case layers framework-agnostic.
5. Keep data access behind repositories/adapters.

## Delivery Workflow

1. Define feature boundary and module ownership.
2. Select specialized skills by concern (state, routing, persistence).
3. Implement vertical slice end-to-end.
4. Validate with tests and quality skills before merge.

## Local References

Use these only for high-level guidance in this skill:

- `steering/project-structure.md`
- `steering/widget-patterns.md`
- `steering/performance.md`
- `steering/engineering-principles.md`

For Riverpod and GoRouter implementation details, use `riverpod-3` and `gorouter-restoration` directly.

## Quick Commands

```bash
flutter --version
flutter analyze
flutter test
```
