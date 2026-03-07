---
command: "/incident"
description: "Handle production incidents with triage, mitigation, root cause, and post-incident actions."
triggers: ["incident", "outage", "sev", "degraded", "hotfix"]
---
# Incident Workflow

# CHANGED: output contract — converted free-form bullets into structured YAML — keeps incident mitigation and follow-up data structured for resumability.

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
```yaml
INCIDENT_WORKFLOW_RESULT:
  primary_agent_id: "backend-specialist"
  escalation_agent_ids: ["debugger", "database-architect", "security-auditor", "test-engineer", "devops-engineer"]
  primary_skill_ids: ["systematic-debugging", "sre-engineer"]
  supporting_skill_ids: ["monitoring-expert", "security-reviewer"]
  incident_timeline: ["Summarize sequence of impact, detection, mitigation, and recovery"]
  mitigation_actions: ["Describe mitigation steps taken"]
  root_cause: "Describe confirmed or best-supported root cause"
  durable_fix: null
  follow_up_prevention_tasks: ["Describe prevention and hardening actions"]
```
