---
command: "/release"
description: "Prepare and execute release with rollout guardrails, verification, and rollback plan."
triggers: ["release", "deploy", "rollout", "ship", "go-live"]
---

# Release Workflow

# CHANGED: output contract — converted free-form bullets into structured YAML — keeps release gates and monitoring plans machine-readable.

## When to use

Use this before deployment to production-like environments.

## Routing

- Release orchestration: `@devops-engineer`
- Risk checks: `@security-auditor` + `@test-engineer`
- Scope/fallback alignment: `@product-manager`

## Context notes

- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing

- Primary skills: `javascript-pro`, `typescript-pro`, `python-pro`, `golang-pro`
- Infrastructure skills: `git-workflow`, `ci-cd-pipelines`
- Supporting skills (optional): `observability`, `skill-creator`
- Release work should stay anchored to the language used by the build and deployment surface. Add `git-workflow` for branching strategy and release tagging, `ci-cd-pipelines` for deployment pipeline configuration, and `observability` for post-release monitoring.

## Workflow steps

1. Confirm release scope and dependencies.
2. Validate test evidence and readiness gates.
3. Define rollout strategy and rollback triggers.
4. Execute release and monitor signals.
5. Publish release summary and next actions.

## Verification

- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract

```yaml
RELEASE_WORKFLOW_RESULT:
  primary_agent: devops-engineer
  supporting_agents: [security-auditor?, test-engineer?, product-manager?]
  primary_skills: [javascript-pro?, typescript-pro?, python-pro?, golang-pro?]
  supporting_skills:
    [
      nodejs-best-practices?,
      debugging-strategies?,
      webapp-testing?,
      playwright-e2e?,
      skill-creator?,
    ]
  release_checklist_status: [<string>]
  rollout_strategy: [<string>]
  rollback_conditions: [<string>]
  post_release_monitoring_plan: [<string>]
```
