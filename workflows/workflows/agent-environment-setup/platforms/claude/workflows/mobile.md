---
command: "/mobile"
description: "Drive mobile implementation decisions for Flutter/cross-platform behavior and reliability."
triggers: ["mobile", "flutter", "ios", "android", "navigation"]
---

# Mobile Workflow

# CHANGED: output contract — converted free-form bullets into structured YAML — keeps mobile flow changes and readiness notes machine-readable.

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

- Primary skills: `dart-pro`, `swift-pro`, `kotlin-pro`, `typescript-pro`, `javascript-pro`
- Flutter skills (load on demand): `flutter-riverpod`, `flutter-go-router`, `flutter-drift`, `flutter-repository`, `flutter-offline-sync`, `flutter-state-machine`, `flutter-design-system`, `flutter-feature`, `flutter-testing`
- Supporting skills (optional): `skill-creator`
- Choose `dart-pro`, `swift-pro`, or `kotlin-pro` first for native/mobile code. Use the JavaScript or TypeScript skills only for React Native or web-adjacent mobile surfaces. For Flutter projects, add the narrowest Flutter specialist skill for the current concern.

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

```yaml
MOBILE_WORKFLOW_RESULT:
  primary_agent: mobile-developer
  supporting_agents: [frontend-specialist?, test-engineer?]
  primary_skills: [dart-pro, swift-pro]
  supporting_skills: [kotlin-pro?, typescript-pro?, javascript-pro?, skill-creator?]
  flow_changes: [<string>]
  platform_constraints_handled: [<string>]
  test_coverage_summary: [<string>]
  release_readiness_notes: [<string>] | []
```
