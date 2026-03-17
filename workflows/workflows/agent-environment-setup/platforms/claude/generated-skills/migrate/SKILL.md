---
name: migrate
description: "Plan and execute technology migrations, framework upgrades, and dependency updates with rollback safety, incremental verification, and zero-downtime transition."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "migrate"
  platform: "Claude Code"
  command: "/migrate"
compatibility: Claude Code
---
# migrate Workflow
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