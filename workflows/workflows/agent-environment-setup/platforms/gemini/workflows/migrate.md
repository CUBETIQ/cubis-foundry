---
command: "/migrate"
description: "Plan and execute technology migrations, framework upgrades, and dependency updates with rollback safety, incremental verification, and zero-downtime transition."
triggers:
  [
    "migrate",
    "upgrade",
    "update dependency",
    "framework upgrade",
    "version bump",
    "major update",
  ]
---

# Migrate Workflow

## When to use

Use this for technology migrations, framework upgrades, dependency updates, or major version transitions.

## Routing

- Primary specialist: `the code-archaeologist posture`
- Implementation support: `the backend-specialist posture`, `the frontend-specialist posture`
- Verification support: `the test-engineer posture`, `the validator posture`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the migration target, current versions, breaking change lists, and impact assessment.
- Read `ENGINEERING_RULES.md` and `docs/foundation/TECH.md` first because migrations often change accepted patterns and current-state architecture at the same time. After migration, flag updates needed in `docs/foundation/ARCHITECTURE.md` for `## Risks And Tech Debt`.

## Skill Routing

- Primary skills: `system-design`, `system-design`
- Supporting skills (optional): `code-review`, `unit-testing`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`
- Start with `system-design` for migration methodology and `system-design` for system impact. Add `code-review` for automated codemod or compatibility analysis.

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
  primary_skills: [system-design, system-design]
  supporting_skills: [code-review?, unit-testing?]
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

> **Gemini note:** Commands route into workflow files under `.gemini/workflows/`. Specialists are inline postures coordinated through GEMINI.md guidance, not separate agent artifacts.
