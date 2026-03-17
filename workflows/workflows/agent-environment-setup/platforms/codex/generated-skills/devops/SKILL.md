---
name: devops
description: "Plan and execute deployment, CI/CD, incident response, and operational safety changes with rollback controls."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "devops"
  platform: "Codex"
  command: "/devops"
compatibility: Codex
---
# devops Workflow
# DevOps Workflow

## When to use

Use this for deployment automation, CI/CD pipeline changes, incident response, or infrastructure operations.

## Routing

- Primary specialist: `@devops-engineer`
- Reliability support: `@sre-engineer`
- Verification support: `@validator`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach deployment targets, pipeline configs, incident details, and infrastructure specs.

## Skill Routing

- Primary skills: `devops-engineer`, `ci-cd-pipelines`, `docker-kubernetes`
- Supporting skills (optional): `sre-engineer`, `observability`, `serverless-patterns`, `git-workflow`, `debugging-strategies`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`
- Start with `devops-engineer` for operational patterns. Add `ci-cd-pipelines` for pipeline work, `docker-kubernetes` for container operations, `sre-engineer` for incident response, `serverless-patterns` for serverless infrastructure.

## Workflow steps

1. Assess current state and change scope.
2. Plan change with rollback strategy.
3. Apply change in staged manner (dev → staging → production).
4. Verify health at each stage before proceeding.
5. Document operational procedures and runbooks.

## Verification

- Change applied successfully with no service degradation.
- Rollback procedure verified or documented.
- Monitoring confirms normal operation after change.
- Runbook updated for new procedures.

## Output Contract

```yaml
DEVOPS_WORKFLOW_RESULT:
  primary_agent: devops-engineer
  supporting_agents: [sre-engineer?, validator?]
  primary_skills: [devops-engineer, ci-cd-pipelines, docker-kubernetes]
  supporting_skills: [sre-engineer?, observability?, serverless-patterns?]
  change:
    description: <string>
    blast_radius: <string>
    rollback_plan: <string>
  execution:
    stages_completed: [<string>]
    health_checks: [<string>]
  operational_docs: [<string>] | []
  follow_up_items: [<string>] | []
```