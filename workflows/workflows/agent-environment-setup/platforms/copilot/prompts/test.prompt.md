# Workflow Prompt: /test

Test authoring and coverage improvement: explore the code, write tests, and review test quality.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `unit-testing`, `integration-testing`, `deep-research`, `playwright-interactive`, `playwright-web-qa`, `flutter-mobile-qa`, `code-review`.
- Local skill file hints if installed: `.github/skills/unit-testing/SKILL.md`, `.github/skills/integration-testing/SKILL.md`, `.github/skills/deep-research/SKILL.md`, `.github/skills/playwright-interactive/SKILL.md`, `.github/skills/playwright-web-qa/SKILL.md`, `.github/skills/flutter-mobile-qa/SKILL.md`, `.github/skills/code-review/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
