# Workflow Prompt: /test

Design and execute verification strategy aligned to user risk, release confidence, and regression evidence.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `unit-testing`, `integration-testing`, `playwright-interactive`, `observability`, `systematic-debugging`, `code-review`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`, `java-best-practices`.
- Local skill file hints if installed: `.github/skills/unit-testing/SKILL.md`, `.github/skills/integration-testing/SKILL.md`, `.github/skills/playwright-interactive/SKILL.md`, `.github/skills/observability/SKILL.md`, `.github/skills/systematic-debugging/SKILL.md`, `.github/skills/code-review/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
