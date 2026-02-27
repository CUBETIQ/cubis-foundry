---
command: "/devops"
description: "Plan and execute deployment, CI/CD, and operational safety changes with rollback controls."
triggers: ["devops", "deploy", "ci", "cd", "rollback", "infra"]
---
# DevOps Workflow

Use this when deployment pipeline, infrastructure, or release execution is the main scope.

## Routing
- Primary specialist: `@devops-engineer`
- Security checks: `@security-auditor`
- Verification support: `@test-engineer`

## Steps
1. Confirm target environment and risk level.
2. Define rollout and rollback strategy.
3. Apply CI/CD or infra changes.
4. Validate monitors/alerts and recovery path.

## Output Contract
- Deployment plan
- Rollback conditions
- Validation and observability checks
- Outstanding operational risks
