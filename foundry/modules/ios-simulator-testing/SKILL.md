---
name: ios-simulator-testing
description: Canonical dual-path skill for iOS simulator testing, mobile-mcp
  guidance, build automation, and accessibility-driven UI verification.
triggers:
  - ios testing
  - simulator testing
  - simctl
  - xcodebuild
  - ios simulator
  - accessibility tree
domains:
  - quality
  - testing
  - mobile
whenToUse: When validating iOS flows in Simulator and the result should be a
  deterministic repro, evidence bundle, or release-readiness verdict.
priority: primary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# iOS Simulator Testing

Use this skill for iOS Simulator testing. The preferred path is `mobile-mcp`
for semantic interaction. The fallback path is `simctl`, `xcodebuild`, and the
bundled Python helpers.

Resolve `<module-root>` to the installed `ios-simulator-testing` skill
directory before using sidecars. Set `PYTHON_BIN` to a Python 3.10+ interpreter
before using the richer helper scripts. If a newer interpreter is unavailable,
fall back to raw `simctl` and `xcodebuild` commands until one is installed.

## When to use
- Validate an iOS feature flow in Simulator.
- Reproduce a simulator-only bug.
- Build, install, launch, and inspect an app with CLI tools.
- Capture logs, screenshots, accessibility trees, and test evidence.
- Keep native simulator work in scope. Do not route web flows here.

## Path selection
- Preferred path: `mobile-mcp`.
- Fallback path: `simctl` + `xcodebuild` + Python helpers.
- Choose semantic MCP interaction when the simulator is ready and you want fast
  intent-level exploration across screens and controls.
- Choose the fallback when you need deterministic build/install control,
  structured local evidence, or the semantic stack is not healthy.
- iOS setup is heavier than Android. Expect WebDriverAgent-class assumptions,
  simulator readiness checks, and more environment drift.

## Preferred path
1. Verify the simulator is booted and responsive.
2. Start or attach the semantic runtime:
   - `npx @mobilenext/mobile-mcp@latest`
3. Confirm the required iOS bridge is healthy before trusting semantic actions.
4. Use semantic MCP interaction for screen understanding and intent-driven
   actions.
5. If the environment is unstable, drop to the fallback path and collect local
   evidence there.

Load `<module-root>/references/mobile-mcp.md` for the short iOS semantic flow.
Load `<module-root>/references/mobile-mcp-setup.md` when `mobile-mcp` or the
iOS bridge is not ready.

## Fallback workflow
1. Check the environment first:
   - `bash <module-root>/scripts/sim_health_check.sh`
2. List and pick or boot a simulator:
   - `$PYTHON_BIN <module-root>/scripts/sim_list.py`
   - `$PYTHON_BIN <module-root>/scripts/simctl_boot.py --name "iPhone 16 Pro" --wait-ready`
3. Build or test:
   - `$PYTHON_BIN <module-root>/scripts/build_and_test.py --project <path>`
   - or use `xcodebuild` directly when that is clearer
4. Install and launch:
   - `xcrun simctl install booted <path-to-app>`
   - `xcrun simctl launch booted <bundle-id>`
5. Capture the baseline state:
   - `xcrun simctl io booted screenshot /tmp/ios.png`
   - `xcrun simctl spawn booted log stream --level debug`
6. Only if `idb` is already installed and you need semantic UI interaction:
   - `$PYTHON_BIN <module-root>/scripts/screen_mapper.py`
   - `$PYTHON_BIN <module-root>/scripts/navigator.py --find-text "Login" --tap`
7. Bundle evidence for a defect report when needed:
   - `$PYTHON_BIN <module-root>/scripts/app_state_capture.py --app-bundle-id <bundle-id>`

## Operating rules
- `mobile-mcp` is the preferred semantic mobile runtime.
- CLI remains the deterministic fallback.
- Prefer `simctl` and `xcodebuild` for deterministic build and device control.
- Use the Python helpers when they give structured output, semantic UI lookup, or progressive disclosure.
- Use screenshots for verification, not as the primary navigation source.
- Prefer accessibility labels, element types, and IDs over coordinates.
- Reuse one booted simulator when possible.
- Keep semantic findings and fallback evidence separate in the report.

## References

| File | Load when |
| --- | --- |
| `<module-root>/references/mobile-mcp.md` | Running the preferred semantic iOS flow through `mobile-mcp`. |
| `<module-root>/references/mobile-mcp-setup.md` | Diagnosing WebDriverAgent, simulator readiness, or environment issues before using `mobile-mcp`. |
| `<module-root>/scripts/sim_health_check.sh` | Verifying Xcode, CoreSimulator, and the local simulator environment before a test run. |
| `<module-root>/scripts/build_and_test.py` | Building or testing from the CLI with structured output instead of raw `xcodebuild` logs. |
| `<module-root>/scripts/app_launcher.py` | Installing, launching, terminating, or deep-linking the app under test. |
| `<module-root>/scripts/app_state_capture.py` | Producing a compact bug bundle with screenshot, hierarchy, and logs. |
| `<module-root>/references/simctl_quick.md` | Reaching for raw `simctl` lifecycle commands or device-management shortcuts. |
| `<module-root>/references/test_patterns.md` | Planning repeatable simulator QA runs and evidence collection patterns. |
| `<module-root>/references/accessibility_checklist.md` | Auditing accessibility issues on the current screen. |
| `<module-root>/references/troubleshooting.md` | Fixing CoreSimulator, runtime, or device-state failures before continuing. |
| `<module-root>/references/idb_quick.md` | Optional only when `idb` is already installed and you need semantic interaction through `screen_mapper.py` or `navigator.py`. |

## Guardrails
- If `simctl` reports CoreSimulator failures, fix the simulator service before continuing.
- Record the simulator name, UDID, runtime, scheme, and bundle ID when you report results.
- Treat `idb` as an optional helper, not the default path.
- Treat WebDriverAgent or equivalent iOS automation bridges as environment
  prerequisites for semantic automation, not guaranteed defaults.
- Keep outputs concise unless you explicitly need verbose or JSON mode.
