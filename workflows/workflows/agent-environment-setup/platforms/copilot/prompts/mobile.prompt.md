# Workflow Prompt: /mobile

Drive mobile implementation decisions for Flutter/cross-platform behavior and reliability.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `expo-app`, `react-native`, `stitch`, `frontend-design`, `swift-best-practices`, `kotlin-best-practices`.
- Local skill file hints if installed: `.github/skills/expo-app/SKILL.md`, `.github/skills/react-native/SKILL.md`, `.github/skills/stitch/SKILL.md`, `.github/skills/frontend-design/SKILL.md`, `.github/skills/swift-best-practices/SKILL.md`, `.github/skills/kotlin-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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

- Primary skills: `flutter-feature`, `mobile-design`
- Supporting skills (optional): `stitch`, `i18n-localization`, `flutter-riverpod`, `flutter-go-router`, `flutter-design-system`, `flutter-testing`, `flutter-drift`, `flutter-offline-sync`, `flutter-state-machine`, `flutter-repository`, `dart-pro`, `swift-pro`, `kotlin-pro`
- Start with `flutter-feature` for feature implementation and `mobile-design` for UX patterns. Add framework-specific Flutter skill when applicable. Add `i18n-localization` for multi-language support.
- When the request starts from Stitch artifacts or a design sync, load `stitch` first and then pair it with `mobile-design` plus the narrowest mobile implementation skill for the target stack.

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
  primary_skills: [flutter-feature, mobile-design]
  supporting_skills: [stitch?, i18n-localization?, flutter-riverpod?, flutter-testing?, <flutter-specific>?]
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
