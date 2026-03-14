---
name: unit-testing
description: "Unit testing best practices covering test design, mocking strategies, coverage analysis, TDD workflow, and assertion patterns. Use when writing, reviewing, or improving unit tests."
---
# Unit Testing Best Practices

## Purpose

Provide a rigorous, repeatable methodology for designing, writing, and maintaining unit tests that maximize defect detection while minimizing maintenance cost. This skill ensures every unit test is fast, isolated, deterministic, and focused on a single behavior.

## When to Use

- Writing new unit tests for functions, methods, or classes.
- Reviewing existing test suites for quality and coverage gaps.
- Refactoring production code and need regression protection.
- Adopting TDD (red-green-refactor) on a feature branch.
- Evaluating mocking strategies for external dependencies.
- Investigating flaky or slow unit tests.
- Establishing test conventions for a new project or team.
- Analyzing code coverage reports and identifying meaningful gaps.

## Instructions

1. **Identify the unit under test** -- Select a single function, method, or class. Focusing on one unit at a time prevents coupling between tests and makes failures easy to diagnose.

2. **Define the behavioral contract** -- Write down the expected inputs, outputs, side effects, and error conditions before writing any test code. This ensures tests validate behavior, not implementation details.

3. **Apply the Arrange-Act-Assert pattern** -- Structure every test into setup (Arrange), invocation (Act), and verification (Assert). Consistent structure makes tests scannable and reduces cognitive load during review.

4. **Name tests with the GIVEN-WHEN-THEN convention** -- Use descriptive names like `shouldReturnEmptyList_whenNoItemsExist`. Clear names serve as living documentation and speed up failure diagnosis.

5. **Mock only direct collaborators** -- Replace external dependencies (databases, HTTP clients, file systems) with test doubles. Mocking deeper layers creates brittle tests that break on internal refactors.

6. **Prefer stubs over mocks when possible** -- Use stubs to provide canned answers and mocks only when verifying interaction is the goal. Over-mocking couples tests to implementation details and makes refactoring painful.

7. **Write the failing test first (Red)** -- In TDD, write a test that fails for the right reason before writing production code. This proves the test actually exercises the intended behavior.

8. **Implement the minimum code to pass (Green)** -- Write only enough production code to make the failing test pass. Minimal implementation prevents speculative design and keeps the feedback loop tight.

9. **Refactor with confidence (Refactor)** -- Clean up duplication and improve naming while all tests remain green. The passing suite acts as a safety net, allowing bold structural changes.

10. **Test edge cases and error paths** -- Include boundary values, null inputs, empty collections, and exception scenarios. Edge cases account for a disproportionate share of production bugs.

11. **Assert one logical concept per test** -- Each test should verify a single behavior or outcome. Multiple unrelated assertions in one test obscure which behavior actually failed.

12. **Keep tests deterministic and independent** -- Avoid shared mutable state, random data without seeds, and ordering dependencies. Non-deterministic tests erode team trust in the suite.

13. **Measure coverage as a diagnostic, not a target** -- Use line, branch, and mutation coverage to find untested paths. Chasing a coverage number without quality assertions creates false confidence.

14. **Maintain test speed below 100ms per test** -- Fast tests encourage frequent execution. When a test is slow, identify the bottleneck (usually I/O) and replace it with a test double.

15. **Review tests with the same rigor as production code** -- Apply naming, structure, and readability standards to tests. Poorly written tests become maintenance liabilities that teams abandon.

16. **Refactor tests when they become brittle** -- If many tests break after a small production change, the tests are over-coupled. Extract shared fixtures, simplify mocks, and align tests to public interfaces.

## Output Format

```markdown
## Unit Test Plan

### Unit Under Test
- **Module:** <module path>
- **Function/Class:** <name>
- **Behavioral Contract:** <expected behavior summary>

### Test Cases
| # | Test Name | Arrange | Act | Assert | Edge Case? |
|---|-----------|---------|-----|--------|------------|
| 1 | ...       | ...     | ... | ...    | Yes/No     |

### Mocking Strategy
| Dependency | Double Type | Rationale |
|------------|-------------|-----------|
| ...        | Stub/Mock/Fake | ...    |

### Coverage Targets
| Metric   | Current | Target | Gap Analysis |
|----------|---------|--------|--------------|
| Line     | ...     | ...    | ...          |
| Branch   | ...     | ...    | ...          |
| Mutation | ...     | ...    | ...          |
```

## References

| Topic              | File                                | Load When                                      |
|--------------------|-------------------------------------|-------------------------------------------------|
| Test Design        | `references/test-design.md`         | Designing test structure and naming conventions |
| Mocking Strategies | `references/mocking.md`             | Choosing between stubs, mocks, fakes, spies    |
| Coverage Analysis  | `references/coverage.md`            | Interpreting and improving coverage metrics     |
| TDD Workflow       | `references/tdd-workflow.md`        | Practicing red-green-refactor cycle             |
| Assertion Patterns | `references/assertion-patterns.md`  | Writing precise, readable assertions            |

## Gemini Platform Notes

- Use `activate_skill` to invoke skills by name from Gemini CLI or Gemini Code Assist.
- Skill files are stored under `.gemini/skills/` in the project root.
- Gemini does not support `context: fork` — all skill execution is inline.
- User arguments are passed as natural language in the activation prompt.
- Reference files are loaded relative to the skill directory under `.gemini/skills/<skill-id>/`.
