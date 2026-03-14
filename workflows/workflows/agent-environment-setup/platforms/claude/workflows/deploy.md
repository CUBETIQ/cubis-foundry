---
command: "/deploy"
description: "Execute deployment with pre-flight checks, staged rollout, health verification, and rollback readiness."
triggers: ["deploy", "deployment", "push to prod", "ship it", "go live"]
---

# Deploy Workflow

## Purpose

Execute a deployment from pre-flight validation through staged rollout to post-deployment health confirmation. Unlike `/release` (release preparation and changelog) or `/devops` (infrastructure operations), this workflow focuses on the deployment execution itself with rollback readiness at every stage.

## When to use

Use this when deploying code to an environment (staging, production, or preview). The code should already be tested and reviewed.

## Routing

- Primary coordinator: `@devops-engineer`
- Reliability support: `@sre-engineer`
- Verification: `@test-engineer`, `@validator`
- Incident support: `@debugger`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the deployment target environment, version or commit to deploy, deployment configuration, and any feature flags or traffic-splitting rules.

## Skill Routing

- Primary skills: `ci-cd-pipelines`, `docker-kubernetes`
- Supporting skills (optional): `devops-engineer`, `sre-engineer`, `observability`, `serverless-patterns`, `git-workflow`, `debugging-strategies`
- Start with `ci-cd-pipelines` for pipeline execution and `docker-kubernetes` for container deployments. Add `sre-engineer` for production deployments with SLO monitoring. Add `observability` for health check instrumentation. Add `serverless-patterns` for serverless targets.

## Steps

1. **Pre-flight checks** — Verify CI green, all tests pass, code review approved, no blocking issues, and deployment config valid. `@devops-engineer` owns. Gate: all checks pass before proceeding.
2. **Artifact preparation** — Build deployment artifacts, verify image tags or bundle hashes, and confirm environment variables and secrets are configured. `@devops-engineer` owns.
3. **Staged rollout** — Deploy to the first stage (canary, preview, or staging). Limit blast radius. `@devops-engineer` owns.
4. **Health verification** — Run smoke tests, check error rates, latency, and key business metrics against baseline. `@sre-engineer` and `@test-engineer` own. Gate: health within acceptable thresholds before expanding.
5. **Progressive expansion** — Expand rollout to next stage (wider canary, regional, or full production). Repeat health verification at each stage. `@devops-engineer` owns.
6. **Post-deployment validation** — Run full E2E checks on production. Confirm monitoring dashboards show stable state. `@validator` owns.
7. **Rollback readiness** — Document rollback procedure, confirm rollback artifacts exist, and verify rollback can execute within target RTO. `@sre-engineer` owns.

## Verification

- Pre-flight checks all pass before deployment starts.
- Health metrics within baseline at each rollout stage.
- Rollback procedure documented and tested or confirmed executable.
- Post-deployment E2E checks pass.
- No elevated error rates or latency degradation after full rollout.

## Agents Involved

- @devops-engineer — deployment execution and artifact management
- @sre-engineer — health monitoring, SLO verification, and rollback planning
- @test-engineer — smoke tests and E2E verification
- @validator — post-deployment validation
- @debugger — incident investigation if deployment causes issues

## Output

```yaml
DEPLOY_WORKFLOW_RESULT:
  primary_agent: devops-engineer
  supporting_agents: [sre-engineer, test-engineer?, validator, debugger?]
  primary_skills: [ci-cd-pipelines, docker-kubernetes]
  supporting_skills: [devops-engineer?, sre-engineer?, observability?, serverless-patterns?]
  pre_flight:
    ci_status: pass | fail
    tests_status: pass | fail
    review_status: approved | pending
    config_valid: true | false
  deployment:
    target_environment: <string>
    version: <string>
    strategy: canary | blue-green | rolling | direct
    stages_completed: [<string>]
  health:
    error_rate: <string>
    latency_p99: <string>
    key_metrics: [<metric: value>]
    status: healthy | degraded | unhealthy
  rollback:
    procedure: <string>
    artifacts_available: true | false
    estimated_rto: <string>
  follow_up_items: [<string>] | []
```
