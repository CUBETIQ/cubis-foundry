````markdown
---
inclusion: manual
name: database-design
description: "Use when designing schemas, relationships, indexes, ORM boundaries, and safe migration plans for relational or document-oriented workloads."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Database Design

## Purpose

Use when designing schemas, relationships, indexes, ORM boundaries, and safe migration plans for relational or document-oriented workloads.

## When to Use

- Designing or refactoring schemas, keys, and relationships.
- Choosing relational vs document vs local-first structure.
- Planning ORM and persistence boundaries.
- Designing migrations and indexing strategy before rollout.

## Instructions

1. Model the workload and lifecycle constraints before choosing tables or collections.
2. Define entities, ownership, keys, and read/write paths explicitly.
3. Design indexes and pagination from real access patterns.
4. Plan migrations, backfills, and rollback before implementation.
5. Validate that the design lowers long-term change risk rather than hiding it.

### Baseline standards

- Prefer schema decisions backed by access patterns.
- Treat indexes as part of the model, not an afterthought.
- Keep persistence models and transport models distinct when that lowers coupling.
- Make migration safety explicit.
- Choose normalization or denormalization deliberately.

### Constraints

- Avoid modeling by ORM convenience alone.
- Avoid deferring migration planning until after shipping.
- Avoid adding indexes with no predicate or sort evidence.
- Avoid using unstructured blobs to avoid real data modeling.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/schema-migration-checklist.md` | You need more explicit guidance for keys, indexes, pagination, ORM boundaries, backfills, and rollback-safe migration plans. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with database design best practices in this project"
- "Review my database design implementation for issues"
````
