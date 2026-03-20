# CI Emulator Setup

## Goal

Run reproducible Android-emulator QA flows in CI with pinned tooling and workspace-local artifacts.

## Baseline GitHub Actions shape

```yaml
name: mobile-qa

on:
  workflow_dispatch:
  pull_request:

jobs:
  android-emulator:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: "stable"

      - run: flutter pub get
      - run: flutter build apk --debug

      - uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          arch: x86_64
          profile: pixel_7
          script: |
            npm exec --yes android-mcp-server@1.3.0 >/tmp/android-mcp.log 2>&1 &
            adb wait-for-device
            adb install build/app/outputs/flutter-apk/app-debug.apk
```

## CI rules

- Pin the MCP package version.
- Keep screenshots and logs under `artifacts/mobile-qa/`.
- Use debug or profile APKs that preserve meaningful logs and testability.
- Fail fast if the emulator never boots or the APK install fails.

## Suggested artifact paths

- `artifacts/mobile-qa/screenshots/`
- `artifacts/mobile-qa/logs/`
- `artifacts/mobile-qa/report.md`

## When not to automate

- Real third-party login with CAPTCHA or MFA
- Hardware features that are unavailable in the emulator
- Non-deterministic push notification delivery

In those cases, keep the test manual or semi-automated and collect evidence rather than forcing flaky CI.
