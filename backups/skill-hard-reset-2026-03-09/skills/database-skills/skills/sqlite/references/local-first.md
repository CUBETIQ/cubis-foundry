# SQLite — Local-First Design

## When SQLite is the right fit

SQLite is the right choice when:
- Each user has their own private data (mobile app, desktop app, browser extension, edge function).
- The application needs to work offline with local durability.
- Data sync is done at the application layer, not the database layer.
- Simplicity and zero-configuration matter.

SQLite is **not** the right fit for:
- High-concurrency write workloads with multiple simultaneous writers.
- Data shared across multiple users in real-time (use Postgres or MySQL instead).
- Analytics on large datasets (use ClickHouse or DuckDB instead).

## Journal modes — choose WAL for mobile/desktop

The default Rollback Journal blocks all reads during a write. Switch to WAL (Write-Ahead Log) for concurrent reads:

```sql
PRAGMA journal_mode = WAL;
-- Persist across connections (set once after DB creation)
```

WAL mode allows:
- Multiple simultaneous readers while a write is in progress.
- Reads don't block writes; writes don't block reads.
- Slightly better write performance for sequential inserts.

Set `PRAGMA synchronous = NORMAL` with WAL (safe default, faster than `FULL`):
```sql
PRAGMA synchronous = NORMAL;
```

## Migration patterns

Migrations must be deterministic and reversible. Use a migrations table to track applied versions:

```sql
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Migration rules:
- **Never modify an applied migration** — create a new one instead.
- **Always test on real device storage** — SD cards, old iPhones, and constrained flash behave differently than dev machines.
- **Include a down migration** (rollback SQL) alongside every up migration.
- Run migrations inside a transaction so partial failure is safe:
  ```sql
  BEGIN;
  -- migration SQL here
  INSERT INTO _migrations (id, name) VALUES (3, 'add_notes_column');
  COMMIT;
  ```

## Multi-device sync and conflict handling

SQLite has no built-in sync. Design conflict handling explicitly before writing any app code.

Common strategies:
- **Last-write-wins (LWW)**: each row has `updated_at`. On sync, higher timestamp wins. Simple but loses concurrent edits.
- **CRDTs**: use conflict-free replicated data types for counters, sets, and ordered lists. Complex but correct.
- **Event sourcing**: store immutable event log, derive state. Sync events instead of rows.
- **Vector clocks**: each device has a logical clock; merge based on causal ordering.

Always include a `sync_id` (UUID, globally unique) and `device_id` on every synced row. Never rely on local SQLite `ROWID` or autoincrement as a sync key.

## Offline-first checklist

- [ ] WAL mode enabled on database open.
- [ ] All writes go through a local queue that syncs when connectivity is available.
- [ ] Conflict resolution strategy defined before writing sync logic.
- [ ] Migrations run before any app reads/writes.
- [ ] Migration history table exists.
- [ ] UI shows sync status (pending, syncing, error).
- [ ] Sync tested under: airplane mode, partial connectivity, app killed mid-sync.

## Appropriate use cases

| Use | Verdict |
| --- | --- |
| Mobile app local data | ✅ Excellent |
| Desktop app settings and cache | ✅ Excellent |
| Embedded IoT / edge data | ✅ Excellent |
| Read-heavy web server cache | ✅ Good (read-only or low-write) |
| Multi-user web app backend | ❌ Use Postgres |
| High-concurrency writes | ❌ Use Postgres or MySQL |

## Sources
- SQLite appropriate uses: https://sqlite.org/whentouse.html
- Atomic commit behavior: https://sqlite.org/atomiccommit.html
- WAL mode: https://sqlite.org/wal.html
