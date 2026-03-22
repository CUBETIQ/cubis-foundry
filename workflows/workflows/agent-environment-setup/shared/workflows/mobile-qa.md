---
command: "/mobile-qa"
description: "Run charter-driven mobile QA through Android MCP first, capture deterministic evidence, and use ADB only as explicit fallback."
triggers: ["mobile qa", "android qa", "flutter qa", "emulator qa", "adb qa"]
---

# Mobile QA Workflow

## When to use

Use when validating a real mobile flow on Android and the main outcome is execution evidence, not test-suite authoring.

## Agent Chain

`explorer` -> `tester` -> `reviewer`

## Routing

1. **Explore**: `@explorer` confirms the app target, charter inputs, Android MCP availability, and any APK/device prerequisites.
2. **Test**: `@tester` runs the mobile QA charter, captures screenshots/UI trees/logs, and applies the fallback rule only when needed.
3. **Review**: `@reviewer` checks whether the evidence actually proves pass, fail, or blocked status.

## Skill Routing

- Primary skills: `flutter-mobile-qa`
- Supporting skills (optional): `integration-testing`, `code-review`

## Context notes

- Provide the charter path, package or APK target, and whether ADB fallback is allowed.
- This route is for live QA execution and evidence capture, not generalized suite authoring.
## Runtime contract

- Prefer Android MCP as the primary execution path.
- Allow direct ADB only when the operator explicitly enables fallback.
- Save artifacts under `artifacts/mobile-qa/`.
- Stop after one controlled retry and report evidence.

## Workflow steps

1. Confirm the charter, package target, and environment readiness.
2. Run the Android MCP-driven QA flow and capture baseline evidence.
3. Execute each charter step and persist screenshots, UI trees, and logs.
4. If Android MCP is unavailable and fallback is allowed, run the bounded ADB fallback path.
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
  provider_used: <android-mcp|adb>
  artifacts: [<path>]
  blocked_reasons: [<string>] | []
  follow_up_items: [<string>] | []
```

