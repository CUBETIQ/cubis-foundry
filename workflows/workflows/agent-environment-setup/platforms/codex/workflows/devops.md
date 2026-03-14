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

## When to use

Use this for deployment automation, CI/CD pipeline changes, incident response, or infrastructure operations.

## Routing

- Primary specialist: `the ci-cd-pipeline posture`
- Reliability support: `the observability posture`
- Verification support: `the validator posture`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach deployment targets, pipeline configs, incident details, and infrastructure specs.

## Skill Routing

- Primary skills: `ci-cd-pipeline`, `ci-cd-pipeline`, `kubernetes-deploy`
- Supporting skills (optional): `observability`, `observability`, `ci-cd-pipeline`, `git-workflow`, `systematic-debugging`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`
- Start with `ci-cd-pipeline` for operational patterns. Add `ci-cd-pipeline` for pipeline work, `kubernetes-deploy` for container operations, `observability` for incident response, `ci-cd-pipeline` for serverless infrastructure.

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
  primary_agent: ci-cd-pipeline
  supporting_agents: [observability?, validator?]
  primary_skills: [ci-cd-pipeline, ci-cd-pipeline, kubernetes-deploy]
  supporting_skills: [observability?, observability?, ci-cd-pipeline?]
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

> **Codex note:** This workflow runs inside a network-restricted sandbox. Specialists are reasoning postures defined in AGENTS.md, not spawned processes.
