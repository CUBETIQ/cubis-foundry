# Postgres — Schema Design and Indexing

## Schema design

- Declare `NOT NULL` on every column that should never be null; reduces planner uncertainty and storage overhead.
- Use `CHECK` constraints for domain rules (`amount > 0`, `status IN (...)`) — they are enforced transactionally and inform the planner.
- Use `FOREIGN KEY` constraints for referential integrity; add indexes on FK columns to prevent sequential scans during cascades and joins.
- Prefer `BIGINT` generated identity columns or UUIDs (v7 for sortability) as primary keys. Avoid random UUIDs as clustered keys on write-heavy tables — they fragment B-tree pages.
- Use `TEXT` over `VARCHAR(n)` unless you need the length constraint enforced at the DB layer.
- Prefer `TIMESTAMPTZ` over `TIMESTAMP` for all time columns.

## Index types and when to use them

| Type | When to use |
| --- | --- |
| **B-tree** (default) | Equality, range, `ORDER BY`, `LIKE 'prefix%'` |
| **GIN** | JSONB containment (`@>`), full-text search, array overlap (`&&`) |
| **GiST** | Geometric types, range type overlap, nearest-neighbor search |
| **BRIN** | Append-mostly tables (time-series, logs) with high physical correlation |
| **Hash** | Pure equality lookups only (`=`), smaller than B-tree |

## Multicolumn (composite) indexes

- Column order matters: place equality predicates first, then range/sort columns.
- The planner can use a composite index for any leading prefix of its columns.
- Example: `(status, created_at)` supports `WHERE status = 'open' ORDER BY created_at` but NOT `WHERE created_at > ...` alone without a full scan.

```sql
CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC);
```

## Partial indexes

- Index only the rows that queries actually need — dramatically smaller, faster to update.
- Use when a hot query always includes a constant predicate.

```sql
-- Only index unpaid invoices, avoiding index bloat from millions of paid rows
CREATE INDEX idx_invoices_unpaid ON invoices (due_date) WHERE paid = false;
```

## Covering indexes (INCLUDE)

- Add non-predicate columns to the index to allow index-only scans (no heap fetch).
- Put predicate columns in the key; put projection-only columns in `INCLUDE`.

```sql
CREATE INDEX idx_orders_user_covering ON orders (user_id, status)
INCLUDE (total_amount, created_at);
```

## BRIN for append-mostly tables

- Works by storing min/max per block range. Tiny index size, fast sequential insans.
- Best when table rows are physically written in correlation with the indexed column (e.g., `created_at` on an append-only event table).
- Useless for randomly ordered data.

```sql
CREATE INDEX idx_events_created_brin ON events USING BRIN (created_at);
```

## Index maintenance rules

- Run `ANALYZE` after large data loads to refresh planner statistics.
- Detect unused indexes:
  ```sql
  SELECT schemaname, relname, indexrelname, idx_scan
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0;
  ```
- Drop unused indexes — they slow writes and increase vacuum cost.
- Use `CREATE INDEX CONCURRENTLY` in production to avoid table locks.

## Sources
- PostgreSQL docs: Indexes — https://www.postgresql.org/docs/current/indexes.html
- Multicolumn: https://www.postgresql.org/docs/current/indexes-multicolumn.html
- Partial: https://www.postgresql.org/docs/current/indexes-partial.html
- Covering (INCLUDE): https://www.postgresql.org/docs/current/sql-createindex.html
- BRIN: https://www.postgresql.org/docs/current/brin.html
