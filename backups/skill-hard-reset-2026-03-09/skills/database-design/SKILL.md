---
name: "database-design"
description: "Use when designing schemas, choosing relational/document models, selecting ORMs, or planning safe database migrations."
allowed-tools: Read, Write, Edit, Glob, Grep
metadata:
  version: "2.0.0"
  domain: "data"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "stable"
  role: "specialist"
  tags: ["database", "schema", "indexing", "orm", "migrations", "modeling"]
---

# Database Design

## When to use

- Designing or refactoring schemas, keys, and relationships.
- Choosing between relational, document, or local-first data models.
- Selecting ORMs or query layers with clear tradeoffs.
- Planning safe schema migrations and index strategy.

## When not to use

- System-level query triage where `database-optimizer` should lead.
- Engine selection or routing where `database-skills` is enough.
- App-layer framework work with no meaningful data-model decision to make.

## Core workflow

1. Confirm product shape, scale, and operational constraints.
2. Choose the storage model and engine for the actual workload, not habit.
3. Design entities, keys, relationships, and lifecycle rules before ORM details.
4. Add indexing, pagination, and migration strategy as first-class design decisions.
5. Validate failure modes, rollback, and operational safety before finalizing.

## Design standards

- Choose schema shape from read/write patterns, not preference alone.
- Prefer explicit primary keys, ownership boundaries, and lifecycle semantics.
- Design indexes for real filters and sort orders, not generic coverage.
- Separate transport/API DTOs from persistence models when that lowers change risk.
- Treat migrations as part of the design, not a follow-up task.

## Reference files

| File | Load when |
| --- | --- |
| `references/database-selection.md` | Choosing the database engine or service model. |
| `references/orm-selection.md` | Selecting ORM/query builders and boundary patterns. |
| `references/schema-design.md` | Modeling entities, keys, normalization, or relationships. |
| `references/indexing.md` | Designing indexes for predicates, sorting, and access paths. |
| `references/optimization.md` | Reviewing query-shape consequences of the design. |
| `references/migrations.md` | Planning safe schema changes and rollout patterns. |

## Avoid

- Defaulting to one engine without workload evidence.
- Using JSON or blob columns to avoid modeling real structure.
- Deferring index strategy until after performance problems appear.
- Designing schemas with no migration or rollback path.
