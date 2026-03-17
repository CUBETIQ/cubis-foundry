# Workflow Prompt: /migrate

Plan and execute technology migrations, framework upgrades, and dependency updates with rollback safety, incremental verification, and zero-downtime transition.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `system-design`, `code-review`, `unit-testing`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`.
- Local skill file hints if installed: `.github/skills/system-design/SKILL.md`, `.github/skills/code-review/SKILL.md`, `.github/skills/unit-testing/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/python-best-practices/SKILL.md`, `.github/skills/golang-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Migrate Workflow

## When to use

Use this for technology migrations, framework upgrades, dependency updates, or major version transitions.

## Routing

- Primary specialist: `@code-archaeologist`
- Implementation support: `@backend-specialist`, `@frontend-specialist`
- Verification support: `@test-engineer`, `@validator`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the migration target, current versions, breaking change lists, and impact assessment.
- Read `ENGINEERING_RULES.md` and `docs/foundation/TECH.md` first because migrations often change accepted patterns and current-state architecture at the same time. After migration, flag updates needed in `docs/foundation/ARCHITECTURE.md` for `## Risks And Tech Debt`.

## Skill Routing

- Primary skills: `legacy-modernizer`, `system-design`
- Supporting skills (optional): `static-analysis`, `testing-patterns`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`
- Start with `legacy-modernizer` for migration methodology and `system-design` for system impact. Add `static-analysis` for automated codemod or compatibility analysis.

## Workflow steps

1. Assess current state and migration target.
2. Map breaking changes and affected code paths.
3. Plan incremental migration steps with rollback points.
4. Execute migration one step at a time with verification.
5. Update tests and documentation for new patterns.
6. Set `doc_impact` when the migration changes architecture, deployment shape, boundaries, or design-system rules.
7. Verify full system behavior after migration complete.

## Verification

- All breaking changes addressed.
- Tests pass on migrated code.
- Rollback tested at each migration step.
- No degradation in performance or functionality.
- Documentation updated for new patterns.

## Output Contract

```yaml
MIGRATE_WORKFLOW_RESULT:
  primary_agent: code-archaeologist
  supporting_agents: [backend-specialist?, frontend-specialist?, test-engineer?, validator?]
  primary_skills: [legacy-modernizer, system-design]
  supporting_skills: [static-analysis?, testing-patterns?]
  migration:
    from: <string>
    to: <string>
    breaking_changes: [<string>]
    steps_completed: [<string>]
    rollback_points: [<string>]
  verification:
    tests_passed: true | false
    performance_impact: <string>
  doc_impact: none | tech | rules | both
  follow_up_items: [<string>] | []
```
