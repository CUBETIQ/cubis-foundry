---
name: test
description: "Design and execute verification strategy aligned to user risk, release confidence, and regression evidence."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "test"
  platform: "Codex"
  command: "/test"
compatibility: Codex
---
# test Workflow
# Test Workflow

## When to use

Use this when writing new tests, improving coverage, debugging test failures, or designing a testing strategy.

## Routing

- Primary specialist: `@test-engineer`
- Automation support: `@qa-automation-engineer`
- Domain support: `@backend-specialist`, `@frontend-specialist`
- Verification support: `@validator`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the code under test, existing test files, coverage reports, and any failing test output.

## Skill Routing

- Primary skills: `testing-patterns`, `webapp-testing`
- Supporting skills (optional): `playwright-e2e`, `error-ux-observability`, `debugging-strategies`, `frontend-code-review`, `static-analysis`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`
- Start with `testing-patterns` for test strategy and architecture. Add `webapp-testing` for implementation. Add `playwright-e2e` for E2E automation. Add `error-ux-observability` for testing error states.

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
  primary_skills: [testing-patterns, webapp-testing]
  supporting_skills: [playwright-e2e?, error-ux-observability?, debugging-strategies?]
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