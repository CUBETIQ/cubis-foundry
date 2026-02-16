---
command: "/incident"
description: "Handle production incidents with triage, mitigation, root cause, and post-incident actions."
triggers: ["incident", "outage", "sev", "degraded", "hotfix"]
---
# Incident Workflow

Use this for active or recent production incidents.

## Routing
- Runtime/service issues: `@backend-specialist` + `@debugger`
- Data inconsistencies: `@database-architect`
- Security events: `@security-auditor`
- Recovery validation: `@test-engineer`
- Deployment rollback execution: `@devops-engineer`

## Steps
1. Establish impact, severity, and current status.
2. Mitigate first, then stabilize.
3. Identify probable root cause and confirm.
4. Implement and verify durable fix.
5. Document post-incident follow-up actions.

## Output Contract
- Incident timeline
- Mitigation actions
- Root cause statement
- Follow-up prevention tasks
