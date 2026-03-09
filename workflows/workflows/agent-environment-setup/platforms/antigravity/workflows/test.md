---
command: "/test"
description: "Design and execute verification strategy aligned to user risk, release confidence, and regression evidence."
triggers: ["test", "verify", "coverage", "qa", "regression"]
---
# Test Workflow

## When to use
Use this when the primary goal is proving behavior before merge, release, or handoff.

## Routing
- Primary specialist: `@test-engineer`
- Browser failure or flaky-suite support: `@debugger`
- Domain implementation support: `@frontend-specialist`, `@backend-specialist`

## Context notes
- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach failing output, screenshots, traces, logs, routes, and acceptance criteria when context is incomplete.

## Skill Routing
- Primary skills: `webapp-testing`
- Supporting skills (optional): `playwright-e2e`, `frontend-code-review`, `debugging-strategies`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `skill-creator`
- Start with `webapp-testing` for test-layer choice and release confidence. Add `playwright-e2e` when browser automation is primary, `frontend-code-review` when UI correctness or accessibility review is part of verification, `debugging-strategies` when failures are already active, and the dominant language skill when unit or integration details are language-specific. Reserve `skill-creator` for skill-package tests and generator verification.

## Workflow steps
1. Map the change surface to business risk and user-visible regression paths.
2. Choose the cheapest reliable checks at the lowest useful layer.
3. Run fast deterministic tests first, then browser or broader suites only where they add confidence.
4. Investigate failures with traces, logs, or reproductions instead of classifying them as flaky by default.
5. Report coverage, residual gaps, and merge or release confidence explicitly.

## Verification
- Run focused checks for the changed scope first.
- Confirm adjacent high-risk paths if the fix or feature crosses boundaries.
- Note any unverified environments, manual-only checks, or quarantined flakes.

## Output Contract
```yaml
TEST_WORKFLOW_RESULT:
  primary_agent: test-engineer
  supporting_agents: [debugger?, frontend-specialist?, backend-specialist?]
  primary_skills: [webapp-testing]
  supporting_skills: [playwright-e2e?, frontend-code-review?, debugging-strategies?, typescript-pro?, javascript-pro?, python-pro?, golang-pro?, java-pro?, skill-creator?]
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
