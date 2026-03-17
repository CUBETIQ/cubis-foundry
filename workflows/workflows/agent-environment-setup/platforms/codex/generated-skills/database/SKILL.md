---
name: database
description: "Design or review schema, queries, and migrations with performance and integrity controls."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "database"
  platform: "Codex"
  command: "/database"
compatibility: Codex
---
# database Workflow
# Database Workflow

## When to use

Use this for schema design, query optimization, migration planning, or database architecture decisions.

## Routing

- Primary specialist: `@database-architect`
- Implementation support: `@backend-specialist`
- Verification support: `@test-engineer`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach existing schema, migration history, query patterns, and performance requirements.
- Read `ENGINEERING_RULES.md` and `TECH.md` before changing data ownership, persistence boundaries, or shared schema conventions.

## Skill Routing

- Primary skills: `database-design`, `database-optimizer`, `database-design`
- Supporting skills (optional): `drizzle-expert`, `postgres`, `mysql`, `sqlite`, `mongodb`, `redis`, `supabase`, `firebase`, `vitess`, `typescript-pro`, `javascript-pro`, `python-pro`
- Start with `database-design` for schema work, `database-optimizer` for performance, or `database-design` for general database operations. Add engine-specific skill when applicable.

## Workflow steps

1. Understand current schema and data model.
2. Design or review proposed changes with normalization analysis.
3. Plan migration with rollback strategy.
4. Optimize queries and indexes for known access patterns.
5. Validate data integrity constraints.
6. Set `doc_impact` if the change alters data boundaries, core entities, or persistence patterns that future work should follow.

## Verification

- Schema changes maintain referential integrity.
- Migrations are reversible or have documented rollback plan.
- EXPLAIN output reviewed for performance-sensitive queries.
- No breaking changes to existing consumers without migration plan.

## Output Contract

```yaml
DATABASE_WORKFLOW_RESULT:
  primary_agent: database-architect
  supporting_agents: [backend-specialist?, test-engineer?]
  primary_skills: [database-design, database-optimizer, database-design]
  supporting_skills: [<engine-specific-skill>?, drizzle-expert?]
  schema_changes:
    tables_affected: [<string>]
    migration_plan: <string>
    rollback_plan: <string>
  query_optimization:
    queries_reviewed: <number>
    indexes_recommended: [<string>] | []
  doc_impact: none | tech | rules | both
  integrity_checks: [<string>]
  follow_up_items: [<string>] | []
```