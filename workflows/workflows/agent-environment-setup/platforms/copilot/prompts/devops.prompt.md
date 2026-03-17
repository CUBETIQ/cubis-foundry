# Workflow Prompt: /devops

Plan and execute deployment, CI/CD, incident response, and operational safety changes with rollback controls.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `ci-cd-pipeline`, `kubernetes-deploy`, `observability`, `git-workflow`, `systematic-debugging`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`.
- Local skill file hints if installed: `.github/skills/ci-cd-pipeline/SKILL.md`, `.github/skills/kubernetes-deploy/SKILL.md`, `.github/skills/observability/SKILL.md`, `.github/skills/git-workflow/SKILL.md`, `.github/skills/systematic-debugging/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/python-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
