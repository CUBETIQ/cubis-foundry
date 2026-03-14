# Migrations

Load this when creating, reviewing, or troubleshooting drizzle-kit migrations, push vs generate workflows, or migration chain management.

## drizzle.config.ts setup

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",  // Must export all tables
  out: "./drizzle/migrations",          // Migration output directory
  dialect: "postgresql",                // "postgresql" | "sqlite" | "mysql"
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,   // Fail on destructive changes without confirmation
});
```

### Configuration rules

- `schema` must point to a file that exports ALL table definitions. Missing exports = missing migrations.
- `out` is where migration SQL files are written. Commit this directory to version control.
- `dialect` must match your schema imports (`pg-core`, `sqlite-core`, `mysql-core`).
- Use `strict: true` to catch destructive changes (column drops, type changes) before they hit production.

## Generate vs Push

### `drizzle-kit generate` (production workflow)

```bash
# Generate migration SQL from schema changes
npx drizzle-kit generate

# Apply pending migrations
npx drizzle-kit migrate
```

- Creates versioned SQL files in the `out` directory.
- Each migration has a timestamp-based name and sequential ordering.
- Migration files are idempotent: they track which have been applied in a `__drizzle_migrations` table.
- Always review generated SQL before applying.

### `drizzle-kit push` (development only)

```bash
# Apply schema directly to database (no migration files)
npx drizzle-kit push
```

- Compares schema to live database and applies changes directly.
- No migration files generated. No rollback capability.
- Use ONLY for rapid prototyping and development databases.
- Never use push in CI or production pipelines.

## Migration workflow

### Step-by-step production workflow

```bash
# 1. Modify schema files
# Edit src/db/schema/users.ts

# 2. Generate migration
npx drizzle-kit generate

# 3. Review the generated SQL
cat drizzle/migrations/0005_add_role_column.sql

# 4. Edit if needed (add data migration, fix rollback)
# Edit the SQL file directly

# 5. Test locally
npx drizzle-kit migrate

# 6. Commit schema + migration files together
git add src/db/schema/ drizzle/migrations/
git commit -m "feat: add role column to users"
```

### Running migrations in code

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(migrationClient);

await migrate(db, { migrationsFolder: "./drizzle/migrations" });
await migrationClient.end();
```

- Use a separate connection for migrations (single connection, not pooled).
- Run migrations before starting the application server.
- In serverless, run migrations as a deployment step, not at cold start.

## Common migration patterns

### Adding a non-nullable column to existing table

```sql
-- Generated migration (may need manual editing)
ALTER TABLE "users" ADD COLUMN "role" varchar(20);

-- Manual addition: backfill + set NOT NULL
UPDATE "users" SET "role" = 'member' WHERE "role" IS NULL;
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member';
```

- drizzle-kit generates the `ADD COLUMN` but may not handle the backfill.
- Edit the migration SQL to add the UPDATE and ALTER steps.

### Renaming a column

```sql
-- drizzle-kit may generate DROP + ADD instead of RENAME
-- Replace with:
ALTER TABLE "users" RENAME COLUMN "name" TO "display_name";
```

- drizzle-kit cannot detect renames. It generates a drop + add which loses data.
- Always review generated migrations for rename scenarios.

### Creating an index concurrently (Postgres)

```sql
-- Add to migration manually
CREATE INDEX CONCURRENTLY "ix_users_email" ON "users" ("email");
```

- Standard CREATE INDEX locks the table. CONCURRENTLY avoids this.
- Must run outside a transaction. May need to split into a separate migration step.

### Data migration

```sql
-- Separate migration file for data changes
UPDATE "users" SET "slug" = lower(replace("display_name", ' ', '-'))
  WHERE "slug" IS NULL;
```

- Keep data migrations in separate files from schema migrations.
- For large tables, batch the update to avoid long-running transactions.

## CI checks

```bash
# 1. Generate to check for drift (should produce no new files)
npx drizzle-kit generate --name drift-check
# If new files are generated, schema and migrations are out of sync

# 2. Test migration on clean database
npx drizzle-kit migrate

# 3. Verify schema matches expectations
npx drizzle-kit introspect
```

### CI pipeline example

```yaml
# GitHub Actions
migration-check:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_PASSWORD: test
        POSTGRES_DB: test_db
      ports:
        - 5432:5432
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npx drizzle-kit migrate
      env:
        DATABASE_URL: postgres://postgres:test@localhost:5432/test_db
    - run: npx drizzle-kit generate --name ci-drift-check
    - run: |
        if [ -n "$(git status --porcelain drizzle/)" ]; then
          echo "Schema drift detected! Run 'npx drizzle-kit generate' locally."
          exit 1
        fi
```

## Migration journal

drizzle-kit maintains a `_journal.json` in the migrations directory:

```json
{
  "entries": [
    { "idx": 0, "when": 1705000000, "tag": "0000_init", "breakpoints": true },
    { "idx": 1, "when": 1705100000, "tag": "0001_add_teams", "breakpoints": true }
  ]
}
```

- Do not manually edit `_journal.json`. drizzle-kit manages it.
- If journal gets corrupted, regenerate with `drizzle-kit generate` from a clean state.
- Merge conflicts in journal should be resolved by keeping both entries in order.

## Rollback strategy

drizzle-kit does not generate down migrations automatically.

### Manual rollback approach

1. Keep a `rollback/` directory with reverse SQL for critical migrations.
2. Test rollback scripts alongside forward migrations.
3. For simple additions, rollback is `DROP COLUMN` or `DROP TABLE`.
4. For data migrations, rollback may require a backup restore.

### Forward-only strategy (recommended for most teams)

1. Never drop columns in the same release that stops reading them.
2. Deploy in phases: stop writing -> stop reading -> drop column.
3. Keep old columns nullable during transition.
4. This avoids needing rollback for schema changes.

## Best practices checklist

- Every schema change has a corresponding generated migration.
- Migration SQL is reviewed before merge (treat like application code).
- CI runs full migration chain on a clean database.
- CI checks for schema-migration drift.
- Data migrations are separate files from schema migrations.
- `push` is never used in CI or production.
- Destructive changes (drops, renames) are deployed in phases.
- Migration files are committed alongside schema changes in the same PR.
