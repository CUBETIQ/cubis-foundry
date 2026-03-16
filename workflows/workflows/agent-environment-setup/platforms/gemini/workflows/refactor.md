---
command: "/refactor"
description: "Improve maintainability while preserving behavior through incremental safe refactoring."
triggers: ["refactor", "cleanup", "maintainability", "debt", "modularize"]
---

# Refactor Workflow

## When to use

Use this when improving code structure, reducing tech debt, or modularizing without changing behavior.

## Routing

- Primary specialist: `the code-archaeologist posture`
- Domain support: `the backend-specialist posture`, `the frontend-specialist posture`
- Verification support: `the test-engineer posture`, `the validator posture`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the target code, pain points, and any constraints on what can change.
- Read `ENGINEERING_RULES.md` and `docs/foundation/TECH.md` first so behavior-preserving structure changes do not drift from the accepted architecture contract. Check `docs/foundation/ARCHITECTURE.md` for `## Dependency Rules` and `## Crosscutting Concerns` before restructuring.

## Skill Routing

- Primary skills: `code-review`, `system-design`
- Supporting skills (optional): `unit-testing`, `system-design`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`
- Start with `code-review` for automated code quality assessment. Add `system-design` for modernization patterns. Add `unit-testing` when refactoring needs test coverage to proceed safely.

## Workflow steps

1. Map the current structure and identify refactoring targets.
2. Ensure adequate test coverage before modifying (add tests if needed).
3. Apply one refactoring at a time with behavior preservation.
4. Verify behavior unchanged after each step.
5. Document the improved structure and any conventions established.
6. Set `doc_impact` when the refactor changes project structure, module boundaries, or design-system conventions.

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
  primary_skills: [code-review, system-design]
  supporting_skills: [unit-testing?, system-design?]
  refactoring_summary:
    targets: [<string>]
    changes_applied: [<string>]
    behavior_preserved: true | false
  quality_improvement:
    complexity_before: <string>
    complexity_after: <string>
  doc_impact: none | tech | rules | both
  tests_added: [<test-file-path>] | []
  follow_up_items: [<string>] | []
```

> **Gemini note:** Commands route into workflow files under `.gemini/workflows/`. Specialists are inline postures coordinated through GEMINI.md guidance, not separate agent artifacts.
