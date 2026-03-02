---
name: workflow-plan
description: 'Callable Codex wrapper for /plan: Build a decision-complete implementation plan with interfaces, failure modes, and acceptance criteria.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'plan'
  workflow-command: '/plan'
---

# Workflow Wrapper: /plan

Use this skill as a callable replacement for `/plan` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Plan Workflow

## When to use
Use this when execution needs a stable specification.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `plan-writing`, `architecture-designer`
- Supporting skills (optional): `feature-forge`, `api-designer`

## Workflow steps
1. Lock scope and non-goals.
2. Define architecture, boundaries, and data flow.
3. Specify interfaces and validation rules.
4. Document failure modes and mitigations.
5. Define tests and release acceptance criteria.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Implementation phases
- API/data/interface details
- Edge cases and risk matrix
- Verification and rollout checklist
