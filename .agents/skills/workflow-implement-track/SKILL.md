---
name: workflow-implement-track
description: 'Callable Codex wrapper for /implement-track: Execute large work in milestones with explicit quality gates and status updates.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'implement-track'
  workflow-command: '/implement-track'
---

# Workflow Wrapper: /implement-track

Use this skill as a callable replacement for `/implement-track` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Implement Track Workflow

## When to use
Use this for medium/large efforts where progress visibility is required.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `plan-writing`, `feature-forge`
- Supporting skills (optional): `lint-and-validate`, `test-master`

## Workflow steps
1. Split into milestone-sized deliverables.
2. Define done criteria per milestone.
3. Execute one milestone at a time.
4. Validate before moving forward.
5. Publish progress and remaining risks.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Milestone board (done/in-progress/next)
- Gate status
- Blockers and dependencies
- ETA confidence
