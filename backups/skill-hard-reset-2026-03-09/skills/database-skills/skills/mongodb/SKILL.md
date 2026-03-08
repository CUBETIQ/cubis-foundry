---
name: mongodb
description: MongoDB and Mongoose modeling, indexing, pagination, query tuning, and transaction guidance.
---

# MongoDB and Mongoose

## Optimization workflow

1. Model around dominant read/write paths (embed vs reference).
2. Add compound indexes for real filter + sort patterns.
3. Validate with `explain("executionStats")`.
4. Prefer range/keyset pagination over deep `skip`.
5. Re-check index selectivity and write overhead as data grows.

## Indexing techniques

- Compound indexes over isolated single-field indexes when query shape demands it.
- Keep index count controlled on write-heavy collections.
- Use partial/sparse strategies only when semantics are correct.

## Pagination techniques

- Avoid large-offset `skip` on large collections.
- Use boundary-based pagination with indexed monotonic key (`_id` or timestamp+id).
- Keep deterministic sort and cursor boundary state.

## Mongoose/NestJS guardrails

- Keep schema indexes explicit in model definitions/migrations.
- Use projections to avoid over-fetching large documents.
- Use transactions only when cross-document invariants require them.

## References

- `references/modeling.md`
- `references/mongoose-nestjs.md`
