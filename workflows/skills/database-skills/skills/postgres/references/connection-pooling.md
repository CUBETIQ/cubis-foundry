# Postgres — Connection Pooling

## Why connection pooling is necessary

Postgres spawns one process per connection, each consuming ~5–10 MB of RAM. At 200+ direct connections:
- Memory pressure becomes significant.
- Context-switching overhead increases.
- Connection setup latency adds up (especially from serverless functions).

**Rule**: almost every Postgres deployment in production needs a connection pooler in front.

## PgBouncer — the standard choice

PgBouncer is a lightweight, battle-tested TCP proxy for Postgres.

### Pooling modes

| Mode | How it works | Use for |
| --- | --- | --- |
| **Transaction** (recommended) | A server connection is held only for the duration of a transaction | Stateless apps, serverless, most OLTP |
| **Session** | One server connection per client session until it disconnects | Apps that use session-level features (`SET`, `LISTEN`, advisory locks) |
| **Statement** | Returns connection after each statement | Only for apps that don't use multi-statement transactions — rare |

**Transaction mode caveat**: prepared statements are session-level in Postgres and break under transaction pooling. Use `pgbouncer_prepared_statements = 1` (PgBouncer 1.21+) or disable prepared statements in your client.

### Typical PgBouncer configuration (`pgbouncer.ini`)

```ini
[databases]
mydb = host=127.0.0.1 port=5432 dbname=mydb

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000        ; max connections from apps to PgBouncer
default_pool_size = 20        ; max actual Postgres connections per database/user pair
reserve_pool_size = 5         ; extra connections for spikes
reserve_pool_timeout = 3
server_idle_timeout = 600
log_connections = 0           ; disable in production (log noise)
```

### Pool sizing formula

```
default_pool_size ≈ (num_postgres_cpu_cores × 2) + num_spindle_disks
```

For a 4-core managed Postgres: target ~10–15 server connections. App instances × client threads → PgBouncer → bounded Postgres connections.

## Application-level connection pools

Even with PgBouncer, application clients should pool connections to PgBouncer (not open/close on each request).

### Node.js — `pg` / `node-postgres`

```ts
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,            // max connections from this app instance to PgBouncer
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
// Use pool.query() directly or pool.connect() for transactions
```

### Python — SQLAlchemy

```python
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,       # test connection health before use
    pool_recycle=3600,        # recycle connections every hour
)
```

### Prisma (Node.js)

```
# .env
DATABASE_URL="postgresql://user:pass@pgbouncer-host:6432/mydb?pgbouncer=true"
```

The `?pgbouncer=true` flag disables prepared statements, which is required for transaction pooling.

## Serverless / edge environments

Serverless functions open and close connections per invocation — disastrous for direct Postgres connections.

Options:
1. **PgBouncer in transaction mode** — each function call uses a pool connection only during its transaction.
2. **Supabase Transaction Pooler** — managed PgBouncer built into Supabase (port 6543).
3. **Neon serverless driver** — uses HTTP instead of TCP; no persistent connection overhead.

```ts
// Neon serverless (HTTP-based, no connection overhead)
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const orders = await sql`SELECT * FROM orders WHERE user_id = ${userId}`;
```

## Monitoring connections

```sql
-- Current connection breakdown
SELECT state, count(*) FROM pg_stat_activity GROUP BY state ORDER BY count DESC;

-- Waiting connections (lock or connection wait)
SELECT pid, state, wait_event_type, wait_event, query
FROM pg_stat_activity
WHERE wait_event IS NOT NULL;

-- Max connections setting
SHOW max_connections;

-- Current utilization rate
SELECT count(*) * 100.0 / current_setting('max_connections')::int AS pct_used
FROM pg_stat_activity;
```

Alert when `pct_used > 80%` — before you hit the limit.

## Common mistakes

| Mistake | Fix |
| --- | --- |
| No pooler in serverless | Add PgBouncer or use HTTP driver |
| `max_connections` set too high on Postgres | Lower it and pool instead |
| Prepared statements in transaction pool mode | Disable at driver level |
| App pool size > PgBouncer pool size | App waits; PgBouncer has no server connections left |
| No `pool_pre_ping` / health check | Stale connections fail silently |

## Sources
- PgBouncer documentation: https://www.pgbouncer.org/config.html
- PostgreSQL max_connections: https://www.postgresql.org/docs/current/runtime-config-connection.html
- Prisma PgBouncer guide: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases/postgresql#pgbouncer
