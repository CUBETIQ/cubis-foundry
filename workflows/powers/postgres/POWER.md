````markdown
---
inclusion: manual
name: postgres
description: "Use when the task is specifically PostgreSQL: schema design with Postgres features, query plans, indexes, JSONB, extensions, partitioning, logical replication, or managed Postgres operational tradeoffs."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Postgres

## Purpose

Use when the task is specifically PostgreSQL: schema design with Postgres features, query plans, indexes, JSONB, extensions, partitioning, logical replication, or managed Postgres operational tradeoffs.

## When to Use

- The engine is PostgreSQL or a managed Postgres product.
- The task depends on Postgres-specific features such as JSONB, partial indexes, CTEs, extensions, or partitioning.
- You need Postgres-aware migration, replication, or query-plan guidance.

## Instructions

1. Confirm the Postgres variant, version, hosting model, and write/read shape.
2. Choose the smallest Postgres-specific feature set that solves the real workload.
3. Design indexes, constraints, and pagination from actual predicates and sort order.
4. Validate migrations and operational impact, including replication, locks, or extension constraints.
5. Re-check with `EXPLAIN` evidence and rollback notes before finalizing.

### Baseline standards

- Prefer plain relational design before reaching for JSONB or exotic features.
- Treat `EXPLAIN`, lock behavior, and index cost as part of every non-trivial change.
- Keep extension usage deliberate and portable only when portability matters.
- Make write amplification, autovacuum, and migration blast radius explicit.

### Constraints

- Avoid using JSONB to avoid normal modeling without evidence.
- Avoid adding indexes without predicate, join, or ordering evidence.
- Avoid large blocking schema changes without a staged rollout.
- Avoid treating every Postgres problem as a tuning problem instead of a workload-design problem.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/postgres-checklist.md` | You need a deeper Postgres checklist for indexes, JSONB, extensions, locking, partitioning, and migration safety. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with postgres best practices in this project"
- "Review my postgres implementation for issues"
````
