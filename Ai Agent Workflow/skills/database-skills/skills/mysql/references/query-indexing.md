# MySQL — Query Optimization and Indexing

## EXPLAIN workflow

Always run `EXPLAIN` (or `EXPLAIN ANALYZE`) before and after index changes.

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;
EXPLAIN ANALYZE SELECT ...;  -- MySQL 8.0+: shows actual row counts and timing
```

Key columns to read:

| Column | Red flag |
| --- | --- |
| `type` | `ALL` = full table scan. Target: `ref`, `eq_ref`, `range`, or `const`. |
| `Extra` | `Using filesort` = no index satisfying ORDER BY. `Using temporary` = costly in-memory or on-disk sort. |
| `rows` | Estimated rows examined. Should be close to rows returned. |
| `key` | Which index MySQL chose. `NULL` = no index used. |

## Composite index design (leftmost prefix rule)

- Column order is critical: **equality predicates first, then range, then sort**.
- The planner can use any leading prefix of the index — trailing columns after a range stop being used.
- **Good**: `(status, user_id, created_at)` for `WHERE status = 'open' AND user_id = 42 ORDER BY created_at`.
- **Bad**: `(created_at, status)` for `WHERE status = 'open'` — planner must scan the whole index.

```sql
-- Supports: WHERE status = ? ORDER BY created_at
-- Supports: WHERE status = ? AND user_id = ?
CREATE INDEX idx_orders_status_user_created ON orders (status, user_id, created_at);
```

## Covering indexes

Include all selected columns in the index to avoid a heap row lookup (index-only read).

```sql
-- Query: SELECT status, total FROM orders WHERE user_id = 42
CREATE INDEX idx_orders_user_covering ON orders (user_id) INCLUDE (status, total);
-- Or in older MySQL without INCLUDE, use a composite key that covers the columns
```

Range predicates in the key stop the index from being used for subsequent columns — use `INCLUDE`-style or a separate index for those.

## Seek (cursor) pagination — avoid OFFSET

`OFFSET N` forces MySQL to scan and discard N rows. On large tables this is catastrophically slow.

```sql
-- BAD: OFFSET pagination
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 10000;

-- GOOD: Seek pagination using last seen ID
SELECT * FROM orders WHERE id > :last_seen_id ORDER BY id LIMIT 20;

-- For composite sort keys
SELECT * FROM orders
WHERE (created_at, id) < (:last_created_at, :last_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

## Function calls on indexed columns break index usage

```sql
-- BAD: function call prevents index use
SELECT * FROM users WHERE YEAR(created_at) = 2025;

-- GOOD: range predicate preserves index
SELECT * FROM users WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01';
```

## Index maintenance

```sql
-- Find unused indexes (after collecting stats for a while)
SELECT object_schema, object_name, index_name, count_read
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE count_read = 0 AND object_schema NOT IN ('mysql', 'sys', 'information_schema')
ORDER BY object_schema, object_name;

-- Check index sizes
SELECT table_name, index_name, stat_value * @@innodb_page_size / 1024 / 1024 AS size_mb
FROM mysql.innodb_index_stats
WHERE stat_name = 'size' AND database_name = DATABASE()
ORDER BY size_mb DESC;
```

- Drop indexes with `count_read = 0` — every index adds write and lock overhead.
- Use `ALTER TABLE ... ADD INDEX ..., ALGORITHM=INPLACE, LOCK=NONE` for online index changes.

## Key guardrails

- Avoid leading `%` in LIKE (`LIKE '%foo'`) — can't use a B-tree index.
- Avoid `OR` across different indexed columns — use `UNION ALL` instead.
- Avoid implicit type coercions in `WHERE` (e.g., `WHERE varchar_col = 123`) — breaks index usage.
- Batch large INSERTs (500–5000 rows per statement) to reduce per-statement overhead.

## Sources
- Using EXPLAIN: https://dev.mysql.com/doc/refman/8.4/en/using-explain.html
- Optimization and indexes: https://dev.mysql.com/doc/refman/8.4/en/optimization-indexes.html
- LIMIT/OFFSET optimization: https://dev.mysql.com/doc/refman/8.4/en/limit-optimization.html
- performance_schema index stats: https://dev.mysql.com/doc/refman/8.4/en/table-io-waits-summary-by-index-usage-table.html
