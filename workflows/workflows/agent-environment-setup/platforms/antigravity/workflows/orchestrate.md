---
command: "/orchestrate"
description: "Coordinate multiple specialists to solve cross-cutting tasks with explicit ownership and handoff."
triggers: ["orchestrate", "coordinate", "multi-area", "cross-team", "handoff"]
---
# Orchestrate Workflow

## When to use
Use this when a task spans backend, frontend, data, testing, and release concerns.

## Routing
- Primary coordinator: `@orchestrator`
- Architecture decisions: `@backend-specialist`
- Data model/query risk: `@database-architect`
- UX/client behavior: `@frontend-specialist`
- Security review: `@security-auditor`
- Verification strategy: `@test-engineer`
- Rollout plan: `@devops-engineer`

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
