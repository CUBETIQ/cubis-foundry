# Prisma Eval Assertions

## Eval 1: Schema Design with Relations and Migrations

This eval tests the ability to design a Prisma 6+ schema for a multi-tenant SaaS with proper relations, indexes, enums, and a safe migration workflow including additive schema changes.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `@relation` — Explicit relation annotations | Prisma requires explicit `@relation` annotations with `fields` and `references` for ambiguous relations. Omitting them on self-relations or multiple relations to the same model produces schema validation errors that block migration. |
| 2 | contains | `@@index` — Schema-defined indexes | Indexes defined in the Prisma schema are tracked by `prisma migrate diff`. Indexes created with raw SQL outside the schema are invisible to Prisma, causing migration drift between environments and missed performance optimizations. |
| 3 | contains | `enum` — Prisma-native enums | Schema-defined enums generate database-level enum types (Postgres) or CHECK constraints (MySQL/SQLite), enforcing valid values at the database layer. String fields with application-level validation can be bypassed by direct database access. |
| 4 | contains | `prisma migrate` — Migration workflow commands | Using `migrate dev` in development and `migrate deploy` in production ensures migration files are generated interactively, reviewed before commit, and applied atomically in CI/CD without generating new migrations in production. |
| 5 | contains | `@@unique` — Composite uniqueness constraints | Unique constraints prevent duplicate data at the database level. Without them, concurrent requests can create duplicate organization memberships or duplicate label names that application-level checks would miss due to race conditions. |

### What a passing response looks like

- Models: `Organization`, `User`, `OrganizationMember` (join table with role), `Project`, `Task`, `Label`, `TaskLabel` (or implicit M2M).
- `OrganizationMember` has `@@unique([userId, organizationId])` to prevent duplicate memberships.
- `Task` model has `priority` and `status` as Prisma enums with defined values.
- `@@index([status])`, `@@index([assigneeId])`, `@@index([dueDate])` on the Task model.
- All relations use `@relation(fields: [...], references: [...])`.
- Migration workflow: `npx prisma migrate dev --name init` for initial setup, `npx prisma migrate dev --name add-labels` for the labels feature.
- Generated migration SQL is reviewed before committing to version control.
- `prisma migrate deploy` used in CI/CD pipeline.

---

## Eval 2: Edge Deployment with Advanced Queries

This eval tests the ability to configure Prisma for edge runtime deployment and write efficient Prisma Client queries including select/include, transactions, cursor-based pagination, and aggregations.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `include` — Controlled relation loading | Prisma returns all scalar fields and no relations by default. Using `include` or `select` explicitly controls the data shape, preventing over-fetching (wasted bandwidth) and under-fetching (additional queries or null references). |
| 2 | contains | `$transaction` — Atomic multi-step writes | Interactive transactions hold a database-level transaction across multiple Prisma queries. Without them, creating a task and assigning it in separate calls risks partial writes where the task exists but the assignment fails. |
| 3 | contains | `cursor` — Cursor-based pagination | Offset pagination breaks when data changes between requests (duplicates, skipped items). Cursor-based pagination provides stable pages using a unique, sortable field as the pagination anchor. |
| 4 | contains | `accelerate` — Edge runtime compatibility | The Prisma query engine is a Rust binary that cannot run in V8-only edge environments. Prisma Accelerate provides a managed proxy that the lightweight edge client communicates with, enabling edge deployment without the engine binary. |
| 5 | contains | `groupBy` — Database-level aggregation | Aggregating task counts by status with `groupBy` executes a single SQL GROUP BY query. Fetching all tasks and counting in application code transfers unnecessary data and scales poorly with dataset size. |

### What a passing response looks like

- Datasource configured with `prisma://` URL for Prisma Accelerate with `directUrl` for migrations.
- Generator configured with `@prisma/client` and edge-compatible output.
- Project query uses `include: { tasks: { include: { assignee: true }, select: { _count: { select: { labels: true } } } } }`.
- Transaction: `prisma.$transaction(async (tx) => { const task = await tx.task.create(...); await tx.taskAssignment.create(...); return task; })`.
- Cursor pagination: `prisma.task.findMany({ take: 20, cursor: { id: lastId }, skip: 1, orderBy: { createdAt: 'desc' } })`.
- Aggregation: `prisma.task.groupBy({ by: ['status'], _count: { id: true } })`.
- Connection pool configured with `connection_limit` and `pool_timeout` parameters.
