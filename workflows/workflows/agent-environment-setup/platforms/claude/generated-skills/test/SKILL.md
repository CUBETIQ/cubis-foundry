---
name: test
description: "Test authoring and coverage improvement: explore the code, write tests, and review test quality."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "test"
  platform: "Claude Code"
  command: "/test"
compatibility: Claude Code
---
# Test Workflow
## When to use

Use when adding tests, fixing test failures, or improving test coverage for existing code.

## Agent Chain

`explorer` -> `tester` -> `reviewer`

## Routing

1. **Explore**: `@explorer` reads the code under test - maps functions, inputs, outputs, edge cases, and existing test patterns.
2. **Test**: `@tester` writes tests following the project's conventions, runs the suite, and analyzes results.
3. **Review**: `@reviewer` evaluates test quality, coverage, and correctness.

## Skill Routing

- Primary skills: `unit-testing`, `integration-testing`
- Supporting skills (optional): `deep-research`, `playwright-interactive`, `playwright-web-qa`, `flutter-mobile-qa`, `code-review`

## Context notes

- Specify the code area to test, desired coverage level, and any specific scenarios to verify.
- Tester uses the project's existing test framework and patterns.

## Workflow steps

1. Explorer maps the code to be tested: public API, edge cases, error paths.
2. Tester writes tests following existing project patterns (framework, naming, structure).
3. Tester runs the full test suite and reports results.
4. Reviewer evaluates test coverage and quality - checks for missing edge cases.
5. If gaps are found, tester adds additional tests and re-runs.

## Verification

- All new tests pass.
- Test coverage meets the specified target.
- No existing tests broken by changes.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: tester
  supporting_agents: [explorer, reviewer]
  tests_added: [<path>]
  tests_passed: <number>
  tests_failed: <number>
  coverage_delta: <string>
  follow_up_items: [<string>] | []
```