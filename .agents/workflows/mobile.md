---
command: "/mobile"
description: "Drive mobile implementation decisions for Flutter/cross-platform behavior and reliability."
triggers: ["mobile", "flutter", "ios", "android", "navigation"]
---
# Mobile Workflow

## When to use
Use this when mobile app architecture, UX behavior, or platform constraints are the focus.

## Routing
- Primary specialist: `@mobile-developer`
- UI support: `@frontend-specialist`
- Verification support: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `mobile-design`, `flutter-expert`
- Supporting skills (optional): `riverpod-3`, `drift-flutter`, `flutter-test-master`

## Workflow steps
1. Confirm platform and UX constraints.
2. Plan navigation/state/offline behavior.
3. Implement or refactor mobile flows.
4. Validate behavior across critical paths.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Mobile flow changes
- Platform constraints handled
- Test coverage summary
- Release-readiness notes
