---
name: postgres
description: PostgreSQL schema, indexing, pagination, query optimization, migrations, and operations.
---

# Postgres

## Optimization workflow

1. Baseline query with `EXPLAIN (ANALYZE, BUFFERS)`.
2. Align index design to `WHERE + JOIN + ORDER BY` shape.
3. Prefer keyset pagination for deep lists.
4. Re-check planner stats (`ANALYZE`) and maintenance health (`VACUUM`, autovacuum behavior).
5. Validate with production-like data skew.

## Indexing techniques

- Multicolumn indexes for common combined predicates.
- Partial indexes for hot filtered subsets.
- `INCLUDE` columns for index-only scans.
- GIN for JSONB/search-like containment queries.
- BRIN for append-mostly time-series style tables.

## Pagination techniques

- Prefer seek pagination: `WHERE (sort_col, id) > (...) ORDER BY sort_col, id LIMIT n`.
- Keep deterministic ordering with unique tie-breakers.
- Use offset only for shallow pages.

## Performance guardrails

- Avoid unused indexes; they increase write and vacuum cost.
- Keep transactions short to reduce lock and bloat pressure.
- Validate any planner-sensitive change on realistic row counts.

## References

- `references/schema-indexing.md`
- `references/performance-ops.md`
