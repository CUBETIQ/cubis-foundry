# Testing

Load this when Expo work needs platform-specific test ownership, OTA validation rules, or a handoff into the canonical Android/iOS/web runtime-testing skills.

## Ownership

- Keep Expo app bootstrapping, navigation seams, config-plugin seams, and OTA validation in the Expo skill.
- Keep narrow TypeScript-only checks in `typescript-best-practices`.
- Use `android-emulator-testing` for live Android evidence.
- Use `ios-simulator-testing` for live iOS evidence.
- Use `web-testing` only for Expo web/browser flows.

## Code-level tests

- Use Jest or the repo's existing React Native test stack for component and module checks.
- Focus on navigation state, feature flags, permissions prompts, and app-shell behavior that are specific to the Expo runtime.
- Stub native modules at the boundary and keep fixture setup deterministic.

## OTA and config checks

- Test runtime version selection, channel selection, and update prompts at the configuration boundary.
- Add coverage when config plugins or native-module assumptions change.
- Verify that platform-specific branches are explicit and tested on the platform they affect.

## Escalation rules

- Move into `android-emulator-testing` or `ios-simulator-testing` when the task requires screenshots, simulator/emulator traces, UI trees, logs, or release-readiness evidence.
- Move into `web-testing` when the work is about real browser behavior instead of Expo runtime composition.
