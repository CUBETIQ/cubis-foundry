---
name: workflow-backend
description: 'Callable Codex wrapper for /backend: Drive backend architecture and implementation via backend specialist with API, data, and reliability focus.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'backend'
  workflow-command: '/backend'
---

# Workflow Wrapper: /backend

Use this skill as a callable replacement for `/backend` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Backend Workflow

## When to use
Use this when backend architecture or service logic is primary.

## Routing
- Primary specialist: `$agent-backend-specialist`
- Add `$agent-database-architect` for schema/query changes.
- Add `$agent-security-auditor` when auth, secrets, or sensitive data are involved.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `nodejs-best-practices`, `api-designer`
- Supporting skills (optional): `api-patterns`, `database-skills`, `secure-code-guardian`

## Workflow steps
1. Ask specialist(s) for design and risk assessment.
2. Validate contracts, data model, and failure handling.
3. Implement backend changes with observability.
4. Always update API docs: OpenAPI spec, Swagger UI route, and Stoplight Elements route/component.
5. Run targeted tests and summarize rollout notes.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- API/contract changes
- OpenAPI spec path
- Swagger UI route
- Stoplight route/component status
- Migration impact
- Reliability/security notes
- Verification evidence
