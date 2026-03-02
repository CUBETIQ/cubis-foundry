---
name: workflow-orchestrate
description: 'Callable Codex wrapper for /orchestrate: Coordinate multiple specialists to solve cross-cutting tasks with explicit ownership and handoff.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'orchestrate'
  workflow-command: '/orchestrate'
---

# Workflow Wrapper: /orchestrate

Use this skill as a callable replacement for `/orchestrate` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Orchestrate Workflow

## When to use
Use this when a task spans backend, frontend, data, testing, and release concerns.

## Routing
- Primary coordinator: `$agent-orchestrator`
- Architecture decisions: `$agent-backend-specialist`
- Data model/query risk: `$agent-database-architect`
- UX/client behavior: `$agent-frontend-specialist`
- Security review: `$agent-security-auditor`
- Verification strategy: `$agent-test-engineer`
- Rollout plan: `$agent-devops-engineer`

## Workflow steps
1. Break the request into workstreams with owners.
2. Request one primary specialist output per workstream.
3. Merge outputs into a single implementation plan.
4. Resolve conflicts before implementation.
5. End with a release-risk summary.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `parallel-agents`, `architecture-designer`
- Supporting skills (optional): `plan-writing`, `feature-forge`

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Scope and assumptions
- Workstreams with owner + deliverable
- Consolidated execution order
- Test and rollout gates
- Open risks and mitigations
