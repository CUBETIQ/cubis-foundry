---
name: android-emulator-testing
description: Canonical CLI-first skill for Android emulator testing, adb control,
  UI-tree verification, and evidence capture.
triggers:
  - android testing
  - android emulator
  - adb
  - ui tree
  - logcat
  - emulator qa
domains:
  - quality
  - testing
  - mobile
whenToUse: When validating Android flows in an emulator and the result should be
  a deterministic repro, evidence bundle, or release-readiness verdict.
priority: primary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# Android Emulator Testing

Use this skill for Android emulator work that should stay close to the command line: `adb`, `uiautomator`, screenshots, logcat, and the bundled Python helpers.

Resolve `<module-root>` to the installed `android-emulator-testing` skill
directory before using sidecars. Module-local helpers below are referenced as
`<module-root>/scripts/...`.

## When to use
- Validate an Android feature flow in an emulator.
- Reproduce a bug by driving the UI with adb input events.
- Capture UI trees, screenshots, and logs for deterministic evidence.
- Inspect app state without relying on pixel-picking or visual guesswork.

## Default workflow
1. Select or boot an emulator:
   - `emulator -list-avds`
   - `emulator -avd <name> >/tmp/android-emulator.log 2>&1 &`
   - `adb wait-for-device`
2. Check the device list:
   - `adb devices`
3. Build and install the target variant:
   - `./gradlew :<module>:install<BuildVariant> --console=plain --quiet`
   - If unsure about task names: `./gradlew tasks --all | rg install`
4. Launch the app:
   - Resolve the activity: `adb -s <serial> shell cmd package resolve-activity --brief <package>`
   - Start it: `adb -s <serial> shell am start -n <package>/<activity>`
5. Inspect the current screen:
   - `adb -s <serial> exec-out uiautomator dump /dev/tty > /tmp/ui.xml`
   - `python3 <module-root>/scripts/ui_tree_summarize.py /tmp/ui.xml /tmp/ui.txt`
6. Tap using UI-tree-derived coordinates:
   - `python3 <module-root>/scripts/ui_pick.py /tmp/ui.xml "Settings"`
   - `adb -s <serial> shell input tap <x> <y>`
7. Capture evidence:
   - `adb -s <serial> exec-out screencap -p > /tmp/step.png`
   - `adb -s <serial> logcat -d > /tmp/logcat.txt`

## CLI-first rules
- This skill is CLI-first, not Android-MCP-first.
- Prefer adb and emulator CLI workflows over any higher-level automation.
- Use screenshots to confirm state, not to decide tap coordinates.
- Never pixel-pick from screenshots. Derive coordinates from the UI tree bounds.
- If a node is missing, scroll, re-dump the tree, and search again before concluding it is absent.
- Capture the serial, package, activity, screenshot, UI tree, and logcat when reporting results.
- Keep one emulator session stable whenever possible.

## Helper set
### Device control
- `adb devices`
- `adb -s <serial> shell am start ...`
- `adb -s <serial> shell input tap ...`
- `adb -s <serial> shell input swipe ...`
- `adb -s <serial> shell input keyevent 4`

### UI inspection
- `scripts/ui_tree_summarize.py`
- `scripts/ui_pick.py`
- `adb -s <serial> exec-out uiautomator dump /dev/tty`

### Evidence and logs
- `adb -s <serial> exec-out screencap -p > /tmp/step.png`
- `adb -s <serial> logcat -c`
- `adb -s <serial> logcat -d > /tmp/logcat.txt`
- `adb -s <serial> logcat --pid <pid>`

## Guardrails
- Do not guess coordinates from screenshots when the UI tree is available.
- Avoid edge swipes unless you intentionally want system navigation gestures.
- Resolve the activity before launch when you need a deterministic start state.
- Save intermediate XML and log files with step-specific names so evidence is replayable.

## References

| File | Load when |
| --- | --- |
| `<module-root>/scripts/ui_tree_summarize.py` | You need a compact overview of the dumped UI tree before choosing a target. |
| `<module-root>/scripts/ui_pick.py` | You need to derive tap coordinates from a node's bounds instead of guessing from screenshots. |
