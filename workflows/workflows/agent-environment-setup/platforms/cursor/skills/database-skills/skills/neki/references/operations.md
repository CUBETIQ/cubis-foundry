# Neki — Operational Guidance

> **Status as of early 2026**: Neki is pre-GA. All operational assumptions are provisional. Re-verify behavior after each preview or doc update from PlanetScale.

## Migration planning principles

### Keep it reversible

- Schema migrations should use online, non-blocking patterns (e.g., additive changes first, then backfill, then constraint).
- Never cut data into Neki from a single-node Postgres setup without a proven rollback path to the original.
- Stage the migration: dev → staging with production-like data → production with canary traffic.

### Test with production-like data volume

Behavior under 100K rows can be dramatically different at 100M rows. Before committing:
1. Restore a production snapshot to a staging Neki environment.
2. Run your full query workload against it.
3. Measure cross-shard scatter rate, latency p99, and aggregation performance.
4. Validate that all queries include the shard key.

### Platform lock-in decision criteria

Only commit to Neki when:
- Benchmark results on Neki staging match or exceed your current single-node Postgres.
- All high-QPS query paths are shard-key-scoped (no unresolved scatter queries).
- Application code connects via standard Postgres driver with no sharding logic — confirm no changes needed.
- A rollback path is documented and tested.

## Connection setup

Neki exposes a standard Postgres protocol endpoint. Connect the same way as any managed Postgres service:

```
host: <your-neki-host>
port: 5432
sslmode: require    (always use TLS in production)
```

No special driver needed. Use standard `pg`, `psycopg2`, `pgx`, etc.

## Schema change workflow in Neki

> Full DDL behavior docs pending GA. Apply conservative practices:

1. **Additive changes first**: add nullable columns without defaults before backfill-and-constrain.
2. **Online migrations**: use tools like `pg-osc` patterns — shadow table, backfill, atomic cutover.
3. **Test on staging** with a representative data subset before production.
4. **Monitor replication lag** during migrations — pause if lag grows unexpectedly.

## Monitoring

While Neki-specific observability tooling is not yet documented, apply standard Postgres monitoring:

```sql
-- Active connections and query state
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- Slow queries (requires pg_stat_statements extension)
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

Additionally at the Neki platform level:
- Monitor per-shard query distribution — uneven distribution suggests a poor shard key choice.
- Track cross-shard query rate — high scatter rate is a signal to revisit schema or query design.

## Guardrails

- **Never run destructive operations** (`DROP TABLE`, `TRUNCATE`, mass `DELETE`) without explicit user confirmation and a verified backup.
- **Avoid long-running transactions** — they block vacuum/maintenance on affected shards.
- **Validate before lock-in**: run a full workload benchmark on production-like data before treating Neki as the primary datastore.

## Sources
- Neki product page: https://www.neki.dev/
- PlanetScale announcement: https://planetscale.com/blog/announcing-neki
