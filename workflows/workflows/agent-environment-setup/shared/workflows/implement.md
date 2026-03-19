---
command: "/implement"
description: "End-to-end feature implementation: plan the approach, write the code, test it, and review it. Full lifecycle from idea to reviewed code."
triggers: ["implement", "build", "feature", "create", "develop"]
---

# Implement Workflow

## When to use

Use for building new features or making code changes that need the full lifecycle: planning, implementation, testing, and review.

## Agent Chain

`planner` → `implementer` → `tester` → `reviewer`

## Routing

1. **Plan**: `@planner` reads the requirements and existing code, produces an implementation plan.
2. **Implement**: `@implementer` executes the plan, writing production-quality code.
3. **Test**: `@tester` writes and runs tests verifying the implementation.
4. **Review**: `@reviewer` performs code review and either approves or requests changes.

## Skill Routing

- Primary skills: `api-design`, `typescript-best-practices`
- Supporting skills (optional): `spec-driven-delivery`, `system-design`, `unit-testing`, `integration-testing`, `code-review`

## Context notes

- Provide the feature requirements, acceptance criteria, and any design constraints.
- Implementer follows existing codebase patterns and conventions.

## Workflow steps

1. Planner analyzes requirements and produces a structured implementation plan.
2. Implementer executes the plan step by step, verifying compilation after each change.
3. Tester writes tests for the new code and runs the full test suite.
4. Reviewer evaluates code quality, patterns, and correctness.
5. If changes are requested, implementer applies fixes and the cycle repeats from step 3.

## Verification

- All planned changes implemented and code compiles without errors.
- Tests pass and cover the new functionality.
- Code review approved with no critical findings.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: implementer
  supporting_agents: [planner, tester, reviewer]
  changed_artifacts: [<path>]
  tests_status: <pass|fail>
  review_status: <approve|request_changes>
  follow_up_items: [<string>] | []
```
