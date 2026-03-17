# Workflow Prompt: /refactor

Improve maintainability while preserving behavior through incremental safe refactoring.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `code-review`, `system-design`, `unit-testing`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`.
- Local skill file hints if installed: `.github/skills/code-review/SKILL.md`, `.github/skills/system-design/SKILL.md`, `.github/skills/unit-testing/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/python-best-practices/SKILL.md`, `.github/skills/golang-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
- Read `ENGINEERING_RULES.md` and `docs/foundation/TECH.md` first so behavior-preserving structure changes do not drift from the accepted architecture contract. Check `docs/foundation/ARCHITECTURE.md` for `## Dependency Rules` and `## Crosscutting Concerns` before restructuring.

## Skill Routing

- Primary skills: `static-analysis`, `legacy-modernizer`
- Supporting skills (optional): `testing-patterns`, `system-design`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`
- Start with `static-analysis` for automated code quality assessment. Add `legacy-modernizer` for modernization patterns. Add `testing-patterns` when refactoring needs test coverage to proceed safely.

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
  primary_skills: [static-analysis, legacy-modernizer]
  supporting_skills: [testing-patterns?, system-design?]
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
