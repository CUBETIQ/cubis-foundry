---
name: sqlalchemy
description: "Use when building or refactoring Python data layers with SQLAlchemy 2.0+ declarative models, async sessions, Alembic migrations, relationship loading strategies, and ORM testing patterns."
allowed-tools: Read Grep Glob Bash Edit Write
user-invocable: true
argument-hint: "SQLAlchemy model, query, or migration to work on"
---

# SQLAlchemy ORM

## Purpose

Guide developers through production-grade SQLAlchemy 2.0+ usage including declarative model design, async session management, Alembic migration workflows, relationship loading strategies, and comprehensive ORM testing patterns. This skill ensures type-safe, performant, and migration-safe database layers in Python applications.

## When to Use

- Designing or refactoring SQLAlchemy 2.0+ declarative models with `Mapped` and `mapped_column`.
- Implementing async database sessions with `AsyncSession` and `async_sessionmaker`.
- Creating, reviewing, or troubleshooting Alembic migration scripts.
- Tuning relationship loading strategies (lazy, eager, selectin, subquery) for performance.
- Writing integration tests for ORM models, queries, and migrations.
- Migrating from SQLAlchemy 1.x legacy patterns to 2.0-style queries and models.

## Instructions

1. **Confirm the SQLAlchemy version and async posture before writing any model code** because 2.0 declarative syntax (`Mapped[]`, `mapped_column()`) differs fundamentally from 1.x `Column()` patterns, and mixing them causes type checker failures and runtime surprises.

2. **Use `DeclarativeBase` with `Mapped` type annotations for every column** because this enables full `mypy`/`pyright` support and makes the schema self-documenting at the type level, eliminating a class of runtime errors that untyped Column definitions hide.

3. **Define a single `Base` class per project and import it everywhere** because multiple bases create separate metadata registries, causing Alembic to miss tables and relationships to break silently across module boundaries.

4. **Configure `async_sessionmaker` with `expire_on_commit=False` for async code** because the default expire-on-commit behavior triggers implicit lazy loads that raise `MissingGreenlet` errors in async contexts, which is the single most common async SQLAlchemy bug.

5. **Use explicit `selectinload()` or `joinedload()` for every relationship access in async sessions** because implicit lazy loading is disabled in async mode and will raise exceptions rather than silently executing queries, unlike synchronous SQLAlchemy.

6. **Scope sessions to request or unit-of-work boundaries using context managers** because long-lived sessions accumulate stale identity map entries, increase connection hold time, and make transaction isolation violations harder to diagnose.

7. **Write Alembic migrations with both `upgrade()` and `downgrade()` functions** because production rollback capability is non-negotiable, and auto-generated migrations frequently omit downgrade logic for data transformations, index changes, and enum modifications.

8. **Run `alembic check` in CI to detect model-migration drift** because developers frequently modify models without generating a migration, and this drift only surfaces during deployment when the schema does not match the code.

9. **Use server-side defaults and `server_default` for new non-nullable columns** because adding a non-nullable column without a server default will lock the table during migration on large datasets and fail outright on databases with existing rows.

10. **Prefer `select()` statements over legacy `Query` API** because the 2.0-style `select()` is composable, supports type inference, works identically in sync and async, and is the only API path that will receive future improvements.

11. **Separate read-only queries from write operations at the session level** because read replicas, connection pooling tuning, and transaction isolation strategies all depend on clean read/write separation that cannot be retrofitted.

12. **Test ORM code against a real database engine, not SQLite substitutes** because SQLite silently accepts invalid types, ignores foreign key constraints by default, and lacks features like `ARRAY`, `JSON` operators, and window functions that Postgres and MySQL provide.

13. **Use `pytest` fixtures with transaction-scoped sessions for test isolation** because rolling back a transaction after each test is orders of magnitude faster than recreating the schema, and it guarantees that test data never leaks between cases.

14. **Pin Alembic migration heads and test the full migration chain in CI** because branching migrations create merge conflicts that are invisible until deployment, and a broken migration chain means the database cannot be built from scratch.

15. **Configure connection pool size, overflow, and recycle based on deployment model** because default pool settings cause connection exhaustion under load in serverless and container environments, and stale connections cause intermittent query failures.

16. **Use `relationship()` with explicit `back_populates` instead of `backref`** because `back_populates` is explicit, type-checker friendly, and makes the bidirectional nature of the relationship visible in both model files rather than hidden in one.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task. Include complete model definitions, session configuration, migration scripts, and test fixtures when the task requires them. Annotate code with type hints consistent with SQLAlchemy 2.0 `Mapped[]` conventions.

## References

| File | Load when |
| --- | --- |
| `references/declarative-models.md` | Designing or refactoring model classes, column types, constraints, mixins, or table arguments. |
| `references/async-sessions.md` | Configuring async engine, session factories, connection pooling, or diagnosing MissingGreenlet errors. |
| `references/alembic-migrations.md` | Creating, reviewing, or troubleshooting Alembic migration scripts, autogenerate configuration, or migration chains. |
| `references/testing.md` | Writing ORM integration tests, fixture patterns, transaction rollback isolation, or factory setup. |
| `references/performance.md` | Tuning query performance, relationship loading strategies, connection pooling, or diagnosing N+1 problems. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me design async SQLAlchemy models for a multi-tenant SaaS application"
- "Review my Alembic migration for adding a non-nullable column to a large table"

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
