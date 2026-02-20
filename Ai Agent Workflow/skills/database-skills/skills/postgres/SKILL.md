---
name: postgres
description: PostgreSQL schema, indexing, query optimization, migrations, and operations.
---

# Postgres

Load references as needed:
- `references/schema-indexing.md`
- `references/performance-ops.md`

Key rules:
- Start with `EXPLAIN (ANALYZE, BUFFERS)`.
- Design indexes from real query patterns.
- Keep transactions short; monitor vacuum and bloat.
