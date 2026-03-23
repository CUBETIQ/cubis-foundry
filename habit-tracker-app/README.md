# Habit Tracker App

Reference Flutter validation app for the Foundry design engine.

## Scope

- Four core surfaces: onboarding, dashboard, progress, profile
- Canonical design state in `docs/foundation/DESIGN.md`
- Scoped overlays in `docs/foundation/design/*`
- Stitch compatibility mirror in `.stitch/DESIGN.md`

## Validation commands

```bash
flutter test
flutter analyze
flutter build apk --debug
```

## Android MCP QA target

- Package: `com.example.habit_tracker_app`
- Entry activity: default Flutter launcher activity
- Recommended smoke flow:
  1. Launch app
  2. Complete onboarding
  3. Toggle one habit on the dashboard
  4. Open Progress
  5. Open Profile and toggle Quiet hours
