---
name: android-emulator-testing
description: Canonical dual-path skill for Android emulator testing, mobile-mcp
  guidance, adb control, UI-tree verification, and evidence capture.
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
---

# Android Emulator Testing

Use this skill for Android emulator testing. The preferred path is `mobile-mcp`
for semantic interaction. The fallback path is raw CLI control with `adb`,
`emulator`, `uiautomator`, screenshots, and `logcat`.

Resolve `<module-root>` to the installed `android-emulator-testing` skill
directory before using sidecars. Module-local helpers below are referenced as
`<module-root>/scripts/...`.

## When to use
- Validate an Android feature flow in an emulator.
- Reproduce a bug with deterministic device control and replayable evidence.
- Capture UI trees, screenshots, and logs for defect reports.
- Inspect app state without pixel-picking or visual guesswork.
- Keep native Android testing in scope. Do not route web flows here.

## Path selection
- Preferred path: `mobile-mcp`.
- Fallback path: `adb` + `emulator` + `uiautomator` + screenshots + `logcat`.
- Choose semantic MCP interaction when you need fast screen understanding,
  element-level intent, or natural-language navigation on a healthy emulator.
- Choose deterministic CLI evidence when you need exact reproduction steps,
  raw device state, low-level launch/control, or `mobile-mcp` is unavailable.
- If semantic and deterministic evidence disagree, trust the CLI artifacts.

## Preferred path
1. Start or attach the semantic runtime:
   - `npx @mobilenext/mobile-mcp@latest`
2. Connect it to the target emulator session.
3. Use semantic MCP interaction to inspect the current screen and drive the
   next action.
4. When the flow matters, save the corresponding screenshot and logs so the
   result is still reviewable outside MCP.
5. If setup, routing, or semantic targeting becomes unreliable, drop to the
   fallback path without re-scoping the test.

Load `<module-root>/references/mobile-mcp.md` when you need the concise Android
semantic flow.

## Fallback workflow
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

## Operating rules
- `mobile-mcp` is the preferred semantic mobile runtime.
- CLI remains the deterministic fallback.
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
- Keep semantic exploration and deterministic evidence separate in the report:
  say which path produced each finding.

## References

| File | Load when |
| --- | --- |
| `<module-root>/references/mobile-mcp.md` | Running the preferred semantic Android flow through `mobile-mcp` before dropping to CLI fallback. |
| `<module-root>/scripts/ui_tree_summarize.py` | You need a compact overview of the dumped UI tree before choosing a target. |
| `<module-root>/scripts/ui_pick.py` | You need to derive tap coordinates from a node's bounds instead of guessing from screenshots. |
