---
command: "/devops"
description: "Plan and execute deployment, CI/CD, and operational safety changes with rollback controls."
triggers: ["devops", "deploy", "ci", "cd", "rollback", "infra"]
---
# DevOps Workflow

# CHANGED: output contract — converted free-form bullets into structured YAML — keeps rollout and rollback planning machine-readable.

## When to use
Use this when deployment pipeline, infrastructure, or release execution is the main scope.

## Routing
- Primary specialist: `@devops-engineer`
- Security checks: `@security-auditor`
- Verification support: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `devops-engineer`, `sre-engineer`
- Supporting skills (optional): `monitoring-expert`, `terraform-engineer`, `wrangler`

## Workflow steps
1. Confirm target environment and risk level.
2. Define rollout and rollback strategy.
3. Apply CI/CD or infra changes.
4. Validate monitors/alerts and recovery path.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
DEVOPS_WORKFLOW_RESULT:
  primary_agent: devops-engineer
  supporting_agents: [security-auditor?, test-engineer?]
  primary_skills: [devops-engineer, sre-engineer]
  supporting_skills: [monitoring-expert?, terraform-engineer?, wrangler?]
  deployment_plan: [<string>]
  rollback_conditions: [<string>]
  validation_checks: [<command or test>]
  observability_checks: [<string>]
  outstanding_operational_risks: [<string>] | []
```
