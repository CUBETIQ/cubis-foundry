---
name: "mongodb"
description: "Use when the task is specifically MongoDB: document-model design, aggregation pipelines, index strategy, shard-key tradeoffs, and operational guidance for document workloads."
license: MIT
metadata:
  version: "3.0.0"
  domain: "data"
  role: "specialist"
  stack: "mongodb"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "stable"
  baseline: "modern mongodb engineering"
  tags: ["mongodb", "documents", "aggregation", "indexes", "sharding", "schema"]
---

# MongoDB

## When to use

- The engine is MongoDB or a MongoDB-compatible managed service.
- The task depends on document modeling, aggregation pipelines, compound indexes, or shard-key behavior.
- You need MongoDB-aware schema evolution or query guidance.

## When not to use

- The workload is mostly relational and the real issue is schema design, not document modeling.
- The problem is generic caching, queueing, or analytics with no MongoDB-specific behavior.
- The engine is Postgres, MySQL, SQLite, Redis, Supabase, Vitess, or Neki.

## Core workflow

1. Confirm document boundaries, write patterns, and query shape.
2. Choose embed vs reference deliberately from update and read behavior.
3. Design indexes and aggregation stages around actual filters, sorts, and fan-out.
4. Make schema evolution, validation, and shard-key risk explicit when relevant.
5. Re-check operational impact with evidence from query behavior and workload hotspots.

## Baseline standards

- Model documents from access patterns, not from relational habit alone.
- Keep schema validation and lifecycle rules explicit even in flexible models.
- Treat shard-key choice as a product-level scaling decision.
- Use aggregation only when it improves the real workflow, not because it can.

## Avoid

- Unbounded document growth.
- Overusing references or embeds without workload evidence.
- Weak validation because the database is “schema-less.”
- Premature sharding with no distribution evidence.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/mongodb-checklist.md` | You need deeper MongoDB guidance for embed-vs-reference choices, aggregation, indexing, validation, and shard-key tradeoffs. |
