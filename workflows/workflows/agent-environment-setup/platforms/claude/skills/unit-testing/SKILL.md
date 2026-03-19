---
name: unit-testing
description: "Unit testing best practices covering test design, mocking strategies, coverage analysis, TDD workflow, and assertion patterns. Use when writing, reviewing, or improving unit tests."
allowed-tools: Read Grep Glob Bash Edit Write
context: fork
agent: test-engineer
user-invocable: true
argument-hint: "Module, function, or component to unit test"
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

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents live under `../../agents/` relative to the mirrored skill directory and support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Key agents support `memory: project` for cross-session learning (orchestrator, debugger, researcher, project-planner).
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules live under `../../rules/` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
