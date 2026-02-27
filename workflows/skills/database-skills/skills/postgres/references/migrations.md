# Postgres — Database Migrations

## Core principles

- Migrations must be **idempotent** where possible — safe to run more than once.
- Migrations must be **reversible** — always write a down migration.
- Every migration runs inside a transaction (unless it contains commands that can't be transactional, like `CREATE INDEX CONCURRENTLY`).
- Test on a staging environment with a recent production data dump before production.

## Migration table (simple self-managed setup)

```sql
CREATE TABLE IF NOT EXISTS _migrations (
  id      SERIAL PRIMARY KEY,
  name    TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Zero-downtime migration pattern (additive-first)

Never make breaking schema changes in the same deploy as the application code that depends on them. Expand, then contract.

### Phase 1: Expand (add without breaking)
```sql
-- Add new nullable column — safe, no lock, app can read NULL for old rows
ALTER TABLE orders ADD COLUMN notes TEXT;

-- Add new index concurrently — no write lock
CREATE INDEX CONCURRENTLY idx_orders_notes ON orders (notes) WHERE notes IS NOT NULL;
```

### Phase 2: Backfill (populate data)
```sql
-- Backfill in batches — never in one big UPDATE that locks the table
DO $$
DECLARE batch_size INT := 1000;
        last_id BIGINT := 0;
BEGIN
  LOOP
    UPDATE orders SET notes = '' WHERE id > last_id AND notes IS NULL
    RETURNING id INTO last_id;
    EXIT WHEN NOT FOUND;
    PERFORM pg_sleep(0.01);  -- brief pause between batches
  END LOOP;
END $$;
```

### Phase 3: Constrain (enforce, after app deploys)
```sql
-- Add NOT NULL only after backfill is complete and app always sets notes
-- Use VALIDATE CONSTRAINT to avoid a long table lock
ALTER TABLE orders ADD CONSTRAINT orders_notes_not_null CHECK (notes IS NOT NULL) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_notes_not_null;
-- Later, replace with actual NOT NULL (requires table rewrite — schedule maintenance)
ALTER TABLE orders ALTER COLUMN notes SET NOT NULL;
```

## Safe vs unsafe DDL

| Operation | Safe online? | Notes |
| --- | --- | --- |
| Add nullable column | ✅ | Instant in Postgres 11+ |
| Add NOT NULL column with DEFAULT | ✅ Postgres 11+ | Older versions rewrite table |
| Drop column | ✅ | Marks column invisible; no immediate rewrite |
| Add index | ❌ (blocks writes) | Use `CREATE INDEX CONCURRENTLY` |
| Add UNIQUE constraint | ❌ | Create unique index concurrently first, then `ADD CONSTRAINT ... USING INDEX` |
| Rename column | ⚠️ | Breaking change — requires multi-phase deploy |
| Change column type | ❌ | Usually needs table rewrite; use additive approach |
| Drop table | ❌ | Irreversible without backup; ensure app no longer references it |

## CREATE INDEX CONCURRENTLY

The only way to add an index without blocking writes:

```sql
-- Run outside a transaction block (psql \c or separate connection)
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders (user_id);
```

Caveats:
- Cannot run inside a transaction.
- Takes longer than regular `CREATE INDEX`.
- If it fails, leaves an `INVALID` index — drop it and retry:
  ```sql
  DROP INDEX CONCURRENTLY idx_orders_user_id;
  ```

## Renaming — multi-phase deploy

Never rename a column in a single deploy. The app will break.

```
Phase 1: Add new column, dual-write in app to both old and new.
Phase 2: Backfill new column from old.
Phase 3: Deploy app to read from new column only.
Phase 4: Remove old column.
```

## Migration tools

| Tool | Language | Notes |
| --- | --- | --- |
| **Flyway** | Java / CLI | SQL-based, version numbered, popular in enterprise |
| **Liquibase** | Java / CLI | XML/YAML/SQL, rollback built in |
| **golang-migrate** | Go / CLI | Simple, SQL-based, widely used in Go projects |
| **Alembic** | Python | SQLAlchemy-integrated, autogenerate support |
| **Prisma Migrate** | Node.js | Generates SQL from schema diff, dev-friendly |
| **Drizzle** | Node.js | TypeScript-first, explicit SQL migrations |

For any tool: always store migration files in version control and review them in PRs.

## Production checklist before running a migration

- [ ] Tested on staging with production data size.
- [ ] Estimated lock duration checked (`EXPLAIN` or timing on staging).
- [ ] `CREATE INDEX CONCURRENTLY` used for any new indexes.
- [ ] Down migration written and tested.
- [ ] Monitoring dashboard open during migration.
- [ ] Rollback plan documented.
- [ ] Maintenance window scheduled if migration is non-online.

## Sources
- ALTER TABLE: https://www.postgresql.org/docs/current/sql-altertable.html
- CREATE INDEX CONCURRENTLY: https://www.postgresql.org/docs/current/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY
- Zero-downtime schema changes: https://www.postgresql.org/docs/current/ddl-alter.html
