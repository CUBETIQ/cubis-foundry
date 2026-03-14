# Drizzle ORM Eval Assertions

## Eval 1: Schema Definition with Relations

This eval tests the ability to produce a correctly structured Drizzle ORM schema with table definitions, relations, type inference, and indexes for a multi-entity blog platform.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `pgTable` — Correct table builder               | PostgreSQL requires pgTable. Using the wrong dialect builder produces incompatible SQL and type errors at build time. |
| 2 | contains | `relations` — Relation declarations              | Drizzle's relational query API (db.query.*) requires explicit relation definitions. Without them, nested queries silently return incomplete data. |
| 3 | contains | `$inferSelect` — Schema-derived types            | Manual TypeScript interfaces drift from the schema as columns change. $inferSelect and $inferInsert are the single source of truth. |
| 4 | contains | `references` — Foreign key constraints           | Foreign keys enforce referential integrity at the database level. Relations alone only enable the query API — they do not create constraints. |
| 5 | contains | `pgEnum` — Native PostgreSQL enum                | Post status as pgEnum enforces valid values at the database level and produces a fully typed column in TypeScript, unlike plain varchar. |
| 6 | contains | `primaryKey` — Junction table composite key      | Many-to-many junction tables without a composite primary key allow duplicate rows, corrupting the relationship. |

### What a passing response looks like

- A `users` table with email, displayName, and role columns.
- A `posts` table with title, content, and a `pgEnum` status column (draft/published/archived).
- A `comments` table with foreign keys to posts and users.
- A `tags` table and a `postsToTags` junction table with a composite primary key.
- `relations()` declarations for all entities enabling nested queries.
- `$inferSelect` and `$inferInsert` type exports for at least the main entities.
- Indexes on foreign key columns (authorId on posts, postId on comments).

---

## Eval 2: Migration Workflow

This eval tests the ability to produce a safe drizzle-kit migration workflow including schema changes, migration generation, custom data migration, and deployment steps.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `drizzle-kit` — Migration tool usage             | Drizzle ORM relies on drizzle-kit for migration management. Omitting it means no structured migration workflow. |
| 2 | contains | `generate` — Migration file generation           | `drizzle-kit generate` creates versioned SQL files. Using `push` instead skips file creation and makes rollback impossible. |
| 3 | contains | `pgEnum` — Native enum for status column         | Using pgEnum ensures the database rejects invalid status values. A plain varchar with application validation can be bypassed. |
| 4 | contains | `transaction` — Atomic data migration            | Data migrations that update existing rows must be wrapped in transactions. Partial updates from failed migrations leave data inconsistent. |
| 5 | contains | `default` — Default value on new column          | Adding a NOT NULL column without a default to a table with existing rows fails. Defaults ensure backward compatibility during migration. |

### What a passing response looks like

- A `drizzle.config.ts` with schema path, output directory, and dialect.
- Schema changes: new `orgStatusEnum`, new `organizations` table, nullable `organizationId` on users.
- Command sequence: `drizzle-kit generate` to create the migration file.
- Generated SQL reviewed (CREATE TYPE, CREATE TABLE, ALTER TABLE ADD COLUMN).
- A custom data migration script using `db.transaction()` to set all users to "active" status.
- Command to apply: `drizzle-kit migrate`.
- No use of `drizzle-kit push` for production.
