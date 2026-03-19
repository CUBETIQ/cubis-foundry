---
name: expo-app
description: "Use when building or maintaining Expo applications: SDK 52+ features, EAS Build and Submit pipelines, OTA updates with expo-updates, native module integration via config plugins, push notifications with expo-notifications, and cross-platform testing."
---
# Expo App Development

## Purpose

Guide the design and implementation of production-grade Expo applications using SDK 52+, covering EAS Build pipelines for iOS and Android, over-the-air update strategies, native module integration through config plugins and Expo Modules API, push notification delivery with expo-notifications, and cross-platform testing workflows.

## When to Use

- Scaffolding a new Expo project or upgrading an existing one to SDK 52+.
- Configuring EAS Build profiles for development, preview, and production builds.
- Setting up OTA updates with expo-updates for instant deployment without app store review.
- Integrating native modules via config plugins or the Expo Modules API.
- Implementing push notifications with token management and delivery tracking.
- Writing cross-platform tests that cover iOS, Android, and web targets.

## Instructions

1. **Start with `npx create-expo-app` using the latest SDK template** because Expo SDK versions pin compatible library versions, and starting from the template avoids version mismatch issues that cause build failures.

2. **Choose between managed and development builds early** because managed workflow uses Expo Go for rapid iteration but limits native module access, while development builds require EAS Build but support any native code.

3. **Configure EAS Build profiles for development, preview, and production** because each environment needs different signing credentials, environment variables, and optimization settings. Define all three in `eas.json` from day one.

4. **Use `expo-dev-client` for development builds instead of Expo Go** because development builds include your custom native modules and config plugins while retaining fast refresh, whereas Expo Go only supports Expo SDK libraries.

5. **Implement OTA updates with `expo-updates` and a channel-based release strategy** because OTA updates skip app store review for JavaScript and asset changes, and channels let you target updates to specific build profiles (production, staging).

6. **Set a runtime version policy that ties updates to native compatibility** because an OTA update targeting a different native binary crashes on launch. Use `runtimeVersion: { policy: "appVersion" }` or `"fingerprint"` to prevent mismatches.

7. **Add native modules through config plugins before resorting to bare ejection** because config plugins modify the native project at build time without requiring you to manage Xcode or Gradle files directly, keeping the project upgradeable.

8. **Use the Expo Modules API for custom native code** because it provides a unified Swift and Kotlin API with automatic TypeScript type generation, avoiding the complexity of React Native's bridge or Turbo Module system.

9. **Implement push notifications with `expo-notifications` and register tokens on the server** because push delivery requires a device token mapped to a user, and tokens change across reinstalls so the server must handle re-registration.

10. **Handle notification permissions with graceful degradation** because iOS requires explicit permission and Android 13+ requires POST_NOTIFICATIONS permission. Always check and request before attempting to register, and provide fallback UX.

11. **Configure deep linking with `expo-router` file-based routing** because universal links (iOS) and app links (Android) require consistent URL handling, and expo-router maps file paths to routes automatically with type safety.

12. **Store secrets in EAS Secrets, never in `app.config.js` or source control** because build-time secrets (API keys, signing credentials) must not appear in the JavaScript bundle or git history.

13. **Use `expo-image` instead of React Native's `Image` component** because `expo-image` supports modern formats (AVIF, WebP), disk and memory caching, blur hash placeholders, and transitions out of the box.

14. **Write platform-specific tests with Jest and `@testing-library/react-native`** because cross-platform code often has platform-specific branches, and testing both paths prevents regressions that only appear on one platform.

15. **Set up EAS Submit for automated app store delivery** because manual uploads are error-prone and slow. EAS Submit handles signing, metadata, and upload to App Store Connect and Google Play Console.

16. **Monitor OTA update adoption with `expo-updates` runtime API** because you need to know what percentage of users have received an update and whether any update caused a crash spike before rolling forward.

## Output Format

```
## Project Architecture
[Project structure, navigation, and native module decisions]

## Build Configuration
[eas.json profiles, signing, environment variables]

## Implementation
[Feature code with platform-specific handling and type safety]

## Update Strategy
[OTA channels, runtime versioning, rollback plan]

## Testing Plan
[Unit tests, E2E tests, platform-specific scenarios]
```

## References

| File                               | Load when                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `references/eas-build-config.md`   | Configuring EAS Build profiles, signing credentials, or environment variables.             |
| `references/over-the-air-updates.md` | Setting up expo-updates channels, runtime versioning, or monitoring update adoption.     |
| `references/native-modules.md`     | Adding config plugins, using Expo Modules API, or integrating third-party native code.     |

## Examples

- "Set up an Expo SDK 52 project with EAS Build profiles and OTA update channels."
- "Add push notifications with token registration and background notification handling."
- "Create a config plugin for a custom native module with TypeScript bindings."

## Antigravity Platform Notes

- Skills are stored under `.agents/skills/<skill-id>/SKILL.md` (shared Agent Skills standard path).
- TOML command files in `.gemini/commands/` provide slash-command entry points for workflows and agent routes.
- Rules file relative to the mirrored skill directory: `../../rules/GEMINI.md`.
- Use Agent Manager for parallel agent coordination and multi-specialist delegation (equivalent to `@orchestrator`).
- Specialist routes are compiled into `.gemini/commands/agent-*.toml` command files — not project-local agent markdown.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when Cubis Foundry MCP is configured.
- User arguments are passed as natural language via `{{args}}` in TOML command prompts.
