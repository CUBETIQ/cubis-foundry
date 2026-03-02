# Supabase — Query Performance and Connection Operations

## Query optimization workflow

1. Identify slow queries via Supabase Dashboard → Database → Query Performance (uses `pg_stat_statements`).
2. Run `EXPLAIN (ANALYZE, BUFFERS)` on the slow query to read the actual plan.
3. Check for: `Seq Scan` on large tables, `Sort` without index, high `Rows Removed by Filter` ratio.
4. Add targeted index and re-test.

```sql
-- From the SQL editor in Supabase Dashboard
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders WHERE user_id = 'abc' ORDER BY created_at DESC LIMIT 20;
```

## Database Advisors

Supabase runs automated advisors that flag common issues. Check Dashboard → Database → Advisors for:
- **Unused indexes**: indexes with zero scans — drop them.
- **Unindexed foreign keys**: FKs without an index cause full scans on joins and cascades.
- **Seq scans on large tables**: tables being full-scanned when an index would help.
- **Bloated tables**: high dead tuple ratio — may need `VACUUM`.

```sql
-- Manual unused index check
SELECT schemaname, relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public'
ORDER BY relname;
```

## Connection modes and when to use each

Supabase provides three connection methods:

| Mode | How | Use for |
| --- | --- | --- |
| **Direct** | `postgresql://...` port 5432 | Long-lived connections (background jobs, migrations) |
| **Transaction pooler** (PgBouncer) | Port 6543 | Serverless functions, edge functions, short-lived requests |
| **Session pooler** | Port 5432 alt | When you need session-level features (prepared statements, `SET`) |

**Serverless / Edge Functions**: always use the transaction pooler (6543). Direct connections from serverless cold starts exhaust Postgres connection limits fast.

```ts
// Supabase JS — uses transaction pooler automatically when using the client library
const supabase = createClient(url, anonKey);

// Direct connection for migrations / background jobs (Prisma, Drizzle, etc.)
DATABASE_URL=postgresql://user:pass@db.xxx.supabase.co:5432/postgres
// Transaction pooler for Prisma in serverless
DATABASE_URL=postgresql://user:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true
```

## Prepared statements and pooling

PgBouncer in transaction mode does **not** support prepared statements — they are per-session. If your ORM uses prepared statements (Prisma does by default):

```
# Prisma — disable prepared statements when using transaction pooler
DATABASE_URL="...?pgbouncer=true&connection_limit=1"
# Or in schema.prisma:
datasource db {
  url = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  # direct connection for migrations
}
```

## Realtime performance considerations

Supabase Realtime uses Postgres logical replication. High-volume tables with Realtime enabled generate significant WAL traffic.

- Enable Realtime only on tables that clients actually subscribe to.
- Filter subscriptions as tightly as possible: `channel.on('postgres_changes', { filter: 'user_id=eq.123' }, ...)`.
- Monitor replication slot lag in Dashboard → Database → Replication.

## Extensions useful for performance

```sql
-- Query statistics (enabled by default in Supabase)
SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;

-- Index usage stats
SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan ASC;

-- Table bloat estimate
SELECT relname, n_dead_tup, n_live_tup, last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

## Sources
- Query optimization guide: https://supabase.com/docs/guides/database/query-optimization
- Database advisors: https://supabase.com/docs/guides/database/database-advisors
- Connecting to Postgres (poolers): https://supabase.com/docs/guides/database/connecting-to-postgres
- pg_stat_statements: https://www.postgresql.org/docs/current/pgstatstatements.html
