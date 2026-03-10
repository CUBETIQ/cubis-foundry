---
command: "/devops"
description: "Plan and execute deployment, CI/CD, incident response, and operational safety changes with rollback controls."
triggers:
  [
    "devops",
    "deploy",
    "ci",
    "cd",
    "rollback",
    "infra",
    "incident",
    "outage",
    "sev",
    "degraded",
    "hotfix",
    "recovery",
  ]
---

# DevOps Workflow

# CHANGED: output contract — converted free-form bullets into structured YAML — keeps rollout and rollback planning machine-readable.

## When to use

Use this when deployment pipeline, infrastructure, release execution, or incident recovery is the main scope.

## Routing

- Primary specialist: `@devops-engineer`
- Runtime triage: `@debugger`
- Service impact analysis: `@backend-specialist`
- Data recovery support: `@database-architect`
- Security checks: `@security-auditor`
- Verification support: `@test-engineer`

## Context notes

- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing

- Primary skills: `javascript-pro`, `typescript-pro`, `python-pro`, `golang-pro`
- Infrastructure skills: `ci-cd-pipelines`, `docker-kubernetes`, `observability`, `git-workflow`
- Supporting skills (optional): `skill-creator`
- Use the language skill that matches deployment scripts, runtime code, or build tooling in the repo. Add `ci-cd-pipelines` for pipeline design, `docker-kubernetes` for container orchestration, `observability` for monitoring and alerting, and `git-workflow` for branching and release strategy.

## Workflow steps

1. Confirm whether this is planned ops work or active incident response.
2. Establish impact, target environment, and rollback or mitigation path.
3. Apply CI/CD, infra, or recovery actions with explicit safety controls.
4. Validate monitors, alerts, and service recovery.

## Verification

- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract

```yaml
DEVOPS_WORKFLOW_RESULT:
  primary_agent: devops-engineer
  supporting_agents: [security-auditor?, test-engineer?]
  primary_skills: [javascript-pro?, typescript-pro?, python-pro?, golang-pro?]
  supporting_skills: [nodejs-best-practices?, debugging-strategies?, webapp-testing?, skill-creator?]
  deployment_plan: [<string>]
  rollback_conditions: [<string>]
  validation_checks: [<command or test>]
  observability_checks: [<string>]
  outstanding_operational_risks: [<string>] | []
```
