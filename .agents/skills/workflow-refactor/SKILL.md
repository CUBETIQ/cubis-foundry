---
name: workflow-refactor
description: 'Callable Codex wrapper for /refactor: Improve maintainability while preserving behavior through incremental safe refactoring.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'refactor'
  workflow-command: '/refactor'
---

# Workflow Wrapper: /refactor

Use this skill as a callable replacement for `/refactor` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Refactor Workflow

## When to use
Use this for design improvement without intentional behavior changes.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `refactor`, `legacy-modernizer`
- Supporting skills (optional): `architecture-designer`, `code-reviewer`

## Workflow steps
1. Define behavior invariants and guardrails.
2. Isolate refactor slices with low coupling.
3. Apply changes incrementally with tests.
4. Confirm behavior parity and performance baseline.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Refactor scope and invariants
- Structural changes
- Behavior parity evidence
- Deferred technical debt items
