---
name: deploy
command: "/deploy"
description: Plan and implement delivery pipeline or runtime deployment changes with verification and rollback awareness.
triggers:
  - deploy
  - ci
  - cd
  - release
agentChain:
  - planner
  - implementer
primarySkills:
  - ci-cd-pipeline
supportingSkills:
  - kubernetes-deploy
  - observability
whenToUse: "When the task changes build, release, environment promotion, or deployment automation."
priority: high
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

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
