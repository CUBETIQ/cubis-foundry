---
command: "/refactor"
description: "Improve maintainability while preserving behavior through incremental safe refactoring."
triggers: ["refactor", "cleanup", "maintainability", "debt", "modularize"]
---

# Refactor Workflow

## When to use

Use this when improving code structure, reducing tech debt, or modularizing without changing behavior.

## Routing

- Primary specialist: `@code-archaeologist`
- Domain support: `@backend-specialist`, `@frontend-specialist`
- Verification support: `@test-engineer`, `@validator`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the target code, pain points, and any constraints on what can change.

## Skill Routing

- Primary skills: `static-analysis`, `legacy-modernizer`
- Supporting skills (optional): `testing-patterns`, `architecture-designer`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`
- Start with `static-analysis` for automated code quality assessment. Add `legacy-modernizer` for modernization patterns. Add `testing-patterns` when refactoring needs test coverage to proceed safely.

## Workflow steps

1. Map the current structure and identify refactoring targets.
2. Ensure adequate test coverage before modifying (add tests if needed).
3. Apply one refactoring at a time with behavior preservation.
4. Verify behavior unchanged after each step.
5. Document the improved structure and any conventions established.

## Verification

- All existing tests pass after each refactoring step.
- No behavioral changes introduced (unless explicitly intended).
- Code quality metrics improved (complexity, coupling, cohesion).
- New tests added for any gaps discovered during refactoring.

## Output Contract

```yaml
REFACTOR_WORKFLOW_RESULT:
  primary_agent: code-archaeologist
  supporting_agents: [backend-specialist?, frontend-specialist?, test-engineer?, validator?]
  primary_skills: [static-analysis, legacy-modernizer]
  supporting_skills: [testing-patterns?, architecture-designer?]
  refactoring_summary:
    targets: [<string>]
    changes_applied: [<string>]
    behavior_preserved: true | false
  quality_improvement:
    complexity_before: <string>
    complexity_after: <string>
  tests_added: [<test-file-path>] | []
  follow_up_items: [<string>] | []
```
