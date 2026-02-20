# Vitess — Online DDL and Operational Safety

## Online DDL strategies

Vitess manages schema changes as tracked, non-blocking, revertible migrations. This is the **only recommended approach** for production schema changes.

Set DDL strategy per session or globally:
```sql
SET @@ddl_strategy = 'vitess';
```

| Strategy | Description |
| --- | --- |
| `vitess` (**recommended**) | VReplication-based. Non-blocking, revertible, failover-safe. |
| `online` | Alias for `vitess`. |
| `mysql` | Native MySQL DDL managed by Vitess scheduler. Blocking depends on the DDL. |
| `direct` | Unmanaged — direct DDL to MySQL. Not trackable. Avoid in production. |

## Running a migration

```sql
SET @@ddl_strategy = 'vitess';
ALTER TABLE orders ADD COLUMN notes TEXT;   -- returns migration UUID immediately
```

```bash
vtctldclient ApplySchema --ddl-strategy "vitess" \
  --sql "ALTER TABLE orders ADD COLUMN notes TEXT" commerce
```

## Migration lifecycle

```
queued → ready → running → complete
                         ↘ failed
         ↘ cancelled
```

## Monitor and control migrations

```sql
SHOW VITESS_MIGRATIONS;                                         -- all migrations
SHOW VITESS_MIGRATIONS LIKE '<uuid>';                           -- specific migration
```

Key columns to watch: `migration_status`, `progress`, `started_timestamp`, `completed_timestamp`, `message`.

```sql
ALTER VITESS_MIGRATION '<uuid>' CANCEL;    -- cancel pending
ALTER VITESS_MIGRATION '<uuid>' RETRY;     -- retry failed
ALTER VITESS_MIGRATION '<uuid>' COMPLETE;  -- complete a postponed migration
ALTER VITESS_MIGRATION '<uuid>' LAUNCH;    -- launch a postponed migration
REVERT VITESS_MIGRATION '<uuid>';          -- revert a completed migration (non-destructive)
```

## Key DDL strategy flags

Append flags to strategy string:
```sql
SET @@ddl_strategy = 'vitess --postpone-completion --allow-concurrent';
```

| Flag | Effect |
| --- | --- |
| `--postpone-launch` | Queue migration but don't start automatically |
| `--postpone-completion` | Run migration but don't cut over — you control timing |
| `--allow-concurrent` | Allow multiple migrations to run simultaneously |
| `--declarative` | Provide desired `CREATE TABLE`; Vitess computes the ALTER |
| `--prefer-instant-ddl` | Use MySQL INSTANT DDL when possible |
| `--singleton` | Only one migration on this table at a time |

## Declarative migrations

Supply the desired schema; Vitess computes the diff and runs the minimal ALTER:
```sql
SET @@ddl_strategy = 'vitess --declarative';
CREATE TABLE demo (id BIGINT UNSIGNED NOT NULL, status VARCHAR(32), PRIMARY KEY (id));
```

## Throttling and failover safety

- The **tablet throttler** automatically slows migrations when replication lag is high.
  Enable: `vtctldclient UpdateThrottlerConfig --enable <keyspace>`
- VReplication-based migrations **auto-resume** after primary reparenting (new primary must come up within 10 min).

## Operational guardrails

- **Stage topology and resharding changes** in maintenance windows; keep blast radius small per operation.
- **Watch fan-out and replication lag** as release gates — do not proceed if lag is elevated.
- **Prepare explicit rollback procedures per shard move**: `MoveTables SwitchTraffic --reverse`, then `MoveTables Complete` on the old keyspace.
- Validate with `VDiff` before completing table moves: `vtctldclient VDiff <keyspace> <workflow>`.
- Test resharding end-to-end on staging with production-like data volume before production.

## Best practices

1. Always use `vitess` strategy in production — never `direct`.
2. Use `--postpone-completion` for critical tables to control cut-over timing precisely.
3. Enable the tablet throttler to prevent replication lag buildup.
4. Use declarative migrations for desired-state schema management.
5. Monitor all running migrations with `SHOW VITESS_MIGRATIONS` before and after deployments.

## Sources
- Online DDL guide: https://vitess.io/docs/user-guides/schema-changes/
- VReplication reference: https://vitess.io/docs/reference/vreplication/
- Release notes / lifecycle: https://vitess.io/docs/releases/
