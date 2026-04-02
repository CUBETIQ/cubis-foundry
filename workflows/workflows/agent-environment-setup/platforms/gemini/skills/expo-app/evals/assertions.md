# Expo App Eval Assertions

## Eval 1: EAS Build Configuration

This eval tests EAS Build configuration: defining build profiles for development, preview, and production with proper signing, environment variables, and runtime versioning.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `eas.json` — Configuration file reference        | All EAS Build configuration lives in eas.json. Without it, `eas build` has no profiles to execute against. |
| 2 | contains | `developmentClient` — Dev client flag            | Setting developmentClient: true in the development profile builds with expo-dev-client, enabling custom native module support that Expo Go cannot provide. |
| 3 | contains | `distribution` — Distribution channel            | Each profile needs explicit distribution (internal for dev/preview, store for production) to control who can install the build and how. |
| 4 | contains | `runtimeVersion` — OTA compatibility versioning  | Runtime versioning ties OTA updates to compatible native binaries. Without it, a JS update targeting a different native version crashes on launch. |
| 5 | contains | `env` — Per-profile environment variables        | Different environments need different API keys and endpoints. Build-time env injection prevents secrets from being committed to source control. |

### What a passing response looks like

- An `eas.json` file with three profiles: development, preview, production.
- Development profile with `developmentClient: true`, `distribution: "internal"`, and debug env vars.
- Preview profile with `distribution: "internal"` or `"store"` for TestFlight/internal track.
- Production profile with `distribution: "store"` and production API keys.
- `runtimeVersion` configured with `{ "policy": "fingerprint" }` or `{ "policy": "appVersion" }` in `app.config.js`.
- Environment variables defined per profile for API_URL, API_KEY, and similar configuration.

---

## Eval 2: Push Notification Setup

This eval tests push notification implementation: token registration, permission handling, foreground display, tap handling, and server-side delivery.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `getExpoPushTokenAsync` — Token acquisition      | The Expo push token is the device identifier required for server-side push delivery. Without it, the server cannot target this device. |
| 2 | contains | `requestPermissionsAsync` — Permission request   | iOS requires explicit permission and Android 13+ requires POST_NOTIFICATIONS. Skipping permission request causes silent token acquisition failure. |
| 3 | contains | `setNotificationHandler` — Foreground behavior   | Without a notification handler, notifications received while the app is foregrounded are silently discarded instead of displayed. |
| 4 | contains | `addNotificationResponseReceivedListener` — Tap handling | Users expect tapping a notification to open the relevant screen. Without a response listener, taps open the app but do not navigate to context. |
| 5 | contains | `expo.dev/--/api/v2/push/send` — Server delivery | Push notifications must be sent through Expo's push API, which handles APNs/FCM routing. Calling APNs/FCM directly bypasses Expo's token format. |

### What a passing response looks like

- App initialization code that requests permissions, then calls `getExpoPushTokenAsync`.
- Token sent to the backend API for storage, with handling for token refresh on subsequent launches.
- `setNotificationHandler` configured with `shouldShowAlert: true` for foreground display.
- `addNotificationResponseReceivedListener` that extracts navigation data from the notification and uses expo-router to navigate.
- Server endpoint that POSTs to Expo's push API with the push token, title, body, and optional data payload.
