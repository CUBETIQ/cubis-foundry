---
name: sqlite
description: SQLite local/edge data strategy, schema/index design, query planning, and WAL tuning.
---

# SQLite

## Optimization workflow

1. Inspect plan with `EXPLAIN QUERY PLAN`.
2. Add multicolumn or covering indexes for hot read paths.
3. Use keyset-style pagination for large datasets.
4. Tune WAL/checkpoint behavior for write-heavy workloads.
5. Re-check plans after schema/data-distribution changes.

## Indexing techniques

- Composite indexes for combined filter+sort paths.
- Covering indexes when read latency is critical.
- Keep indexes minimal on write-heavy local stores.

## Pagination techniques

- Offset is acceptable for small tables and shallow lists.
- For large traversals, use deterministic keyset pagination.

## Operational guardrails

- Batch writes in explicit transactions.
- Use WAL mode for mixed read/write concurrency.
- Validate checkpoint strategy for mobile/edge IO limits.

## References

- `references/local-first.md`
- `references/performance.md`
