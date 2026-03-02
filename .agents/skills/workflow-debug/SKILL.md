---
name: workflow-debug
description: 'Callable Codex wrapper for /debug: Isolate root cause quickly and apply the smallest safe remediation with verification.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'debug'
  workflow-command: '/debug'
---

# Workflow Wrapper: /debug

Use this skill as a callable replacement for `/debug` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Debug Workflow

## When to use
Use this when behavior is failing or inconsistent.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `systematic-debugging`, `find-bugs`
- Supporting skills (optional): `monitoring-expert`, `error-ux-observability`

## Workflow steps
1. Reproduce issue and collect evidence.
2. Narrow fault domain and identify root cause.
3. Apply focused fix with low regression risk.
4. Verify resolution and monitor for recurrence.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Reproduction notes
- Root cause summary
- Fix summary
- Regression checks performed
