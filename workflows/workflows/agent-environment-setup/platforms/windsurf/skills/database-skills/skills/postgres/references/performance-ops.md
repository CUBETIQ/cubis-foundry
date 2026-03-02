# Postgres — Performance and Operations

## EXPLAIN workflow

Always baseline with `EXPLAIN (ANALYZE, BUFFERS)` before and after any change.

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;
```

Key things to read:
- **Actual vs estimated rows**: large mismatch → run `ANALYZE` on the table.
- **`Buffers: shared hit / read`**: high `read` → data not cached, I/O bound.
- **`Seq Scan`** on a large table with a filter → likely missing index.
- **`Hash Join` vs `Nested Loop`**: nested loop is fast with small inner set; hash join is better for large sets.
- **`Sort` + `Limit`**: if sorting before limiting, consider an index with matching sort order.

## pg_stat_statements

Tracks cumulative stats for every query shape. Use to find top queries by total time.

```sql
-- Enable once per cluster
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 queries by total execution time
SELECT query, calls, total_exec_time::int, mean_exec_time::int, rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Reset stats after tuning
SELECT pg_stat_statements_reset();
```

## ANALYZE — keeping planner stats fresh

Postgres uses per-column statistics (histograms, MCVs) to estimate row counts. Stale stats = bad plans.

```sql
ANALYZE orders;              -- single table
ANALYZE VERBOSE orders;      -- with output
ANALYZE;                     -- whole database
```

- `autovacuum` runs `ANALYZE` automatically when ~10% of rows change. For bulk loads, run manually.
- Increase `default_statistics_target` (default 100) for columns with skewed distribution:
  ```sql
  ALTER TABLE orders ALTER COLUMN status SET STATISTICS 500;
  ANALYZE orders;
  ```

## VACUUM and autovacuum

Postgres uses MVCC — dead tuples accumulate from UPDATEs and DELETEs. VACUUM reclaims them.

```sql
VACUUM orders;               -- reclaim dead tuples (non-blocking)
VACUUM ANALYZE orders;       -- reclaim + refresh stats
VACUUM FULL orders;          -- rewrite table, reclaims disk — needs exclusive lock, use cautiously
```

Signs of autovacuum not keeping up:
```sql
-- Tables with high dead tuple counts
SELECT relname, n_dead_tup, n_live_tup, last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

Tuning autovacuum for hot tables:
```sql
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.01,   -- default 0.2 — trigger earlier
  autovacuum_analyze_scale_factor = 0.005
);
```

## Connection pooling

Postgres spawns one process per connection. At ~200+ connections, overhead is significant.
- Use **PgBouncer** (transaction pooling) to multiplex app connections.
- Size pool to available CPU cores × 2–4. Monitor `pg_stat_activity`.

```sql
-- Active connections breakdown
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- Long-running queries
SELECT pid, now() - query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle' AND query_start < now() - interval '30 seconds';
```

## Lock monitoring

```sql
-- Blocked queries and what is blocking them
SELECT blocked.pid, blocked.query, blocking.pid AS blocking_pid, blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE cardinality(pg_blocking_pids(blocked.pid)) > 0;
```

## Key production guardrails

- Never run `VACUUM FULL` on a busy production table — takes an exclusive lock.
- Use `CREATE INDEX CONCURRENTLY` to avoid write blocks.
- Set `statement_timeout` and `lock_timeout` to prevent runaway queries from starving the system.
- Avoid long-open transactions — they block autovacuum and cause bloat.

## Sources
- EXPLAIN: https://www.postgresql.org/docs/current/using-explain.html
- pg_stat_statements: https://www.postgresql.org/docs/current/pgstatstatements.html
- ANALYZE: https://www.postgresql.org/docs/current/sql-analyze.html
- VACUUM / autovacuum: https://www.postgresql.org/docs/current/routine-vacuuming.html
