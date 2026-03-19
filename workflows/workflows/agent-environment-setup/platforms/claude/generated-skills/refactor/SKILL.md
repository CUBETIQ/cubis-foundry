---
name: refactor
description: "Large-scale refactoring workflow: explore the current state, plan the migration, implement changes, test thoroughly, and review."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "refactor"
  platform: "Claude Code"
  command: "/refactor"
compatibility: Claude Code
---
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