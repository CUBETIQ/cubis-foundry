# Workflow Prompt: /mobile-qa

Run charter-driven mobile QA through Android MCP first, capture deterministic evidence, and use ADB only as explicit fallback.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `flutter-mobile-qa`, `integration-testing`, `code-review`.
- Local skill file hints if installed: `.github/skills/flutter-mobile-qa/SKILL.md`, `.github/skills/integration-testing/SKILL.md`, `.github/skills/code-review/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
