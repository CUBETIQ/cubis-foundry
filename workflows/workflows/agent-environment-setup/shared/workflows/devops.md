---
command: "/devops"
description: "Plan and execute deployment, CI/CD, and operational safety changes with rollback controls."
triggers: ["devops", "deploy", "ci", "cd", "rollback", "infra"]
---
# DevOps Workflow

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
- Deployment plan
- Rollback conditions
- Validation and observability checks
- Outstanding operational risks
