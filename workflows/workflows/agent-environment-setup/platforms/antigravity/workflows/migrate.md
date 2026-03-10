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

# Migration Workflow

# Run this when upgrading frameworks, migrating databases, updating major dependencies, or transitioning between technologies.

## When to use

Use this when a codebase needs a significant version upgrade (React 18→19, Next.js 14→15, Node 18→22, database engine swap), a dependency migration, or a technology replacement.

## Routing

- Primary coordinator: `@orchestrator`
- Codebase survey: `@researcher`
- Architecture impact: `@backend-specialist` or `@frontend-specialist`
- Database migrations: `@database-architect`
- Breaking change analysis: `@code-archaeologist`
- Security implications: `@security-auditor`
- Test strategy: `@test-engineer`
- Deployment safety: `@devops-engineer`
- Validation: `@validator`

## Workflow steps

### Phase 1: Research

1. `@researcher` surveys the current codebase for usage of the migrating technology.
2. Document current version, all usage locations, and integration points.
3. Read the target version's migration guide and breaking changes list.
4. Identify deprecated APIs, renamed exports, changed behaviors.

### Phase 2: Impact analysis

5. `@code-archaeologist` maps all affected files and dependency chains.
6. Categorize changes: automatic (codemod), mechanical (find-and-replace), manual (logic change).
7. Identify high-risk areas: custom patches, monkey-patches, version-pinned transitive deps.
8. Estimate scope per category.

### Phase 3: Migration plan

9. `@orchestrator` produces a phased migration plan with rollback points.
10. Define incremental milestones — each milestone should leave the codebase in a working state.
11. Order changes: infrastructure → config → code → tests → docs.
12. Plan codemods before manual changes.

### Phase 4: Execute (incremental)

13. Create a migration branch with the upgrade.
14. Run codemods first, commit separately.
15. Apply mechanical changes, commit separately.
16. Handle manual changes one module at a time, with tests after each.
17. `@validator` verifies each milestone against acceptance criteria.
18. If any milestone breaks: revert to last good state and re-plan.

### Phase 5: Verify

19. Full test suite passes (unit, integration, E2E).
20. Build succeeds with no warnings from the new version.
21. Manual smoke test of critical user flows.
22. Performance regression check (build time, bundle size, runtime performance).
23. Security audit of new/updated dependencies.

### Phase 6: Ship

24. Merge migration PR with detailed description of all changes.
25. Monitor production for regressions (error rate, latency, Core Web Vitals).
26. Keep rollback plan ready for 48 hours post-deploy.

## Rollback rules

- Every migration milestone must be independently revertable.
- If > 3 files require non-trivial manual fixes per milestone, split the milestone further.
- Database migrations must be backward-compatible (expand-then-contract pattern).
- Feature flags for behavior changes that can be toggled without redeploy.

## Context notes

- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach the migration guide URL, changelog, or breaking changes list when context is incomplete.
- Every milestone must leave the codebase in a buildable, testable state.
- Prefer codemods and automated transforms over manual find-and-replace.
- Database migrations must use the expand-then-contract pattern for zero-downtime.

## Skill Routing

- Primary skills: depends on migration target (e.g., `react-expert` for React upgrade, `nextjs-developer` for Next.js, `typescript-pro` for TS upgrade)
- Supporting skills (optional): `debugging-strategies`, `web-perf`, `webapp-testing`
- Load the skill matching the technology being migrated.

## Verification

- All tests pass at every milestone.
- No new deprecation warnings introduced.
- Build output size within 5% of pre-migration baseline.
- Zero critical or high-severity vulnerability additions.

## Output Contract

```yaml
MIGRATION_RESULT:
  primary_agent: orchestrator
  supporting_agents: [researcher, code-archaeologist, validator, <domain-specialist>]
  migration_type: framework-upgrade | dependency-update | technology-swap | database-migration
  from_version: <string>
  to_version: <string>
  milestones:
    - name: <string>
      status: completed | failed | skipped
      files_changed: <number>
      validation_verdict: PASS | FAIL
  breaking_changes_resolved: <number>
  codemods_applied: <number>
  manual_changes: <number>
  test_results:
    passed: <number>
    failed: <number>
    skipped: <number>
  rollback_plan: <string>
  remaining_deprecations: [<string>] | []
  follow_up: [<string>] | []
```
