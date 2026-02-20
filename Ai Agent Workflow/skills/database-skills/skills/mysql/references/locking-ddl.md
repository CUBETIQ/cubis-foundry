# MySQL — Locking and DDL Safety

## Online DDL algorithms

MySQL InnoDB can perform many DDL operations without blocking reads/writes. Always check the algorithm before running in production.

| Algorithm | Write impact | When used |
| --- | --- | --- |
| `INSTANT` | None | Adding nullable columns at end (MySQL 8.0+), some metadata-only |
| `INPLACE` | No copy; may block briefly at start/end | Most index adds, some column modifications |
| `COPY` | Full table rewrite; blocks writes for duration | Changing primary key, column type changes, some charset changes |

Check before applying:
```sql
ALTER TABLE orders ADD COLUMN notes TEXT, ALGORITHM=INPLACE, LOCK=NONE;
-- If MySQL rejects it, it needs COPY → use pt-online-schema-change or gh-ost
```

Force dry-run check without applying:
```sql
-- Will error if it can't do INPLACE, without touching the table
ALTER TABLE orders ADD INDEX idx_test (status), ALGORITHM=INPLACE, LOCK=NONE;
```

## Metadata lock (MDL) exposure

DDL acquires a Metadata Lock on the table. Even an `INSTANT` or `INPLACE` operation blocks if a long-running transaction or idle connection holds a conflicting MDL.

```sql
-- Check for MDL waiters and holders before running DDL
SELECT r.trx_id waiting_trx_id, r.trx_mysql_thread_id waiting_thread,
       b.trx_id blocking_trx_id, b.trx_mysql_thread_id blocking_thread,
       b.trx_query blocking_query
FROM information_schema.innodb_lock_waits w
JOIN information_schema.innodb_trx b ON b.trx_id = w.blocking_trx_id
JOIN information_schema.innodb_trx r ON r.trx_id = w.requesting_trx_id;

-- Also check for long-running active transactions
SELECT * FROM information_schema.innodb_trx WHERE trx_started < NOW() - INTERVAL 30 SECOND;
```

Kill blockers with caution before DDL:
```sql
KILL <thread_id>;   -- kills connection, rolls back its transaction
```

## Replication lag impact

- `COPY` algorithm: full table rewrite flows through binary log as row events — replica must replay every row.
- `INPLACE` lock-free DDL: usually light on replicas.
- Monitor `Seconds_Behind_Master` / `Seconds_Behind_Source` during DDL.

```sql
-- On replica
SHOW REPLICA STATUS\G
-- Watch: Seconds_Behind_Source
```

## Online schema change tools

For tables too large or busy for native online DDL:
- **gh-ost** (GitHub): uses binlog streaming, minimal impact, best for production.
- **pt-online-schema-change** (Percona): trigger-based, established tooling.

Both create a shadow table, migrates data in background, then atomically cuts over with a brief lock.

## InnoDB row-level locking

- InnoDB locks rows, not tables (except DDL).
- `SELECT ... FOR UPDATE` takes exclusive row locks — keep duration short.
- `REPEATABLE READ` (default) uses **gap locks** to prevent phantom reads; causes more lock contention than `READ COMMITTED`.
- Switch to `READ COMMITTED` for high-contention OLTP workloads:
  ```sql
  SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
  ```

## Deadlock handling

```sql
-- Show last deadlock detail
SHOW ENGINE INNODB STATUS\G  -- search for LATEST DETECTED DEADLOCK

-- Enable deadlock logging
SET GLOBAL innodb_print_all_deadlocks = ON;
```

Prevention:
- Always access rows in a consistent order across transactions.
- Keep transactions short — do I/O and computation outside the transaction boundary.
- Retry with exponential backoff on error 1213 (`ER_LOCK_DEADLOCK`).

## MySQL release tracks

| Track | Description |
| --- | --- |
| **LTS** (e.g. 8.4, 9.7+) | Long-term support; production recommended |
| **Innovation** (8.1, 8.2, etc.) | Frequent releases with new features, shorter support window |

Check which features are available for your version before proposing DDL changes.

## Sources
- Online DDL operations: https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-operations.html
- InnoDB locking: https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html
- MySQL release tracks: https://dev.mysql.com/doc/refman/8.4/en/mysql-releases.html
