---
name: react-native
description: "Use when building cross-platform mobile applications with React Native and Expo. Invoke for New Architecture (Fabric, TurboModules), Expo SDK 52+, native module bridging, navigation, and mobile performance optimization."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: "Claude Code, Codex, GitHub Copilot"
---
# React Native with Expo

Senior mobile engineer specializing in React Native 0.76+ New Architecture and Expo SDK 52+ for production cross-platform applications on iOS and Android.

## Purpose

Provide authoritative guidance on building production React Native applications using the New Architecture (Fabric renderer, TurboModules) with Expo as the development platform. This skill covers native module bridging, type-safe navigation with deep linking, performance profiling, and deployment to app stores.

## When to Use

- Creating new React Native projects with Expo SDK 52+
- Migrating existing apps to the New Architecture (Fabric + TurboModules)
- Building or consuming native modules and Expo modules
- Implementing stack/tab/drawer navigation with deep linking
- Profiling and optimizing rendering performance on mobile
- Writing tests for React Native components and navigation flows
- Configuring EAS Build and EAS Submit for app store deployment

## Instructions

1. **Initialize projects with `npx create-expo-app`** using the latest Expo SDK 52+ template, because Expo provides a managed workflow that handles native toolchain complexity while still allowing bare-workflow escape hatches when needed.

2. **Enable the New Architecture in `app.json`** by setting `"newArchEnabled": true` for both iOS and Android, because the New Architecture (Fabric + TurboModules) provides synchronous native calls, concurrent rendering support, and eliminates the legacy bridge bottleneck.

3. **Use Fabric components instead of legacy Paper components** wherever available, because Fabric renders on the UI thread with C++ shared ownership, reducing bridge serialization overhead and enabling interruptible rendering.

4. **Create native modules with the TurboModule system** using codegen-typed specs, because TurboModules are lazily loaded, type-safe at the native boundary, and avoid the startup cost of eagerly registering all legacy native modules.

5. **Build custom native functionality as Expo Modules** using the Expo Modules API (`expo-modules-core`), because Expo Modules provide a unified Swift/Kotlin API that generates correct TurboModule bindings and works in both managed and bare workflows.

6. **Implement navigation with Expo Router** using file-based routing in the `app/` directory, because Expo Router provides automatic deep linking, type-safe routes, and universal links support out of the box without manual linking configuration.

7. **Configure deep linking schemes** in `app.json` (`scheme` field) and verify with `npx uri-scheme`, because deep links that work in development but fail in production are a common cause of user-facing bugs and broken marketing flows.

8. **Handle navigation state persistence and restoration** by implementing `onStateChange` and `initialState` on the root navigator, because users expect to return to their previous screen after the app is killed and restarted from a background state.

9. **Separate business logic from UI using custom hooks and context** rather than embedding logic in screen components, because screen components change frequently with navigation refactors while business logic should remain stable and testable.

10. **Profile rendering performance with React DevTools and Flipper** using the `<Profiler>` component and the Fabric performance overlay, because mobile devices have constrained CPU/GPU and janky frames (>16ms) directly impact user retention.

11. **Optimize list rendering with `FlashList`** instead of `FlatList` for large datasets, because FlashList recycles native views and reduces JS-to-native bridge calls, achieving consistent 60fps on mid-range devices.

12. **Minimize JS bundle size** by enabling Hermes engine, using `import()` for lazy screens, and tree-shaking unused exports, because large bundles increase cold-start time on Android devices by 200-500ms per megabyte.

13. **Write component tests with Jest and React Native Testing Library** using `@testing-library/react-native`, because testing against the component tree (not implementation details) catches regressions while allowing refactoring freedom.

14. **Test navigation flows with Detox or Maestro** for E2E coverage on real device behavior, because navigation state machines, gesture handlers, and native transitions cannot be fully validated in a JS-only test environment.

15. **Configure EAS Build profiles** (`development`, `preview`, `production`) in `eas.json`, because each build profile needs different signing credentials, environment variables, and optimization flags that must not leak across environments.

16. **Implement over-the-air updates with `expo-updates`** for JavaScript-only changes, because OTA updates bypass app store review cycles and allow critical bug fixes to reach users within minutes instead of days.

## Output Format

When delivering React Native + Expo code:

1. **Screen components** -- `.tsx` files in `app/` directory following Expo Router file conventions
2. **Native modules** -- Expo Module definitions with Swift/Kotlin implementations and TypeScript bindings
3. **Navigation configuration** -- Deep linking schemes, typed route params, and navigation guards
4. **Test files** -- `.test.tsx` files with RNTL for components and Detox/Maestro specs for E2E
5. **Build configuration** -- `app.json`, `eas.json`, and environment-specific config files
6. **Brief rationale** -- One-sentence explanation for each architectural decision

## References

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| New Architecture | `references/new-architecture.md` | Fabric, TurboModules, codegen, migration |
| Navigation | `references/navigation.md` | Expo Router, deep linking, typed routes, guards |
| Native Modules | `references/native-modules.md` | Expo Modules API, Swift/Kotlin bridging, codegen |
| Testing | `references/testing.md` | Jest, RNTL, Detox, Maestro, mocking native APIs |
| Performance | `references/performance.md` | Hermes, FlashList, profiling, bundle optimization |

## Copilot Platform Notes

- Custom agents are defined in `.github/agents/*.md` with YAML frontmatter: `name`, `description`, `tools`, `model`, `handoffs`.
- Agent `handoffs` field enables guided workflow transitions (e.g., `@project-planner` → `@orchestrator`).
- Skill files are stored under `.github/skills/` (skill markdown) and `.github/prompts/` (prompt files).
- Path-scoped instructions in `.github/instructions/*.instructions.md` provide file-pattern-targeted guidance via `applyTo` frontmatter.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context: fork` and `allowed-tools` are not natively supported; guidance is advisory.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
- MCP configuration lives in `.vscode/mcp.json`. MCP skill tools are available when configured.
- Rules file: `.github/copilot-instructions.md` — broad and stable, not task-specific.
