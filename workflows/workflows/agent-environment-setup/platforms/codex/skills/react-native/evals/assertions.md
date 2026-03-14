# React Native with Expo -- Eval Assertions

## Eval 01: Navigation with deep linking

This eval validates correct implementation of Expo Router navigation with deep linking, typed parameters, and cold-start handling.

### Assertions

| # | Type | Target | Rationale |
|---|------|--------|-----------|
| 1 | pattern | `app/.*\.(tsx\|ts)` | Verifies the skill uses file-based routing in the `app/` directory. Expo Router requires route files in `app/` to generate the navigation tree automatically. |
| 2 | contains | `scheme` | Verifies the skill configures a deep linking scheme. The `scheme` field in `app.json` registers the URL protocol (e.g., `myapp://`) that the OS routes to the app. |
| 3 | pattern | `\[id\]\|useLocalSearchParams\|useGlobalSearchParams` | Verifies the skill implements typed dynamic route parameters. Product detail requires an `id` param accessed via Expo Router's typed search param hooks. |
| 4 | pattern | `Tabs\|Tab\|_layout` | Verifies the skill implements tab navigation. The Home screen requires a tab layout defined in an `_layout.tsx` file using Expo Router's `<Tabs>` component. |
| 5 | pattern | `Linking\|linking\|useURL\|expo-linking` | Verifies the skill handles incoming deep links. Cold-start deep link handling requires `expo-linking` or Expo Router's built-in URL resolution to read the initial URL. |

### What a passing response looks like

A passing response provides:
- An `app/_layout.tsx` root layout with navigation container setup
- An `app/(tabs)/_layout.tsx` tab navigator for Home
- An `app/product/[id].tsx` screen with `useLocalSearchParams<{ id: string }>()`
- Deep link scheme configuration in `app.json` (`"scheme": "myapp"`)
- Cold-start handling that reads the initial URL and navigates to the correct screen
- TypeScript type definitions for all route parameters

---

## Eval 02: Native module bridging with Expo Modules

This eval validates correct creation of a custom Expo Module with native Swift/Kotlin implementations and TypeScript bindings.

### Assertions

| # | Type | Target | Rationale |
|---|------|--------|-----------|
| 1 | pattern | `Module\|ExpoModule\|expo-modules-core` | Verifies the skill uses the Expo Modules API. Expo Modules provide a unified module definition API that generates TurboModule-compatible bindings for both platforms. |
| 2 | pattern | `UIImpactFeedbackGenerator\|UIKit\|haptic` | Verifies the skill includes the iOS native implementation. On iOS, haptic feedback requires `UIImpactFeedbackGenerator` from UIKit with the correct feedback style. |
| 3 | pattern | `VibrationEffect\|Vibrator\|android\.os` | Verifies the skill includes the Android native implementation. On Android, haptic feedback requires `VibrationEffect` (API 26+) or the legacy `Vibrator` service. |
| 4 | pattern | `Function\|AsyncFunction\|function\(` | Verifies the skill defines module functions using Expo's function registration API. Each exposed method must be registered via `Function("name") { ... }` in the module definition. |
| 5 | pattern | `export.*triggerImpact\|import.*ExpoHaptics` | Verifies the skill provides TypeScript exports and demonstrates consumption. The module must have a TypeScript facade that consumers import, preserving type safety. |

### What a passing response looks like

A passing response provides:
- An `ExpoHapticsModule.ts` definition using `expo-modules-core` API
- A `ExpoHapticsModule.swift` iOS implementation using `UIImpactFeedbackGenerator` with `.light`, `.medium`, `.heavy` styles
- A `ExpoHapticsModule.kt` Android implementation using `VibrationEffect.createOneShot()` with appropriate amplitudes
- TypeScript type definitions for the `triggerImpact(style)` function with the union type parameter
- An example React Native component that imports and calls the module
