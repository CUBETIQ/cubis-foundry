---
command: "/qa"
description: "Create and execute quality strategy with automation and regression-focused coverage."
triggers: ["qa", "test", "regression", "automation", "e2e"]
---
# QA Workflow

## When to use
Use this when verification quality and regression prevention are primary concerns.

## Routing
- Primary specialist: `@qa-automation-engineer`
- Test strategy support: `@test-engineer`
- Bug investigation support: `@debugger`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `test-master`, `playwright-expert`
- Supporting skills (optional): `webapp-testing`, `lint-and-validate`

## Workflow steps
1. Identify risk-heavy user journeys.
2. Define automation + manual checks where needed.
3. Execute validation and triage failures.
4. Report confidence level and remaining gaps.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Test strategy and scope
- Automation coverage updates
- Defect findings and severity
- Confidence and residual risk
