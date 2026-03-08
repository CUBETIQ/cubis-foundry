---
name: "database-design"
description: "Use when designing schemas, relationships, indexes, ORM boundaries, and safe migration plans for relational or document-oriented workloads."
license: MIT
metadata:
  version: "3.0.0"
  domain: "data"
  role: "specialist"
  stack: "database-design"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "stable"
  baseline: "modern schema and migration design"
  tags: ["database", "schema", "migrations", "indexing", "orm", "modeling"]
---
# Database Design

## When to use

- Designing or refactoring schemas, keys, and relationships.
- Choosing relational vs document vs local-first structure.
- Planning ORM and persistence boundaries.
- Designing migrations and indexing strategy before rollout.

## When not to use

- Performance triage where the real issue is plans, waits, or contention.
- High-level engine routing where `database-skills` is enough.
- App-layer framework work with no meaningful model change.

## Core workflow

1. Model the workload and lifecycle constraints before choosing tables or collections.
2. Define entities, ownership, keys, and read/write paths explicitly.
3. Design indexes and pagination from real access patterns.
4. Plan migrations, backfills, and rollback before implementation.
5. Validate that the design lowers long-term change risk rather than hiding it.

## Baseline standards

- Prefer schema decisions backed by access patterns.
- Treat indexes as part of the model, not an afterthought.
- Keep persistence models and transport models distinct when that lowers coupling.
- Make migration safety explicit.
- Choose normalization or denormalization deliberately.

## Avoid

- Modeling by ORM convenience alone.
- Deferring migration planning until after shipping.
- Adding indexes with no predicate or sort evidence.
- Using unstructured blobs to avoid real data modeling.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/schema-migration-checklist.md` | You need more explicit guidance for keys, indexes, pagination, ORM boundaries, backfills, and rollback-safe migration plans. |
