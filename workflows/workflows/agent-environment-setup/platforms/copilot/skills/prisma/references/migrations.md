# Migrations

Load this when creating, deploying, squashing, baselining, or resolving migration drift.

## Migration Commands

| Command | Environment | What it does |
| --- | --- | --- |
| `prisma migrate dev --name <name>` | Development | Generates SQL, applies it, regenerates client |
| `prisma migrate deploy` | CI/CD, Production | Applies pending migrations, no generation |
| `prisma migrate reset` | Development | Drops database, re-applies all migrations, runs seed |
| `prisma migrate diff` | Any | Shows SQL diff between two schema states |
| `prisma migrate resolve --applied <name>` | Production | Marks a migration as applied (for drift repair) |
| `prisma db push` | Prototyping | Pushes schema to database without migration files |
| `prisma db pull` | Reverse engineering | Generates schema from existing database |

## Development Workflow

### Creating a New Migration

```bash
# 1. Edit schema.prisma
# 2. Generate and apply migration
npx prisma migrate dev --name add-labels

# 3. Review the generated SQL
cat prisma/migrations/20260101120000_add_labels/migration.sql

# 4. Regenerate the client (migrate dev does this automatically)
npx prisma generate
```

### What `migrate dev` Does

1. Compares `schema.prisma` to the current migration history.
2. Generates a new SQL migration file in `prisma/migrations/<timestamp>_<name>/`.
3. Applies the migration to the development database.
4. Marks it as applied in the `_prisma_migrations` table.
5. Runs `prisma generate` to update the TypeScript client.

### Reviewing Generated SQL

Always review the generated SQL before committing. Prisma may generate:

- `DROP COLUMN` for renamed fields (data loss).
- `ALTER COLUMN` with implicit casts (data truncation).
- `DROP TABLE` for renamed models.

If the generated SQL is destructive, edit it manually or split the change into multiple migrations:

```bash
# Step 1: Add new column
npx prisma migrate dev --name add-display-name

# Step 2: Backfill data (custom SQL in migration)
# Edit the generated migration to add: UPDATE users SET display_name = name;

# Step 3: Remove old column
npx prisma migrate dev --name remove-name-column
```

## Production Deployment

```bash
# In CI/CD pipeline
npx prisma migrate deploy
```

- `migrate deploy` applies all pending migrations in order.
- It does NOT generate new migrations.
- It does NOT reset or drop anything.
- If a migration fails, the transaction rolls back (on databases that support DDL transactions).

### CI/CD Pipeline Example

```yaml
- name: Apply database migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}

- name: Generate Prisma Client
  run: npx prisma generate
```

## Handling Migration Drift

Migration drift occurs when the database schema differs from what the migration history expects.

### Common Causes

1. Manual SQL changes applied directly to the database.
2. A migration applied in production but not committed to version control.
3. `prisma db push` used instead of `prisma migrate dev`.

### Resolution

```bash
# See what is different
npx prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma

# Option A: Generate a migration to align the database
npx prisma migrate dev --name fix-drift

# Option B: Mark a migration as already applied (if the SQL was run manually)
npx prisma migrate resolve --applied 20260101120000_add_labels
```

## Baselining an Existing Database

When adding Prisma to a database that already has tables:

```bash
# 1. Introspect the database to generate schema.prisma
npx prisma db pull

# 2. Create a migration directory for the current state
mkdir -p prisma/migrations/0_init

# 3. Generate the SQL without applying it
npx prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql

# 4. Mark it as already applied
npx prisma migrate resolve --applied 0_init

# 5. Future changes use normal migrate dev workflow
```

## Seeding

```json
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

```bash
# Run seed manually
npx prisma db seed

# Seed runs automatically after:
npx prisma migrate reset
npx prisma migrate dev (if database was reset)
```

## Migration Best Practices

1. **One logical change per migration** -- mixing index additions with column renames makes rollback harder.
2. **Never edit applied migrations** -- changing an already-applied migration causes checksum mismatches.
3. **Commit migration files to version control** -- migrations are part of the application code.
4. **Test migrations on a copy of production data** -- schema changes that work on empty tables may fail on tables with millions of rows.
5. **Add data backfill in the migration SQL** -- if a new non-nullable column needs a default for existing rows, add `UPDATE` statements in the migration file.
