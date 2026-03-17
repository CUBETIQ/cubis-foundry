# Workflow Prompt: /release

Prepare and execute release with rollout guardrails, verification, and rollback plan.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `ci-cd-pipeline`, `git-workflow`, `tech-doc`, `observability`, `kubernetes-deploy`, `typescript-best-practices`, `javascript-best-practices`.
- Local skill file hints if installed: `.github/skills/ci-cd-pipeline/SKILL.md`, `.github/skills/git-workflow/SKILL.md`, `.github/skills/tech-doc/SKILL.md`, `.github/skills/observability/SKILL.md`, `.github/skills/kubernetes-deploy/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Release Workflow

## When to use

Use this when preparing a release, deploying to production, or managing a rollout.

## Routing

- Primary coordinator: `@devops-engineer`
- Release verification: `@test-engineer`, `@validator`
- Documentation: `@documentation-writer`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the release scope, version number, changelog draft, and deployment target.
- Read `ENGINEERING_RULES.md` and `docs/foundation/TECH.md` before release if the shipped changes touched architecture, scaling assumptions, or design-system rules. Check `docs/foundation/TECH.md` for `## Build And Validation` and `## CI CD Pipeline` steps to verify the release pipeline.

## Skill Routing

- Primary skills: `ci-cd-pipelines`, `git-workflow`
- Supporting skills (optional): `changelog-generator`, `devops-engineer`, `sre-engineer`, `docker-kubernetes`, `observability`, `serverless-patterns`, `typescript-pro`, `javascript-pro`
- Start with `ci-cd-pipelines` for deployment automation and `git-workflow` for release branching. Add `changelog-generator` for release notes.

## Workflow steps

1. Finalize scope — confirm all changes are merged and tested.
2. Generate changelog and release notes.
3. Prepare deployment artifacts and configuration.
4. Execute staged rollout with health checks at each stage.
5. Verify production health post-deployment.
6. Document rollback procedure and post-release status.
7. Set `doc_impact` if the release includes architecture-affecting work that should refresh the managed docs.

## Verification

- All tests pass on release branch/tag.
- Changelog accurately reflects changes.
- Deployment artifacts built and verified.
- Production health confirmed after rollout.
- Rollback procedure tested or documented.

## Output Contract

```yaml
RELEASE_WORKFLOW_RESULT:
  primary_agent: devops-engineer
  supporting_agents: [test-engineer?, validator?, documentation-writer?]
  primary_skills: [ci-cd-pipelines, git-workflow]
  supporting_skills: [changelog-generator?, devops-engineer?, sre-engineer?]
  release:
    version: <string>
    changelog: <string>
    artifacts: [<string>]
  deployment:
    strategy: <staged | canary | blue-green | direct>
    stages_completed: [<string>]
    health_checks: [<string>]
  rollback_plan: <string>
  doc_impact: none | tech | rules | both
  follow_up_items: [<string>] | []
```
