---
command: "/mobile-testing"
description: "Run charter-driven mobile testing on the CLI-first Android emulator or iOS simulator path, with mobile-mcp available as the semantic companion runtime."
triggers: ["mobile testing", "android testing", "flutter testing", "emulator testing", "adb testing", "ios testing", "simulator testing"]
---

# Mobile Testing Workflow

## When to use

Use when validating a real mobile flow on Android or iOS and the main outcome is execution evidence, not test-suite authoring.

## Agent Chain

`explorer` -> `tester` -> `reviewer`

## Routing

1. **Explore**: `@explorer` confirms the app target, charter inputs, simulator or emulator prerequisites, and whether mobile-mcp is available for semantic interaction.
2. **Test**: `@tester` runs the mobile testing charter, captures screenshots/UI trees/logs, and stays on the CLI-first device path while using mobile-mcp only when semantic interaction is needed.
3. **Review**: `@reviewer` checks whether the evidence actually proves pass, fail, or blocked status.

## Skill Routing

- Primary skills: `android-emulator-testing`, `ios-simulator-testing`
- Supporting skills (optional): `code-review`

## Context notes

- Provide the charter path, package or APK target, and the intended device path.
- This route is for live testing execution and evidence capture, not generalized suite authoring.
## Runtime contract

- Prefer the CLI-first Android emulator or iOS simulator path.
- Use mobile-mcp only when semantic interaction adds value beyond the deterministic CLI flow.
- Save artifacts under `artifacts/mobile-testing/`.
- Stop after one controlled retry and report evidence.

## Workflow steps

1. Confirm the charter, package target, device path, and environment readiness.
2. Start on the CLI-first Android emulator or iOS simulator path and capture baseline evidence.
3. Execute each charter step and persist screenshots, UI trees, and logs.
4. Use mobile-mcp only when semantic traversal or richer control inspection is needed.
5. Review the evidence and summarize pass/fail/blocked findings.

## Verification

- The charter ran against the intended package or APK.
- Evidence exists for baseline state and any failure.
- The final report states which provider executed the run.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: tester
  supporting_agents: [explorer, reviewer]
  provider_used: <adb|mobile-mcp|simctl>
  artifacts: [<path>]
  blocked_reasons: [<string>] | []
  follow_up_items: [<string>] | []
```
