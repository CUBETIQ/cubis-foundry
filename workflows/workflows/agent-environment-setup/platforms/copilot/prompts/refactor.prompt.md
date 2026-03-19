# Workflow Prompt: /refactor

Large-scale refactoring workflow: explore the current state, plan the migration, implement changes, test thoroughly, and review.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `api-design`, `typescript-best-practices`, `deep-research`, `spec-driven-delivery`, `system-design`, `unit-testing`, `integration-testing`, `code-review`.
- Local skill file hints if installed: `.github/skills/api-design/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/deep-research/SKILL.md`, `.github/skills/spec-driven-delivery/SKILL.md`, `.github/skills/system-design/SKILL.md`, `.github/skills/unit-testing/SKILL.md`, `.github/skills/integration-testing/SKILL.md`, `.github/skills/code-review/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Refactor Workflow

## When to use

Use for large-scale refactoring, framework migrations, code modernization, or structural changes that affect multiple files.

## Agent Chain

`explorer` → `planner` → `implementer` → `tester` → `reviewer`

## Routing

1. **Explore**: `@explorer` maps the current state — dependencies, usage patterns, call sites, test coverage.
2. **Plan**: `@planner` designs the refactoring strategy: phases, ordering, rollback points.
3. **Implement**: `@implementer` executes the refactoring in planned phases.
4. **Test**: `@tester` runs the full test suite after each phase to catch regressions.
5. **Review**: `@reviewer` verifies the refactoring maintains correctness and improves the code.

## Skill Routing

- Primary skills: `api-design`, `typescript-best-practices`
- Supporting skills (optional): `deep-research`, `spec-driven-delivery`, `system-design`, `unit-testing`, `integration-testing`, `code-review`

## Context notes

- Provide the refactoring goal, scope, and any constraints (backward compatibility, etc.).
- Large refactors are executed in phases with test verification between each phase.

## Workflow steps

1. Explorer maps all affected files, dependencies, and usage patterns.
2. Planner produces a phased refactoring plan with rollback checkpoints.
3. Implementer executes phase 1, then tester runs tests. Repeat for each phase.
4. Reviewer evaluates the final result for correctness and improvement.
5. If issues are found, implementer addresses them before proceeding to the next phase.

## Verification

- All tests pass after each refactoring phase.
- No behavioral regressions.
- Code quality measurably improved.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: implementer
  supporting_agents: [explorer, planner, tester, reviewer]
  phases_completed: <number>
  phases_total: <number>
  changed_artifacts: [<path>]
  tests_status: <pass|fail>
  behavioral_regressions: <number>
  follow_up_items: [<string>] | []
```
