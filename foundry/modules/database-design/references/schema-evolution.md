# Schema Evolution

Load this when planning database migrations, zero-downtime schema changes, column renames, data type changes, or expand-contract migration patterns.

## Expand-contract migration pattern

The expand-contract pattern enables zero-downtime schema changes by separating structural changes from application code changes.

### Phase 1: Expand (add new, keep old)

```sql
-- Add new column as nullable (no application change needed)
ALTER TABLE users ADD COLUMN display_name VARCHAR(100);
```

### Phase 2: Migrate data

```sql
-- Backfill the new column from the old column
UPDATE users SET display_name = name WHERE display_name IS NULL;
```

### Phase 3: Switch application code

Deploy application code that reads from and writes to `display_name` instead of `name`. Both columns coexist during this phase.

### Phase 4: Contract (remove old)

```sql
-- After verifying all reads/writes use the new column
ALTER TABLE users DROP COLUMN name;
```

- Never combine expand and contract in a single deployment. The old application version must work with the expanded schema.
- Backfill large tables in batches to avoid long-running transactions and table locks.

## Safe column operations

### Adding a column

```sql
-- Safe: nullable column with no default (instant in PostgreSQL 11+)
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);

-- Safe in PostgreSQL 11+: column with a constant default (instant, no table rewrite)
ALTER TABLE orders ADD COLUMN priority INT NOT NULL DEFAULT 0;

-- Unsafe in older PostgreSQL: column with volatile default (rewrites entire table)
-- ALTER TABLE orders ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();  -- TABLE REWRITE
```

### Renaming a column

Never rename a column in a single step. Use expand-contract:

1. Add new column.
2. Backfill new column.
3. Deploy application code using new column.
4. Drop old column.

Direct `ALTER TABLE RENAME COLUMN` breaks any running application code that references the old name.

### Changing a column type

```sql
-- Safe widening: VARCHAR(50) -> VARCHAR(200) (no table rewrite)
ALTER TABLE users ALTER COLUMN name TYPE VARCHAR(200);

-- Unsafe narrowing: VARCHAR(200) -> VARCHAR(50) (may truncate data, rewrites table)
-- Never do this without first verifying MAX(LENGTH(name)) < 50

-- Safe: INT -> BIGINT (requires table rewrite in PostgreSQL, plan for downtime or use a new column)
-- Prefer: add a new BIGINT column, backfill, switch application code, drop old column
```

### Dropping a column

```sql
-- Step 1: Stop application code from reading/writing the column
-- Step 2: Wait one deployment cycle to confirm no code references it
-- Step 3: Drop the column
ALTER TABLE users DROP COLUMN legacy_field;
```

- PostgreSQL marks dropped columns as invisible but does not reclaim space until VACUUM FULL or table rewrite.
- Dropping a column is instant and does not lock the table.

## Migration script structure

```sql
-- migrations/20250315_001_add_user_status.sql

-- UP
BEGIN;

CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
ALTER TABLE users ADD COLUMN status user_status NOT NULL DEFAULT 'active';
CREATE INDEX CONCURRENTLY ix_users_status ON users (status);

COMMIT;

-- DOWN
BEGIN;

DROP INDEX IF EXISTS ix_users_status;
ALTER TABLE users DROP COLUMN IF EXISTS status;
DROP TYPE IF EXISTS user_status;

COMMIT;
```

- Every migration must have both UP and DOWN sections.
- Use `IF EXISTS` and `IF NOT EXISTS` in DOWN migrations to make them idempotent.
- Use `CREATE INDEX CONCURRENTLY` to avoid locking the table during index creation (cannot be inside a transaction — run separately).

## Batched data migrations

Large data updates must be batched to avoid long-running transactions that block other queries.

```sql
-- Backfill 50,000 rows at a time
DO $$
DECLARE
  batch_size INT := 50000;
  affected INT;
BEGIN
  LOOP
    UPDATE users
    SET status = 'active'
    WHERE status IS NULL
      AND id IN (
        SELECT id FROM users WHERE status IS NULL LIMIT batch_size
      );

    GET DIAGNOSTICS affected = ROW_COUNT;
    RAISE NOTICE 'Updated % rows', affected;
    EXIT WHEN affected = 0;

    COMMIT;
    PERFORM pg_sleep(0.5);  -- yield to other transactions
  END LOOP;
END $$;
```

- Batch sizes of 10,000-100,000 are typical depending on row width and I/O capacity.
- Include a `pg_sleep` between batches to reduce I/O pressure on the production system.
- Monitor replication lag if running against a primary with replicas.

## Enum evolution

Adding values to PostgreSQL enums is safe. Removing or renaming values is not.

```sql
-- Safe: add a new value (no table rewrite)
ALTER TYPE user_status ADD VALUE 'archived';

-- Safe: add a value in a specific position
ALTER TYPE user_status ADD VALUE 'pending' BEFORE 'active';

-- Unsafe: cannot remove or rename enum values directly
-- Workaround: create a new enum, migrate data, swap columns, drop old enum
```

## Constraint changes

```sql
-- Adding a NOT NULL constraint requires all existing rows to satisfy it
-- Step 1: Backfill NULLs
UPDATE orders SET status = 'pending' WHERE status IS NULL;

-- Step 2: Add constraint with validation
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;

-- For large tables, use NOT VALID to skip validation, then validate separately
ALTER TABLE orders ADD CONSTRAINT chk_status_not_null CHECK (status IS NOT NULL) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT chk_status_not_null;
```

- `NOT VALID` adds the constraint without scanning existing rows (instant).
- `VALIDATE CONSTRAINT` scans the table but allows concurrent reads and writes.
- This two-step approach avoids locking the table during constraint addition.

## Foreign key addition on existing tables

```sql
-- Adding a foreign key locks both tables while validating
-- For large tables, use NOT VALID + VALIDATE
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
  NOT VALID;

ALTER TABLE orders VALIDATE CONSTRAINT fk_orders_user;
```

## Migration testing checklist

1. Run the UP migration against a copy of production data.
2. Run the DOWN migration and verify the schema returns to its previous state.
3. Run the UP migration again to confirm idempotency.
4. Measure execution time on production-sized data.
5. Check for table locks using `pg_locks` during migration execution.
6. Verify that the application works with both the old and new schema (during the expand phase).
