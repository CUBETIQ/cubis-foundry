---
name: workflow-create
description: 'Callable Codex wrapper for /create: Implement feature work with minimal blast radius and clear verification checkpoints.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'create'
  workflow-command: '/create'
---

# Workflow Wrapper: /create

Use this skill as a callable replacement for `/create` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Create Workflow

## When to use
Use this for net-new implementation after design is stable.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `feature-forge`, `architecture-designer`
- Supporting skills (optional): `lint-and-validate`, `test-master`

## Workflow steps
1. Confirm target files and contracts.
2. Implement smallest coherent increment.
3. Validate behavior with focused tests.
4. Capture remaining gaps and follow-ups.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Changed components/files
- Behavioral impact
- Test evidence
- Follow-up items
