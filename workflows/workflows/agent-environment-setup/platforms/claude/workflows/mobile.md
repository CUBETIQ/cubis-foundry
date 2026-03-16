---
command: "/mobile"
description: "Drive mobile implementation decisions for Flutter/cross-platform behavior and reliability."
triggers: ["mobile", "flutter", "ios", "android", "navigation"]
---

# Mobile Workflow

## When to use

Use this for mobile app development, Flutter architecture, Stitch-driven mobile screen handoff, native integrations, or platform-specific behavior.

## Routing

- Primary specialist: `@mobile-developer`
- Design support: `@frontend-specialist`
- Verification support: `@test-engineer`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach platform targets (iOS, Android, both), Flutter version, and relevant screen/feature context.
- Read `ENGINEERING_RULES.md` and `docs/foundation/TECH.md` before implementing non-trivial mobile work so screens and features follow the declared architecture and design-system rules. Check `docs/foundation/PRODUCT.md` for `## Domain Glossary` to use consistent terminology.

## Skill Routing

- Primary skills: `expo-app`, `react-native`
- Supporting skills (optional): `stitch`, `frontend-design`, `expo-app`, `expo-app`, `expo-app`, `expo-app`, `expo-app`, `expo-app`, `expo-app`, `expo-app`, `expo-app`, `swift-best-practices`, `kotlin-best-practices`
- Start with `expo-app` for feature implementation and `react-native` for UX patterns. Add framework-specific Flutter skill when applicable. Add `frontend-design` for multi-language support.
- When the request starts from Stitch artifacts or a design sync, load `stitch` first and then pair it with `react-native` plus the narrowest mobile implementation skill for the target stack.

## Workflow steps

1. Clarify platform targets and feature requirements.
2. Design architecture with platform-appropriate patterns.
3. Implement with consideration for iOS/Android differences.
4. Write widget and integration tests.
5. Review for platform-specific edge cases and UX conventions.
6. Set `doc_impact` if the feature changes navigation, shared UI rules, or mobile architecture conventions.

## Verification

- Runs correctly on both target platforms.
- Platform-specific conventions respected (iOS/Android).
- Touch targets and gesture feedback appropriate.
- Widget tests cover core behavior.
- Offline behavior tested if applicable.

## Output Contract

```yaml
MOBILE_WORKFLOW_RESULT:
  primary_agent: mobile-developer
  supporting_agents: [frontend-specialist?, test-engineer?]
  primary_skills: [expo-app, react-native]
  supporting_skills: [stitch?, frontend-design?, expo-app?, expo-app?, <flutter-specific>?]
  implementation:
    platforms: [ios, android]
    architecture_decisions: [<string>]
    changed_artifacts: [<path>]
  testing:
    widget_tests: [<path>]
    integration_tests: [<path>] | []
  platform_notes:
    ios: [<string>] | []
    android: [<string>] | []
  doc_impact: none | tech | rules | both
  follow_up_items: [<string>] | []
```
