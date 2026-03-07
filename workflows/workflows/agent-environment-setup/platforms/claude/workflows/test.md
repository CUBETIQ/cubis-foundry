---
command: "/test"
description: "Design and execute verification strategy aligned to risk and acceptance criteria."
triggers: ["test", "verify", "coverage", "qa", "regression"]
---
# Test Workflow

# CHANGED: routing — added explicit verification owners — prevents route manifest fallback to orchestrator for test-focused requests.
# CHANGED: output contract — converted free-form bullets into structured YAML — keeps test outcomes machine-readable for release gating.

## When to use
Use this to drive confidence before merge or release.

## Routing
- Primary specialist: `@test-engineer`
- Automation depth: `@qa-automation-engineer`
- Failure triage: `@debugger`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `test-master`, `playwright-expert`
- Supporting skills (optional): `webapp-testing`, `flutter-test-master`

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
  supporting_agents: [qa-automation-engineer?, debugger?]
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
