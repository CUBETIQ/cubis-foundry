---
name: workflow-release
description: 'Callable Codex wrapper for /release: Prepare and execute release with rollout guardrails, verification, and rollback plan.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'release'
  workflow-command: '/release'
---

# Workflow Wrapper: /release

Use this skill as a callable replacement for `/release` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Release Workflow

## When to use
Use this before deployment to production-like environments.

## Routing
- Release orchestration: `$agent-devops-engineer`
- Risk checks: `$agent-security-auditor` + `$agent-test-engineer`
- Scope/fallback alignment: `$agent-product-owner`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `devops-engineer`, `sre-engineer`
- Supporting skills (optional): `monitoring-expert`, `test-master`

## Workflow steps
1. Confirm release scope and dependencies.
2. Validate test evidence and readiness gates.
3. Define rollout strategy and rollback triggers.
4. Execute release and monitor signals.
5. Publish release summary and next actions.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Release checklist status
- Rollout strategy
- Rollback conditions
- Post-release monitoring plan
