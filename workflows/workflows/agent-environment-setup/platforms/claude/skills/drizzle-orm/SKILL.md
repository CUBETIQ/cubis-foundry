---
name: drizzle-orm
description: "Use when building or refactoring TypeScript data layers with Drizzle ORM: schema-as-code, relational queries, type-safe SQL, drizzle-kit migrations, and edge/serverless deployment patterns."
allowed-tools: Read Grep Glob Bash Edit Write
user-invocable: true
argument-hint: "Drizzle schema, query, or migration to work on"
---

# Drizzle ORM

## Purpose

Guide developers through production-grade Drizzle ORM usage including TypeScript-first schema definition, relational query building, type-safe SQL composition, drizzle-kit migration workflows, and deployment patterns for edge and serverless runtimes. This skill ensures type-safe, performant, and migration-safe database layers in TypeScript applications.

## When to Use

- Defining or refactoring Drizzle schema files with `pgTable`, `sqliteTable`, or `mysqlTable`.
- Building relational queries with `db.query.*` API or composing type-safe SQL with `select()`.
- Creating, reviewing, or troubleshooting drizzle-kit migration workflows.
- Deploying Drizzle-backed APIs to edge runtimes (Cloudflare Workers, Vercel Edge, Deno Deploy).
- Migrating from Prisma, TypeORM, or raw SQL to Drizzle ORM.
- Tuning query performance, connection pooling, or prepared statement strategies.

## Instructions

1. **Confirm the target database engine and runtime before writing schema code** because Drizzle uses engine-specific schema builders (`pgTable`, `sqliteTable`, `mysqlTable`) that produce different SQL dialects, and mixing them causes build-time type errors and runtime failures.

2. **Define all tables in schema files using the TypeScript-first schema API** because Drizzle derives all TypeScript types directly from schema definitions, making `typeof users.$inferSelect` and `typeof users.$inferInsert` the single source of truth for both database and application types, eliminating type drift.

3. **Use `relations()` declarations for every foreign key relationship** because Drizzle's relational query API (`db.query.users.findMany({ with: { posts: true } })`) requires explicit relation definitions to function, and missing relations silently fall back to returning incomplete data.

4. **Prefer the relational query API for reads that involve joins** because it generates optimized SQL with proper JOIN or subquery strategies, provides fully typed nested results, and eliminates the manual mapping layer that raw `select().from().leftJoin()` requires.

5. **Use the SQL-like `select()` API for writes, aggregations, and complex WHERE clauses** because the relational query API is read-optimized and does not support `INSERT`, `UPDATE`, `DELETE`, `GROUP BY`, or subquery composition, which are core to transactional write paths.

6. **Configure `drizzle-kit` with explicit `schema`, `out`, and `dialect` fields** because ambiguous configuration causes migrations to target the wrong tables or generate empty diffs, and dialect mismatch between config and schema silently produces invalid SQL.

7. **Run `drizzle-kit generate` in CI to detect schema-migration drift** because developers frequently modify schema files without generating a migration, and this drift only surfaces during deployment when the database does not match the schema.

8. **Use `drizzle-kit push` only for prototyping and development databases** because push applies schema changes directly without migration files, making production rollback impossible and leaving no audit trail of schema evolution.

9. **Write migration files with both up and down logic when custom SQL is needed** because drizzle-kit auto-generated migrations handle schema additions but frequently miss data transformations, enum modifications, and index strategy changes that require manual intervention.

10. **Scope database connections to the runtime deployment model** because Cloudflare Workers use D1 or Hyperdrive bindings, Vercel Edge uses connection strings with `@vercel/postgres`, and Node.js uses `database-design` or `better-sqlite3`, each requiring different Drizzle driver initialization.

11. **Use `$inferSelect` and `$inferInsert` types instead of manually defining interfaces** because Drizzle derives these types from the schema at compile time, and manual interfaces drift from the schema as columns are added, renamed, or made nullable.

12. **Use `prepared()` statements for hot-path queries** because prepared statements skip the SQL compilation step on repeated execution, reducing latency by 20-40% in high-throughput endpoints, and Drizzle's `.prepare()` method makes this a one-line optimization.

13. **Validate schema changes against the target database before deploying** because Drizzle generates SQL at build time but does not validate against the live schema, so renaming a column that a deployed migration already renamed will produce a duplicate alteration error at runtime.

14. **Separate read-only queries from write operations at the connection level** because read replicas, connection pooling, and edge caching all depend on clean read/write separation that Drizzle supports through multiple `drizzle()` instances.

15. **Test Drizzle queries against the target database engine, not in-memory mocks** because SQLite, Postgres, and MySQL have different type coercion, JSON handling, and constraint enforcement behaviors that mocks cannot reproduce.

16. **Use transactions for multi-table writes with `db.transaction()`** because Drizzle does not auto-wrap related writes in a transaction, and interleaved failures without transactions leave the database in an inconsistent state that is expensive to diagnose and repair.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task. Include complete schema definitions, query patterns, migration scripts, and drizzle-kit configuration when the task requires them. Use TypeScript with strict mode throughout.

## References

| File | Load when |
| --- | --- |
| `references/schema-definition.md` | Defining or refactoring table schemas, column types, constraints, relations, or type inference patterns. |
| `references/queries.md` | Writing relational queries, SQL-like queries, transactions, prepared statements, or aggregation patterns. |
| `references/migrations.md` | Creating, reviewing, or troubleshooting drizzle-kit migrations, push vs generate workflow, or migration chain management. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me design a Drizzle schema for a multi-tenant SaaS with Postgres"
- "Review my drizzle-kit migration workflow for production safety"

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents in `.claude/agents/*.md` support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Key agents support `memory: project` for cross-session learning (orchestrator, debugger, researcher, project-planner).
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules: `.claude/rules/*.md` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
