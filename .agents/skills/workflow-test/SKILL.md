---
name: workflow-test
description: 'Callable Codex wrapper for /test: Design and execute verification strategy aligned to risk and acceptance criteria.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'test'
  workflow-command: '/test'
---

# Workflow Wrapper: /test

Use this skill as a callable replacement for `/test` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Test Workflow

## When to use
Use this to drive confidence before merge or release.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `test-master`, `playwright-expert`
- Supporting skills (optional): `webapp-testing`, `flutter-test-master`

## Workflow steps
1. Map change surface to risk areas.
2. Choose unit/integration/e2e depth per risk.
3. Run fast checks first, then broad suite.
4. Report failures with root-cause direction.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Coverage map (what was tested)
- Test results summary
- Remaining risk and gaps
- Merge/release recommendation
