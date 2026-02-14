---
command: "/release"
description: "Prepare and execute release with rollout guardrails, verification, and rollback plan."
triggers: ["release", "deploy", "rollout", "ship", "go-live"]
---
# Release Workflow

Use this before deployment to production-like environments.

## Routing
- Release orchestration: `@devops-engineer`
- Risk checks: `@security-auditor` + `@test-engineer`
- Scope/fallback alignment: `@product-owner`

## Steps
1. Confirm release scope and dependencies.
2. Validate test evidence and readiness gates.
3. Define rollout strategy and rollback triggers.
4. Execute release and monitor signals.
5. Publish release summary and next actions.

## Output Contract
- Release checklist status
- Rollout strategy
- Rollback conditions
- Post-release monitoring plan
