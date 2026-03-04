---
command: "/database"
description: "Design or review schema, queries, and migrations with performance and integrity controls."
triggers: ["database", "sql", "schema", "migration", "index"]
---
# Database Workflow

## When to use
Use this when data modeling, query quality, migration safety, or database performance is core to the task.

## Routing
- Primary specialist: `@database-architect`
- Backend integration: `@backend-specialist`
- Verification support: `@test-engineer`
- Core skill hub: `database-skills`
- Companion skills: `database-design` (schema/migrations), `database-optimizer` (tuning/triage)
- Mobile/local persistence companion: `drift-flutter`
- Power bridge: `workflows/powers/database-skills`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `database-skills`, `database-design`
- Supporting skills (optional): `database-optimizer`
- Engine packs (sub-skills): `database-skills/postgres`, `database-skills/mysql`, `database-skills/vitess`, `database-skills/neki`, `database-skills/mongodb`, `database-skills/sqlite`, `database-skills/supabase`, `database-skills/redis`

## Workflow steps
1. Confirm data shape, access patterns, and workload size.
2. Choose track: `database-design` (schema/migrations), `database-optimizer` (tuning), or `database-skills` (engine wrappers).
3. Choose engine wrapper and define index strategy.
4. Define pagination strategy (keyset first, offset only if justified).
5. Plan migration and rollback.
6. Validate with query-plan evidence and production-risk notes.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Schema/query changes
- Indexing plan
- Pagination plan
- Migration + rollback plan
- Query-plan evidence (`EXPLAIN` or equivalent)
- Validation evidence
