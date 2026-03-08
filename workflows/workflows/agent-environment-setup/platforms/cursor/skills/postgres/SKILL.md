---
name: "postgres"
description: "Use when the task is specifically PostgreSQL: schema design with Postgres features, query plans, indexes, JSONB, extensions, partitioning, logical replication, or managed Postgres operational tradeoffs."
license: MIT
metadata:
  version: "3.0.0"
  domain: "data"
  role: "specialist"
  stack: "postgres"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "stable"
  baseline: "modern postgres engineering"
  tags: ["postgres", "postgresql", "jsonb", "pgvector", "indexes", "partitioning"]
---

# Postgres

## When to use

- The engine is PostgreSQL or a managed Postgres product.
- The task depends on Postgres-specific features such as JSONB, partial indexes, CTEs, extensions, or partitioning.
- You need Postgres-aware migration, replication, or query-plan guidance.

## When not to use

- The database choice is still open and engine-neutral routing is enough.
- The real issue is general schema modeling rather than Postgres behavior.
- The workload is actually SQLite, MySQL, MongoDB, Redis, Vitess, or Supabase-specific.

## Core workflow

1. Confirm the Postgres variant, version, hosting model, and write/read shape.
2. Choose the smallest Postgres-specific feature set that solves the real workload.
3. Design indexes, constraints, and pagination from actual predicates and sort order.
4. Validate migrations and operational impact, including replication, locks, or extension constraints.
5. Re-check with `EXPLAIN` evidence and rollback notes before finalizing.

## Baseline standards

- Prefer plain relational design before reaching for JSONB or exotic features.
- Treat `EXPLAIN`, lock behavior, and index cost as part of every non-trivial change.
- Keep extension usage deliberate and portable only when portability matters.
- Make write amplification, autovacuum, and migration blast radius explicit.

## Avoid

- Using JSONB to avoid normal modeling without evidence.
- Adding indexes without predicate, join, or ordering evidence.
- Large blocking schema changes without a staged rollout.
- Treating every Postgres problem as a tuning problem instead of a workload-design problem.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/postgres-checklist.md` | You need a deeper Postgres checklist for indexes, JSONB, extensions, locking, partitioning, and migration safety. |
