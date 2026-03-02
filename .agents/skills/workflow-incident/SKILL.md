---
name: workflow-incident
description: 'Callable Codex wrapper for /incident: Handle production incidents with triage, mitigation, root cause, and post-incident actions.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'incident'
  workflow-command: '/incident'
---

# Workflow Wrapper: /incident

Use this skill as a callable replacement for `/incident` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Incident Workflow

## When to use
Use this for active or recent production incidents.

## Routing
- Runtime/service issues: `$agent-backend-specialist` + `$agent-debugger`
- Data inconsistencies: `$agent-database-architect`
- Security events: `$agent-security-auditor`
- Recovery validation: `$agent-test-engineer`
- Deployment rollback execution: `$agent-devops-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `systematic-debugging`, `sre-engineer`
- Supporting skills (optional): `monitoring-expert`, `security-reviewer`

## Workflow steps
1. Establish impact, severity, and current status.
2. Mitigate first, then stabilize.
3. Identify probable root cause and confirm.
4. Implement and verify durable fix.
5. Document post-incident follow-up actions.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Incident timeline
- Mitigation actions
- Root cause statement
- Follow-up prevention tasks
