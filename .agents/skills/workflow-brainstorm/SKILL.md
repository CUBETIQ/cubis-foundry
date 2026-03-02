---
name: workflow-brainstorm
description: 'Callable Codex wrapper for /brainstorm: Generate concrete solution options and tradeoffs before committing to implementation.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'brainstorm'
  workflow-command: '/brainstorm'
---

# Workflow Wrapper: /brainstorm

Use this skill as a callable replacement for `/brainstorm` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Brainstorm Workflow

## When to use
Use this when requirements are still fluid and architecture choices are open.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `brainstorming`, `feature-forge`
- Supporting skills (optional): `plan-writing`

## Workflow steps
1. Restate problem, constraints, and success metrics.
2. Produce 2-4 options with architecture shape.
3. Compare complexity, risk, and implementation speed.
4. Recommend one option and justify rejection of others.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Option table (pros/cons)
- Recommended option
- Known unknowns
- First implementation milestone
