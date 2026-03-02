---
command: "/incident"
description: "Handle production incidents with triage, mitigation, root cause, and post-incident actions."
triggers: ["incident", "outage", "sev", "degraded", "hotfix"]
---
# Incident Workflow

## When to use
Use this for active or recent production incidents.

## Routing
- Runtime/service issues: `@backend-specialist` + `@debugger`
- Data inconsistencies: `@database-architect`
- Security events: `@security-auditor`
- Recovery validation: `@test-engineer`
- Deployment rollback execution: `@devops-engineer`

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
