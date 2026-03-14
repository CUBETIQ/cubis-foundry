# Indexing Strategies

Load this when planning indexes, analyzing composite index column order, evaluating index types, or optimizing query performance through indexing.

## Index types in PostgreSQL

| Index Type | Best for | Example |
|---|---|---|
| B-tree (default) | Equality, range, sorting, BETWEEN | `CREATE INDEX ix_orders_date ON orders(created_at)` |
| Hash | Equality-only lookups (rare advantage over B-tree) | `CREATE INDEX ix_users_email ON users USING HASH (email)` |
| GIN | JSONB containment, full-text search, array overlap | `CREATE INDEX ix_data ON docs USING GIN (payload jsonb_path_ops)` |
| GiST | Geometric, range types, nearest-neighbor | `CREATE INDEX ix_locations ON places USING GIST (coordinates)` |
| BRIN | Very large, physically ordered tables (time-series) | `CREATE INDEX ix_events_time ON events USING BRIN (created_at)` |

- Default to B-tree unless the query pattern specifically benefits from another type.
- GIN indexes are larger and slower to update but excel at multi-value containment queries.
- BRIN indexes are tiny but only effective when physical row order correlates with the indexed column.

## Composite index column ordering

The order of columns in a composite index determines which queries it can serve.

### Rules

1. **Equality columns first** — columns used with `=` go before range columns.
2. **Most selective equality column first** — the column that filters out the most rows goes first.
3. **Range or sort column last** — columns used with `>`, `<`, `BETWEEN`, or `ORDER BY` go at the end.

### Example

```sql
-- Query: Find active orders for a user in the last 30 days
SELECT * FROM orders
WHERE user_id = 'abc' AND status = 'active' AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Optimal index: equality columns first, range column last
CREATE INDEX ix_orders_user_status_date
  ON orders (user_id, status, created_at DESC);

-- This index serves:
-- 1. WHERE user_id = X                          (uses first column)
-- 2. WHERE user_id = X AND status = Y           (uses first two columns)
-- 3. WHERE user_id = X AND status = Y AND created_at > Z  (uses all three)
-- 4. ORDER BY created_at DESC                   (when equality filters narrow first)

-- This index does NOT serve:
-- WHERE status = 'active'                        (skips first column)
-- WHERE created_at > Z                           (skips first two columns)
```

## Covering indexes (INCLUDE)

A covering index includes all columns the query needs, avoiding a heap table lookup.

```sql
-- Query: list order summaries for a user
SELECT id, status, total_amount, created_at FROM orders
WHERE user_id = 'abc' ORDER BY created_at DESC LIMIT 20;

-- Covering index: filter/sort columns in the index, extra columns in INCLUDE
CREATE INDEX ix_orders_user_cover ON orders (user_id, created_at DESC)
  INCLUDE (status, total_amount);
```

- INCLUDE columns are stored in the index leaf pages but not used for searching or sorting.
- Covering indexes trade disk space for read performance — use them on hot read paths.
- PostgreSQL 11+ supports INCLUDE on B-tree indexes.

## Partial indexes

A partial index only indexes rows that match a WHERE condition, reducing index size and write overhead.

```sql
-- Only index non-null assignees (30% of tasks are unassigned)
CREATE INDEX ix_tasks_assignee ON tasks (assignee_id)
  WHERE assignee_id IS NOT NULL;

-- Only index active subscriptions (80% are expired)
CREATE INDEX ix_subscriptions_active ON subscriptions (user_id, plan_id)
  WHERE status = 'active';

-- Only index recent events for fast dashboard queries
CREATE INDEX ix_events_recent ON events (tenant_id, created_at DESC)
  WHERE created_at > '2025-01-01';
```

- The query must include a WHERE clause that matches or is a subset of the partial index condition.
- Partial indexes on time-based conditions need periodic recreation as the boundary moves.

## Expression indexes

Index computed values when queries filter on expressions rather than raw columns.

```sql
-- Case-insensitive email lookup
CREATE UNIQUE INDEX ix_users_email_lower ON users (LOWER(email));

-- Query must use the same expression
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';

-- Extract and index a JSONB field
CREATE INDEX ix_orders_customer_name ON orders ((payload->>'customer_name'));
```

## Index maintenance checklist

### When to add an index

1. A query appears in slow query logs (> 100ms for transactional queries).
2. EXPLAIN ANALYZE shows Seq Scan on a table with > 10,000 rows.
3. A new feature introduces a query pattern not covered by existing indexes.

### When to remove an index

1. No query in the application uses the index (check `pg_stat_user_indexes` for scan counts).
2. The index duplicates another (a composite index on `(a, b)` makes a single-column index on `(a)` redundant).
3. Write throughput is degraded and the index serves only rare queries.

### Monitoring index usage

```sql
-- Find unused indexes
SELECT schemaname, relname, indexrelname, idx_scan, pg_size_pretty(pg_relation_size(i.indexrelid))
FROM pg_stat_user_indexes i
JOIN pg_index USING (indexrelid)
WHERE idx_scan = 0 AND NOT indisunique
ORDER BY pg_relation_size(i.indexrelid) DESC;

-- Find tables with missing indexes (sequential scans on large tables)
SELECT relname, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > 100 AND seq_tup_read > 100000
ORDER BY seq_tup_read DESC;
```

## Anti-patterns

- **Indexing every column** — each index slows down writes and consumes disk. Only index columns that appear in WHERE, JOIN, or ORDER BY clauses of frequent queries.
- **Wrong column order in composite index** — placing range columns before equality columns prevents the index from filtering efficiently.
- **Indexing low-cardinality columns alone** — a B-tree index on a boolean column (2 values) rarely helps because the planner chooses a Seq Scan when the index selectivity is too low.
- **Forgetting to ANALYZE after bulk loads** — PostgreSQL's planner relies on table statistics. After large INSERT or COPY operations, run `ANALYZE tablename` to update statistics.
