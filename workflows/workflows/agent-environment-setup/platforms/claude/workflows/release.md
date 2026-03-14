---
command: "/release"
description: "Prepare and execute release with rollout guardrails, verification, and rollback plan."
triggers: ["release", "deploy", "rollout", "ship", "go-live"]
---

# Release Workflow

## When to use

Use this when preparing a release, deploying to production, or managing a rollout.

## Routing

- Primary coordinator: `@ci-cd-pipeline`
- Release verification: `@test-engineer`, `@validator`
- Documentation: `@documentation-writer`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the release scope, version number, changelog draft, and deployment target.

## Skill Routing

- Primary skills: `ci-cd-pipeline`, `git-workflow`
- Supporting skills (optional): `tech-doc`, `ci-cd-pipeline`, `observability`, `kubernetes-deploy`, `observability`, `ci-cd-pipeline`, `typescript-best-practices`, `javascript-best-practices`
- Start with `ci-cd-pipeline` for deployment automation and `git-workflow` for release branching. Add `tech-doc` for release notes.

## Workflow steps

1. Finalize scope — confirm all changes are merged and tested.
2. Generate changelog and release notes.
3. Prepare deployment artifacts and configuration.
4. Execute staged rollout with health checks at each stage.
5. Verify production health post-deployment.
6. Document rollback procedure and post-release status.

## Verification

- All tests pass on release branch/tag.
- Changelog accurately reflects changes.
- Deployment artifacts built and verified.
- Production health confirmed after rollout.
- Rollback procedure tested or documented.

## Output Contract

```yaml
RELEASE_WORKFLOW_RESULT:
  primary_agent: ci-cd-pipeline
  supporting_agents: [test-engineer?, validator?, documentation-writer?]
  primary_skills: [ci-cd-pipeline, git-workflow]
  supporting_skills: [tech-doc?, ci-cd-pipeline?, observability?]
  release:
    version: <string>
    changelog: <string>
    artifacts: [<string>]
  deployment:
    strategy: <staged | canary | blue-green | direct>
    stages_completed: [<string>]
    health_checks: [<string>]
  rollback_plan: <string>
  follow_up_items: [<string>] | []
```
