# Workflow Prompt: /implement

End-to-end feature implementation: plan the approach, write the code, test it, and review it. Full lifecycle from idea to reviewed code.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `api-design`, `typescript-best-practices`, `spec-driven-delivery`, `system-design`, `unit-testing`, `integration-testing`, `code-review`.
- Local skill file hints if installed: `.github/skills/api-design/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/spec-driven-delivery/SKILL.md`, `.github/skills/system-design/SKILL.md`, `.github/skills/unit-testing/SKILL.md`, `.github/skills/integration-testing/SKILL.md`, `.github/skills/code-review/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
