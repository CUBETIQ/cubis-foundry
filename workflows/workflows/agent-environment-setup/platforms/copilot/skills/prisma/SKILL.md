---
name: prisma
description: "Use when working with Prisma 6+ for schema design, database migrations, client queries, relation modeling, edge deployment, and type-safe database access in TypeScript and Node.js applications."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Prisma

## Purpose

Guide the design and implementation of production-grade database layers using Prisma 6+ with type-safe schema modeling, migration workflows, efficient client queries, relation handling, middleware, edge deployment, and multi-database strategies. Every instruction prioritizes type safety derived from the schema, migration reproducibility, query performance awareness, and the Prisma mental model of the schema as the single source of truth for both the database and the TypeScript types.

## When to Use

- Designing a new Prisma schema with models, relations, enums, and composite types.
- Running and managing database migrations with `prisma migrate dev` and `prisma migrate deploy`.
- Writing Prisma Client queries with includes, selects, filters, transactions, and raw SQL.
- Optimizing query performance with indexes, relation loading strategies, and batch operations.
- Deploying Prisma to edge runtimes (Cloudflare Workers, Vercel Edge Functions) with the Prisma Accelerate or driver adapters.
- Setting up multi-schema or multi-database architectures with Prisma.
- Reviewing Prisma code for N+1 queries, missing indexes, unsafe migrations, or type drift.

## Instructions

1. **Confirm the Prisma version and database provider before generating schema or queries** because Prisma 6 introduced the no-engine architecture with driver adapters as the default, removed deprecated features, and changed connection pooling behavior that invalidates patterns from Prisma 5 and earlier. See `references/schema-design.md`.

2. **Define the schema as the single source of truth and generate the client after every schema change** because the Prisma Client types are derived from `schema.prisma` at generation time, and using the client without regenerating after a schema edit produces type mismatches that TypeScript reports as correct but fail at runtime.

3. **Use explicit `@relation` annotations with `fields` and `references` on every relation** because Prisma requires explicit foreign key mapping for ambiguous relations, and omitting the annotation on self-relations or multiple relations to the same model produces a schema validation error that blocks migration.

4. **Design indexes with `@@index` and `@@unique` constraints in the schema rather than raw SQL** because Prisma migrate generates index creation statements from schema directives, and indexes defined outside the schema are invisible to `prisma migrate diff`, causing migration drift between environments. See `references/migrations.md`.

5. **Use `prisma migrate dev` in development and `prisma migrate deploy` in CI/CD and production** because `migrate dev` generates new migration files and applies them interactively, while `migrate deploy` applies pending migrations without generating new ones, ensuring that production receives only reviewed and committed migration SQL.

6. **Always review generated migration SQL before committing** because Prisma generates destructive operations (column drops, type changes) that can cause data loss, and the generated SQL may not include data backfill steps that the schema change logically requires.

7. **Use `select` and `include` to control the shape of returned data instead of fetching full models** because Prisma returns all scalar fields by default and no relations, and over-fetching scalars wastes bandwidth while under-including relations causes additional queries or null reference errors in the application layer. See `references/client-queries.md`.

8. **Use `createMany`, `updateMany`, and `deleteMany` for batch operations instead of looping single-record calls** because batch operations execute a single SQL statement, while loops generate N separate round trips to the database, causing orders-of-magnitude performance degradation on large datasets.

9. **Wrap multi-step writes in `prisma.$transaction()` with the interactive transaction API** because Prisma's interactive transactions hold a database-level transaction across multiple queries, ensuring atomicity for operations like transferring balances or creating related records that must succeed or fail together.

10. **Use Prisma middleware or the `$extends` client extensions API for cross-cutting concerns** because middleware and extensions intercept queries at the client level for logging, soft deletes, audit trails, and tenant scoping without modifying individual query call sites, keeping business logic separated from infrastructure concerns.

11. **Configure connection pooling with explicit `connection_limit` and `pool_timeout` in the datasource URL** because the default pool size varies by provider and deployment target, and serverless environments with many concurrent function instances exhaust database connections without explicit pooling limits. See `references/edge-deployment.md`.

12. **Use Prisma Accelerate or a driver adapter for edge runtime deployment** because the Prisma query engine is a Rust binary that cannot run in V8-only edge environments, and Prisma Accelerate provides a managed connection pool and query engine proxy that the lightweight edge client communicates with over HTTPS.

13. **Define enums in the Prisma schema rather than as TypeScript string unions** because schema-defined enums generate database-level enum types (on Postgres) or CHECK constraints (on MySQL/SQLite), enforcing valid values at the database layer where application-level validation cannot be bypassed.

14. **Use `@@map` and `@map` to decouple Prisma model names from database table and column names** because Prisma conventions use PascalCase models and camelCase fields, but existing databases often use snake_case, and mapping preserves the database naming while giving the TypeScript client idiomatic field names.

15. **Seed the database with `prisma db seed` using a dedicated seed script referenced in `package.json`** because a committed seed script ensures every developer and CI environment starts with the same baseline data, and Prisma's seed hook runs automatically after `prisma migrate reset`, keeping seed data synchronized with the current schema.

16. **Use `prisma.$queryRaw` and `prisma.$executeRaw` only when Prisma Client cannot express the query** because raw queries bypass Prisma's type-safe query builder and return untyped results, losing the compile-time guarantees that are the primary reason for using Prisma over a raw query library. See `references/performance.md`.

## Output Format

Provide schema definitions, migration commands, client queries, middleware configurations, and deployment setup as appropriate. Include the full `schema.prisma` model block when defining or modifying models. When generating queries, show the complete Prisma Client call with `select`, `include`, `where`, and `orderBy` clauses relevant to the task.

## References

Load only what the current task requires.

| File | Load when |
| --- | --- |
| `references/schema-design.md` | Task involves model definitions, relations, enums, indexes, composite types, or multi-schema setup. |
| `references/migrations.md` | Task involves migration creation, deployment, squashing, baseline, or resolving migration drift. |
| `references/client-queries.md` | Task involves Prisma Client queries, transactions, raw SQL, aggregations, or batch operations. |
| `references/edge-deployment.md` | Task involves Prisma Accelerate, driver adapters, edge runtimes, or serverless connection pooling. |
| `references/performance.md` | Task involves query optimization, N+1 prevention, index tuning, connection pooling, or monitoring. |

## Copilot Platform Notes

- Custom agents are defined in `.github/agents/*.md` with YAML frontmatter: `name`, `description`, `tools`, `model`, `handoffs`.
- Agent `handoffs` field enables guided workflow transitions (e.g., `@project-planner` → `@orchestrator`).
- Skill files are stored under `.github/skills/` (skill markdown) and `.github/prompts/` (prompt files).
- Path-scoped instructions in `.github/instructions/*.instructions.md` provide file-pattern-targeted guidance via `applyTo` frontmatter.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context: fork` and `allowed-tools` are not natively supported; guidance is advisory.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
- MCP configuration lives in `.vscode/mcp.json`. MCP skill tools are available when configured.
- Rules file: `.github/copilot-instructions.md` — broad and stable, not task-specific.
