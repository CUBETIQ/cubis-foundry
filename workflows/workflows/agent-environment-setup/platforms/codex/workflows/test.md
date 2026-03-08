---
command: "/test"
description: "Design and execute verification and QA strategy aligned to risk and acceptance criteria."
triggers: ["test", "verify", "coverage", "qa", "regression"]
---
# Test Workflow

# CHANGED: routing — added explicit verification owners — prevents route manifest fallback to orchestrator for test-focused requests.
# CHANGED: output contract — converted free-form bullets into structured YAML — keeps test outcomes machine-readable for release gating.

## When to use
Use this to drive confidence before merge or release.

## Routing
- Primary specialist: `@test-engineer`
- Automation depth and regression safety: `@test-engineer`
- Failure triage: `@debugger`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`
- Supporting skills (optional): `skill-creator`
- Test work should follow the dominant implementation language in scope. There is no live dedicated testing specialist skill during the reset.

## Workflow steps
1. Map change surface to risk areas.
2. Choose unit/integration/e2e depth per risk.
3. Run fast checks first, then broad suite.
4. Report failures with root-cause direction.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
TEST_WORKFLOW_RESULT:
  primary_agent: test-engineer
  supporting_agents: [debugger?]
  primary_skills: [test-master, playwright-expert]
  supporting_skills: [webapp-testing?, flutter-test-master?]
  coverage_map: [<string>]
  test_results:
    passed: [<string>]
    failed: [<string>] | []
    flaky: [<string>] | []
  residual_risk: [<string>] | []
  recommendation: <merge|hold|release-ready|needs-follow-up>
  next_handoff:
    plan_handoff: <PLAN_HANDOFF|null>
```
