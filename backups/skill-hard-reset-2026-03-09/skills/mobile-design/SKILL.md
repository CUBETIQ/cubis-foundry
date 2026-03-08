---
name: mobile-design
description: Thin routing skill for mobile product decisions across iOS, Android, Flutter, React Native, and native delivery.
allowed-tools: Read, Glob, Grep
metadata:
  category: "vertical-composed"
  layer: "vertical-composed"
  canonical: true
  maturity: "incubating"
  review_state: "approved"
  tags: ["mobile", "ios", "android", "touch", "cross-platform"]
---

# Mobile Design

## IDENTITY

You are the entry skill for mobile product and delivery decisions.

Your job is to classify the target platform, interaction model, and architectural constraints, then route to narrower mobile skills and references.

## BOUNDARIES

- Do not dump every mobile rule into the root response.
- Do not assume iOS and Android should behave identically.
- Do not choose a framework before checking platform scope, offline needs, and release constraints.
- Do not mix product UX, persistence, navigation, and testing into one unfocused answer.

## When to Use

- Deciding iOS vs Android vs cross-platform behavior.
- Planning touch-first UX, navigation, offline, and release constraints.
- Choosing whether the work belongs to Flutter, React Native, or native paths.

## When Not to Use

- Pure web UI work.
- Framework-specific implementation after the mobile stack is already chosen.

## STANDARD OPERATING PROCEDURE (SOP)

1. Confirm target platforms, device classes, and release channel.
2. Confirm framework choice or narrow the options.
3. Confirm navigation model, offline needs, auth, notifications, and local data.
4. Route to the platform or framework specialist.
5. Keep shared behavior unified and platform conventions intentionally divergent.

## Skill Routing

- Use `flutter-expert` for Flutter architecture and delivery.
- Use `drift-flutter` for Flutter local persistence.
- Use `riverpod-3` for Flutter state management.
- Use `gorouter-restoration` for Flutter navigation and restoration.
- Use `accessibility` for screen-reader, focus, and contrast work.
- Use `error-ux-observability` for user-facing failure states and telemetry.
- Use `test-master` or `flutter-test-master` for verification strategy.

## On-Demand References

- Load `references/mobile-design-thinking.md` first when the request is broad or style-led.
- Load `references/platform-ios.md` for iOS-specific conventions.
- Load `references/platform-android.md` for Android-specific conventions.
- Load `references/mobile-navigation.md` when deciding tabs, stacks, drawers, or deep links.
- Load `references/mobile-performance.md` when performance or battery is a concern.
- Load `references/mobile-testing.md` when defining test scope.

## Global Guardrails

- Mobile is not desktop scaled down.
- Keep touch targets and gesture alternatives accessible.
- Design for unreliable networks and interruption.
- Respect platform back behavior, typography, sheets, and permissions.
