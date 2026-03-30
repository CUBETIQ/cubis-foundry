# Workflow Prompt: /deploy

Plan and implement delivery pipeline or runtime deployment changes with verification and rollback awareness.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `ci-cd-pipeline`, `kubernetes-deploy`, `observability`.
- Local skill file hints if installed: `.github/skills/ci-cd-pipeline/SKILL.md`, `.github/skills/kubernetes-deploy/SKILL.md`, `.github/skills/observability/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Deploy Workflow

## What this workflow does

Plans deployment-affecting changes, implements them carefully, and keeps verification and rollback paths explicit.

## When to use

Use this for CI/CD, environment, or release automation changes rather than application-only feature work.

## Agent chain

`planner -> implementer`

## Step details

1. Inspect the current pipeline or deployment surface.
2. Plan the required change, including rollback and observability checks.
3. Implement the update and run the highest-signal verification available.

## Skill routing

- `ci-cd-pipeline` for general delivery automation
- `kubernetes-deploy` when cluster resources are involved
- `observability` when rollout safety depends on telemetry

## Context notes

Provide the target environment, current deployment path, and any release or compliance constraints.

## Verification

The workflow is complete only when deployment impact, rollback posture, and validation steps are explicit.

## Output contract

```yaml
DEPLOY_WORKFLOW_RESULT:
  deployment_change: <summary>
  verification:
    - <check>
  rollback_plan: <summary>
  remaining_risks:
    - <risk>
```

## Follow-up items

Typical next step: `/review` or release execution outside the repo
