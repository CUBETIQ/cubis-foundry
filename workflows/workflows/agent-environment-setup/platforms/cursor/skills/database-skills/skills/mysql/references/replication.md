# MySQL — Replication

## Replication basics

MySQL replication streams changes from a **source** (primary) to one or more **replicas** (secondaries) using the **binary log (binlog)**.

Common setups:
- **Single primary + read replicas**: route writes to primary, reads to replicas.
- **Group Replication / InnoDB Cluster**: multi-primary with automatic failover.
- **Semi-sync**: primary waits for at least one replica to acknowledge before commit.

## Binary log formats

| Format | What it logs | Use for |
| --- | --- | --- |
| `ROW` (recommended) | Actual changed rows | Best consistency — exact row deltas |
| `STATEMENT` | SQL statements | Smaller binlog size, but non-deterministic functions (`NOW()`, `UUID()`) unsafe |  
| `MIXED` | Statement by default, row for unsafe statements | Compromise |

```sql
-- Check current format
SHOW VARIABLES LIKE 'binlog_format';

-- Set to ROW (recommended for most setups)
SET GLOBAL binlog_format = 'ROW';
```

## Check replication health

```sql
-- On replica
SHOW REPLICA STATUS\G

-- Key fields to monitor:
-- Seconds_Behind_Source       → replication lag in seconds (0 = caught up)
-- Replica_SQL_Running         → YES (must be YES)
-- Replica_IO_Running          → YES (must be YES)
-- Last_SQL_Error              → empty = no error
-- Last_IO_Error               → empty = no error
```

Alert when `Seconds_Behind_Source > N` where N depends on your acceptable staleness (typically < 30s for OLTP).

## GTID-based replication (MySQL 5.6+, recommended)

GTID (Global Transaction Identifier) gives every committed transaction a unique ID. Enables:
- Automatic failover without manually computing binlog coordinates.
- Easier replica promotion.

```ini
# my.cnf on source and all replicas
gtid_mode = ON
enforce_gtid_consistency = ON
```

```sql
-- Check GTID executed set on replica
SHOW GLOBAL VARIABLES LIKE 'gtid_executed';
-- Should match source's gtid_executed when fully caught up
```

## Read replica routing

Route reads to replicas only for **eventually consistent** reads — data on the replica may be seconds behind the source.

```ts
// Example: separate pools per role
const writePool = createPool({ host: PRIMARY_HOST });
const readPool = createPool({ host: REPLICA_HOST });

// Writes always go to primary
await writePool.query('INSERT INTO orders ...');

// Reads that can tolerate slight lag
const orders = await readPool.query('SELECT * FROM orders WHERE ...');
```

**Never** route reads to replica for:
- Reading immediately after a write in the same request ("read your own writes").
- Writes that depend on current state (check-and-set patterns).

## Replication lag and DDL impact

DDL with `COPY` algorithm generates a full table rewrite in the binlog — the replica must replay every row. This causes massive lag on large tables.

Best practices:
- Use `ALGORITHM=INPLACE, LOCK=NONE` for all DDL when possible.
- Schedule large `COPY`-algorithm DDL during off-peak.
- Monitor `Seconds_Behind_Source` during DDL and pause if lag grows.
- Consider gh-ost or pt-online-schema-change for zero-downtime DDL on replicas.

## Binlog retention

```sql
-- How long binlogs are kept (days)
SHOW VARIABLES LIKE 'binlog_expire_logs_seconds';  -- MySQL 8.0
SHOW VARIABLES LIKE 'expire_logs_days';            -- MySQL 5.7

-- Set retention (in seconds, MySQL 8.0)
SET GLOBAL binlog_expire_logs_seconds = 604800;   -- 7 days
```

Keep binlogs long enough to:
- Recover from a replica rebuild without a full dump.
- Support point-in-time recovery.
- Feed CDC (change data capture) consumers.

## Semi-synchronous replication

Prevents data loss on primary crash at the cost of slightly higher write latency.

```sql
-- Install and enable on source
INSTALL PLUGIN rpl_semi_sync_source SONAME 'semisync_source.so';
SET GLOBAL rpl_semi_sync_source_enabled = 1;

-- Install and enable on replica
INSTALL PLUGIN rpl_semi_sync_replica SONAME 'semisync_replica.so';
SET GLOBAL rpl_semi_sync_replica_enabled = 1;
```

With semi-sync: source waits for at least one replica ACK per commit. If no replica ACKs within `rpl_semi_sync_source_timeout` ms, falls back to async automatically.

## Monitoring replication in production

```sql
-- Source: check active replica connections
SHOW PROCESSLIST;  -- look for "Waiting for semi-sync ACK" or "Binlog Dump"

-- Replica: continuous lag check
SELECT lag.seconds_behind_source
FROM performance_schema.replication_applier_status_by_worker lag;

-- Source binlog position
SHOW BINARY LOG STATUS\G
-- File, Position — use for replica setup without GTID
```

## Sources
- Replication overview: https://dev.mysql.com/doc/refman/8.4/en/replication.html
- GTID-based replication: https://dev.mysql.com/doc/refman/8.4/en/replication-gtids.html
- Semi-sync replication: https://dev.mysql.com/doc/refman/8.4/en/replication-semisync.html
