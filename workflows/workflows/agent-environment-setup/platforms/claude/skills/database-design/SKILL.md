---
name: database-design
description: "Use when designing database schemas, normalization strategies, indexing plans, query optimization, and migration workflows for relational, document, or hybrid data stores."
allowed-tools: Read Grep Glob Bash Edit Write
context: fork
agent: implementer
user-invocable: true
argument-hint: "Schema, query, or data model to design"
---

# Database Design

## Purpose

Guide the design of database schemas, normalization strategies, indexing plans, query optimization techniques, and migration workflows. Applies to relational databases (PostgreSQL, MySQL, SQLite), document stores (MongoDB, DynamoDB), and hybrid architectures.

## When to Use

- Designing a new database schema or data model from scratch.
- Normalizing or denormalizing an existing schema to meet performance or consistency goals.
- Planning indexing strategies for known query patterns.
- Optimizing slow queries or diagnosing query plan issues.
- Writing migration scripts with rollback safety.
- Evaluating trade-offs between relational and document-oriented models.
- Reviewing an existing schema for correctness, redundancy, or scaling risk.

## Instructions

1. **Gather workload requirements before modeling.** Identify read/write ratios, expected data volumes, access patterns, and consistency requirements because schema decisions made without workload context tend to optimize for the wrong axis.

2. **Identify entities, their ownership, and lifecycle boundaries.** Map out which entities own which, what cascading behavior is needed on delete, and which entities have independent lifecycles because unclear ownership leads to orphaned records and referential integrity failures.

3. **Choose primary keys deliberately.** Evaluate natural keys vs surrogate keys (UUID, auto-increment) for each table based on uniqueness guarantees, join performance, and distributed system needs because the wrong key choice causes expensive migrations later.

4. **Normalize to third normal form (3NF) as a baseline.** Eliminate transitive dependencies and partial key dependencies first, then denormalize selectively with documented justification because premature denormalization hides data anomalies that surface at scale.

5. **Design indexes from documented access patterns.** For each query that will run frequently, identify the columns used in WHERE, JOIN, ORDER BY, and GROUP BY clauses because indexes without predicate evidence waste write throughput and storage.

6. **Evaluate composite indexes for multi-column queries.** Order composite index columns by selectivity (most selective first for equality, range columns last) because incorrect column ordering renders the index useless for the query planner.

7. **Plan for query optimization from the start.** Write EXPLAIN ANALYZE for critical queries during design, not after deployment, because query plan analysis during design prevents N+1 patterns and full table scans from reaching production.

8. **Separate read models from write models when access patterns diverge.** Use materialized views, denormalized read tables, or CQRS patterns when read and write shapes differ significantly because forcing one schema to serve both creates either write complexity or read latency.

9. **Design migrations as reversible, incremental operations.** Every migration must have a corresponding rollback script, and large data changes must use batched backfills because irreversible migrations create deployment risk and lock tables during high-traffic periods.

10. **Handle schema evolution without downtime.** Use expand-contract migration patterns: add new columns as nullable, backfill data, switch application code, then remove old columns because this eliminates the window where old and new application versions conflict.

11. **Add constraints at the database level, not just the application level.** Use CHECK constraints, UNIQUE constraints, foreign keys, and NOT NULL because application-level validation can be bypassed by direct database access, migrations, or bugs.

12. **Document scaling boundaries and partition strategies.** Identify which tables will grow beyond single-node capacity and plan horizontal partitioning, sharding keys, or archival strategies because retroactive partitioning on a large table requires extended downtime.

13. **Validate the design against edge cases.** Test with empty tables, single-row tables, maximum expected volume, and concurrent write scenarios because designs that work for the happy path often fail at boundary conditions.

14. **Review ORM mappings against the actual schema.** Verify that ORM-generated queries match intended access patterns and that lazy loading does not introduce N+1 queries because ORMs optimize for developer convenience, not query efficiency.

## Output Format

Provide schema definitions as SQL DDL or equivalent notation. Include:

- Table/collection definitions with columns, types, and constraints.
- Index definitions with rationale tied to specific queries.
- Migration scripts with UP and DOWN sections.
- Query optimization recommendations with EXPLAIN output where relevant.
- Entity-relationship descriptions or diagrams in text form.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/normalization-guide.md` | Designing entity relationships, key selection, normalization decisions, or constraint strategies. |
| `references/indexing-strategies.md` | Planning indexes, analyzing composite index column order, or evaluating index types (B-tree, hash, GIN, GiST). |
| `references/schema-evolution.md` | Planning schema changes, migration sequencing, backfills, rollback safety, and long-term data model evolution. |

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents live under `../../agents/` relative to the mirrored skill directory and support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Current project-memory agents are `orchestrator` and `planner`; use them for durable project context.
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules live under `../../rules/` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
