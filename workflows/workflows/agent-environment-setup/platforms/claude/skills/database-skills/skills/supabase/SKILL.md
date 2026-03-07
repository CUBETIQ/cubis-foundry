---
name: supabase
description: Supabase/Postgres patterns for RLS, indexing, query optimization, pooling, and safe migrations.
---

# Supabase

## Optimization workflow

1. Confirm RLS policy shape and index policy predicates.
2. Analyze query plans and use index advisor workflow.
3. Choose proper connection mode (direct/session/transaction pooler).
4. Use keyset pagination for heavy list endpoints.
5. Include migration/rollback with version-awareness (managed vs self-hosted differences).

## Indexing and RLS techniques

- Index columns referenced by RLS policies.
- Index join/filter columns used by API queries.
- Remove redundant indexes that inflate write cost.

## Pagination techniques

- Prefer keyset pagination on stable, indexed sort columns.
- Avoid blind offset scans on large tables.

## Operational guardrails

- Validate Supavisor mode based on runtime behavior.
- Confirm compatibility when moving between managed and self-hosted environments.

## References

- `references/rls-auth.md`
- `references/performance-operations.md`
