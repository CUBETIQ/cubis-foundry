---
command: "/test"
description: "Design and execute verification strategy aligned to user risk, release confidence, and regression evidence."
triggers: ["test", "verify", "coverage", "qa", "regression"]
---

# Test Workflow

## When to use

Use this when writing new tests, improving coverage, debugging test failures, or designing a testing strategy.

## Routing

- Primary specialist: `the test-engineer posture`
- Automation support: `the qa-automation-engineer posture`
- Domain support: `the backend-specialist posture`, `the frontend-specialist posture`
- Verification support: `the validator posture`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the code under test, existing test files, coverage reports, and any failing test output.

## Skill Routing

- Primary skills: `unit-testing`, `integration-testing`
- Supporting skills (optional): `playwright-interactive`, `observability`, `systematic-debugging`, `code-review`, `code-review`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`, `java-best-practices`
- Start with `unit-testing` for test strategy and architecture. Add `integration-testing` for implementation. Add `playwright-interactive` for E2E automation. Add `observability` for testing error states.

## Workflow steps

1. Assess current test coverage and identify gaps.
2. Design test strategy (which layers, what to test, what to skip).
3. Implement tests with clear arrange/act/assert structure.
4. Run tests and verify they pass.
5. Review coverage improvement and remaining gaps.

## Verification

- All new tests pass reliably (no flakiness).
- Tests cover the identified risk areas.
- Coverage metrics improved or maintained.
- Test naming clearly describes the scenario being verified.

## Output Contract

```yaml
TEST_WORKFLOW_RESULT:
  primary_agent: test-engineer
  supporting_agents: [qa-automation-engineer?, backend-specialist?, frontend-specialist?, validator?]
  primary_skills: [unit-testing, integration-testing]
  supporting_skills: [playwright-interactive?, observability?, systematic-debugging?]
  test_strategy:
    unit: <number of tests>
    integration: <number of tests>
    e2e: <number of tests>
  tests_written: [<test-file-path>]
  coverage:
    before: <percentage or description>
    after: <percentage or description>
  gaps_remaining: [<string>] | []
  follow_up_items: [<string>] | []
```

> **Codex note:** This workflow runs inside a network-restricted sandbox. Specialists are reasoning postures defined in AGENTS.md, not spawned processes.
