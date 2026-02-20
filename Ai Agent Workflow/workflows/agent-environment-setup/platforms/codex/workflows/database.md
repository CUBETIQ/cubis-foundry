---
command: "/database"
description: "Design or review schema, queries, and migrations with performance and integrity controls."
triggers: ["database", "sql", "schema", "migration", "index"]
---
# Database Workflow

Use this when data modeling, query quality, migration safety, or database performance is core to the task.

## Routing
- Primary specialist: `@database-architect`
- Backend integration: `@backend-specialist`
- Verification support: `@test-engineer`
- Core skill package: `database-skills`
- Power bridge: `Ai Agent Workflow/powers/database-skills`
- Engine wrappers: `postgres`, `mysql`, `vitess`, `neki`, `mongodb`, `sqlite`, `supabase`, `redis`

## Steps
1. Confirm data shape, access patterns, and workload size.
2. Choose engine wrapper and define index strategy.
3. Define pagination strategy (keyset first, offset only if justified).
4. Plan migration and rollback.
5. Validate with query-plan evidence and production-risk notes.

## Output Contract
- Schema/query changes
- Indexing plan
- Pagination plan
- Migration + rollback plan
- Query-plan evidence (`EXPLAIN` or equivalent)
- Validation evidence
