---
name: flutter-mobile-qa
description: "Use when planning or running Flutter mobile QA with Android MCP as the primary device path, explicit ADB fallback, screenshot/UI-tree evidence, logcat triage, and structured test reporting."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Flutter Mobile QA

## Purpose

Provide a repeatable workflow for AI-driven QA of Flutter applications running on Android emulators or devices. This skill combines structured test planning, Android-MCP-primary device control, deterministic screenshot/UI-tree evidence, logcat triage, and Flutter-specific readiness guidance so the agent behaves like a cautious QA engineer instead of a blind script runner.

## When to Use

- Running smoke, regression, onboarding, checkout, or settings flows on a Flutter app.
- Testing APK installs, emulator boot, login flows, deep links, navigation, or offline recovery.
- Investigating mobile crashes, ANRs, rendering regressions, or widget interaction failures.
- Wiring a workspace to an Android/ADB MCP server such as `android-mcp-server`.
- Preparing CI-friendly emulator test guidance and evidence collection for mobile QA.

## Instructions

1. **Confirm the MCP surface before planning tests** because mobile QA is only reliable when the emulator/device control path is known. Load `references/platform-setup.md` first if the Android MCP server is not already configured.

2. **Prefer a Flutter-aware server when available, but support generic Android MCP as the baseline** because Flutter semantics and route inspection are richer than raw UIAutomator output. If only generic Android MCP is present, lean on semantics labels, content descriptions, visible text, and stable widget keys exposed through accessibility.

3. **Start every session with device readiness checks** because stale emulators and wrong APK builds waste time. Typical order: list devices or AVDs, boot the emulator if needed, install or verify the APK, launch the package, then capture a baseline screenshot and UI tree.

4. **Write a test charter before acting** because mobile tests sprawl easily. State the flow under test, success criteria, known dependencies, credential needs, and what evidence counts as pass or fail.

5. **Use the Observe -> Decide -> Act -> Assert loop for every meaningful step** because the UI can drift after each interaction. Prefer `screenshot`, `get_ui_tree`, and log inspection over assumptions. Load `references/android-mcp-tools.md` for the tool decision table.

6. **Prefer high-signal interaction tools over low-level coordinates** because mobile layouts shift across devices and text scales. Use element-targeting helpers such as `tap_element`, `tap_and_wait`, `wait_for_element`, and `type_text` before falling back to raw coordinate taps.

7. **Treat `adb_shell` as restricted** because it enables arbitrary device shell execution. Do not use it unless the user explicitly approves a device-level action that cannot be expressed with safer tools, and record the exact command in the final report.

8. **Keep evidence local and deterministic** because mobile bugs are hard to reproduce. Save screenshots, logs, UI trees, and reports under `artifacts/mobile-qa/` or another workspace-local test artifact directory. Do not write evidence into random local paths.

9. **Clear logs before reproducing suspected crashes** because mobile logcat is noisy. When triaging a failure, clear logs, reproduce once, then collect filtered logs immediately so the report reflects only the failing attempt.

10. **Expect Flutter instrumentation gaps and call them out explicitly** because many test failures are product readiness issues, not agent mistakes. Load `references/flutter-readiness.md` when widgets cannot be reliably targeted or when route assertions are ambiguous.

11. **Use one controlled retry for flaky interactions, not open-ended loops** because emulator timing issues are real but repeated blind retries hide bugs. Prefer Android MCP for the retry, and only drop to ADB when the operator explicitly allows fallback. A safe retry is: relaunch app or return to the last stable screen, recapture screenshot/UI tree, try once more, then stop and report evidence.

12. **Handle credentials as session inputs, never repo state** because test credentials are sensitive and environment-specific. Ask for them when needed, prefer non-production accounts, and never commit them into app fixtures, prompts, or project config.

13. **Tie the final verdict to observable evidence** because “it seemed to work” is not a test result. Every pass/fail claim should cite a screenshot state, UI tree fact, log line, or explicit route/assertion outcome.

14. **Use CI only for reproducible emulator flows** because unstable devices produce false failures. Load `references/ci-emulator.md` when the user wants automation in GitHub Actions or another CI runner.

15. **Anchor visual QA to the design engine when present** because a pass/fail verdict for mobile UI should reflect the intended design system, not just whether taps work. When `docs/foundation/DESIGN.md` or the mobile overlays directory under `docs/foundation/design/mobile/` exists, read the relevant design state first and mention any clear drift between the intended design language and the rendered app.

## Output Format

```markdown
## Mobile QA Charter
- Flow:
- Target package:
- Environment:
- Credentials needed:

## Execution Log
1. [action] -> [observation]
2. [action] -> [observation]

## Assertions
- Passed:
- Failed:
- Blocked:

## Evidence
- Screenshots:
- UI-tree snapshots:
- Log captures:

## Risks And Follow-ups
- Risk:
- Recommended fix:
```

## References

| File | Load when |
| --- | --- |
| `references/platform-setup.md` | Configuring Android MCP across Claude, Codex, Copilot, Gemini, or Antigravity. |
| `references/android-mcp-tools.md` | Choosing safe Android MCP tools and understanding restricted operations. |
| `references/flutter-readiness.md` | Verifying semantics labels, widget keys, routes, and app instrumentation for reliable QA. |
| `references/ci-emulator.md` | Preparing pinned emulator + MCP setup for CI or shared QA runners. |
| `agents/test-planner.md` | Breaking a mobile flow into stable checkpoints and assertions. |
| `agents/device-operator.md` | Translating the plan into safe MCP tool calls on the emulator or device. |
| `agents/evidence-reporter.md` | Turning screenshots, UI trees, and logs into a concise failure or pass report. |

## Examples

- "Boot the Android emulator, install the debug APK, run the login flow, and tell me where it fails with screenshots and logs."
- "Verify the Flutter settings screen still works offline and report any crash or stuck-loading states."

