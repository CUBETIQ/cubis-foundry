# SQLite — Performance Techniques

## EXPLAIN QUERY PLAN

Always check the planner before optimizing.

```sql
EXPLAIN QUERY PLAN
SELECT * FROM orders WHERE user_id = 1 ORDER BY created_at DESC LIMIT 20;
```

Key output to read:
- `SCAN orders` = full table scan — missing or unused index.
- `SEARCH orders USING INDEX idx_orders_user (user_id=?)` = index seek — good.
- `USE TEMP B-TREE FOR ORDER BY` = sort can't use the index — add a covering index with the sort column.

## Index design

SQLite uses B-tree indexes. Same leftmost-prefix rules as other SQL databases.

```sql
-- Equality first, sort last
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);

-- Partial index for hot filtered subsets
CREATE INDEX idx_orders_pending ON orders (user_id, created_at)
WHERE status = 'pending';

-- Covering index: include projected columns to avoid table fetch
CREATE INDEX idx_orders_covering ON orders (user_id, status)
-- SQLite doesn't have INCLUDE, so list all needed columns in the key
```

SQLite does not support `INCLUDE` columns — put all needed columns in the key if you want index-only reads.

## Write performance — batch in transactions

Every `INSERT`/`UPDATE`/`DELETE` outside a transaction is its own `fsync`. For bulk operations this is catastrophically slow.

```sql
-- BAD: 1000 individual fsyncs
INSERT INTO logs VALUES (...);
INSERT INTO logs VALUES (...);
-- × 1000

-- GOOD: one fsync
BEGIN;
INSERT INTO logs VALUES (...);
INSERT INTO logs VALUES (...);
-- × 1000
COMMIT;
```

Rule of thumb: batch 100–10,000 rows per transaction. Benchmark for your hardware.

## WAL and checkpoint tuning

With WAL mode (see local-first.md), the WAL file grows until a checkpoint writes it back to the main DB file.

```sql
PRAGMA wal_autocheckpoint = 1000;   -- checkpoint after 1000 pages (default)
-- Lower = more frequent checkpoints (less WAL growth, slightly more I/O)
-- Higher = less frequent (better write throughput, larger WAL file)
```

Manual checkpoint before a backup:
```sql
PRAGMA wal_checkpoint(TRUNCATE);   -- flush WAL and truncate the file
```

## Memory and cache tuning

```sql
PRAGMA cache_size = -32000;    -- 32 MB page cache (negative = KB, default = 2MB)
PRAGMA mmap_size = 268435456;  -- 256 MB memory-mapped I/O (faster reads on large DBs)
PRAGMA temp_store = MEMORY;    -- keep temp tables in RAM instead of disk
```

Apply these after every `OPEN` — they are not persisted.

## Seek pagination

```sql
-- BAD: OFFSET scans and discards N rows
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 10000;

-- GOOD: seek on last seen id
SELECT * FROM orders WHERE id > :last_seen_id ORDER BY id LIMIT 20;
```

## Connection management (multi-threaded apps)

SQLite supports one writer at a time. For multi-threaded apps:
- Use a single write connection with serialized writes.
- Use a read connection pool (WAL mode allows concurrent readers).
- Set `PRAGMA busy_timeout = 5000` to wait instead of failing immediately on a locked DB:
  ```sql
  PRAGMA busy_timeout = 5000;   -- wait up to 5s before returning SQLITE_BUSY
  ```

## Sources
- EXPLAIN QUERY PLAN: https://sqlite.org/eqp.html
- Query planner: https://sqlite.org/queryplanner.html
- WAL mode: https://sqlite.org/wal.html
- PRAGMA reference: https://sqlite.org/pragma.html
