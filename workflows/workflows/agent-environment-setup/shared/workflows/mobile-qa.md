---
command: "/mobile-qa"
description: "Run charter-driven mobile QA on the CLI-first Android emulator or iOS simulator path, with Android MCP available only as an optional integration."
triggers: ["mobile qa", "android qa", "flutter qa", "emulator qa", "adb qa", "ios qa", "simulator qa"]
---

# Mobile QA Workflow

## When to use

Use when validating a real mobile flow on Android or iOS and the main outcome is execution evidence, not test-suite authoring.

## Agent Chain

`explorer` -> `tester` -> `reviewer`

## Routing

1. **Explore**: `@explorer` confirms the app target, charter inputs, simulator or emulator prerequisites, and whether Android MCP has been explicitly requested.
2. **Test**: `@tester` runs the mobile QA charter, captures screenshots/UI trees/logs, and stays on the CLI-first device path unless Android MCP has been explicitly enabled.
3. **Review**: `@reviewer` checks whether the evidence actually proves pass, fail, or blocked status.

## Skill Routing

- Primary skills: `android-emulator-testing`, `ios-simulator-testing`
- Supporting skills (optional): `code-review`

## Context notes

- Provide the charter path, package or APK target, and the intended device path.
- This route is for live QA execution and evidence capture, not generalized suite authoring.
## Runtime contract

- Prefer the CLI-first Android emulator or iOS simulator path.
- Treat Android MCP as optional and opt-in only.
- Save artifacts under `artifacts/mobile-qa/`.
- Stop after one controlled retry and report evidence.

## Workflow steps

1. Confirm the charter, package target, device path, and environment readiness.
2. Start on the CLI-first Android emulator or iOS simulator path and capture baseline evidence.
3. Execute each charter step and persist screenshots, UI trees, and logs.
4. Use Android MCP only when the operator explicitly enabled it for Android work.
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
  provider_used: <adb|android-mcp|simctl>
  artifacts: [<path>]
  blocked_reasons: [<string>] | []
  follow_up_items: [<string>] | []
```
