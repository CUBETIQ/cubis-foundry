---
command: "/database"
description: "Design or review schema, queries, and migrations with performance and integrity controls."
triggers: ["database", "sql", "schema", "migration", "index"]
---
# Database Workflow

# CHANGED: output contract — converted free-form bullets into structured YAML — keeps schema and migration handoffs machine-readable across platforms.

## When to use
Use this when data modeling, query quality, migration safety, or database performance is core to the task.

## Routing
- Primary specialist: `@database-architect`
- Backend integration: `@backend-specialist`
- Verification support: `@test-engineer`
- Core skill hub: `database-skills`
- Companion skills: `database-design` (schema/migrations), `database-optimizer` (tuning/triage)
- Engine and platform specialists are loaded on-demand only when platform behavior matters: `postgres`, `mysql`, `sqlite`, `mongodb`, `redis`, `supabase`, `firebase`, `vitess`, `neki`.
- Access-layer specialists are loaded only when the ORM or schema-as-code layer is the real decision surface: `drizzle-expert`.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `database-skills`, `database-design`
- Supporting skills (optional): `database-optimizer`, `drizzle-expert`, `postgres`, `mysql`, `sqlite`, `mongodb`, `redis`, `supabase`, `firebase`, `vitess`, `neki`, `architecture-designer`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `php-pro`, `ruby-pro`, `skill-creator`
- Use `database-skills` as the triage hub, `database-design` when schema and migration shape are primary, and `database-optimizer` only when evidence shows a query, index, or contention problem. Add the exact engine or platform specialist only when engine behavior or managed-product constraints are relevant. Load `drizzle-expert` only when the access layer, schema-as-code, or drizzle-kit path is the real decision surface, then one matching language skill for query-code changes.

## Workflow steps
1. Confirm data shape, access patterns, and workload size.
2. Choose track: `database-design` (schema/migrations), `database-optimizer` (tuning), or `database-skills` (engine wrappers).
3. Choose engine, platform, and access-layer wrappers and define index strategy.
4. Define pagination strategy (keyset first, offset only if justified).
5. Plan migration and rollback.
6. Validate with query-plan evidence and production-risk notes.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
DATABASE_WORKFLOW_RESULT:
  primary_agent_id: "database-architect"
  supporting_agent_ids: ["backend-specialist", "test-engineer"]
  primary_skill_ids: ["database-skills", "database-design"]
  supporting_skill_ids: ["database-optimizer"]
  schema_changes: ["Describe schema changes"]
  indexing_plan: ["Describe indexes and rationale"]
  pagination_plan: null
  migration:
    required: false
    plan: ["Describe migration steps"]
    rollback: ["Describe rollback steps"]
  evidence:
    query_plans: ["Summarize explain or engine-native plan evidence"]
    validation_checks: ["<command-or-test>"]
```
