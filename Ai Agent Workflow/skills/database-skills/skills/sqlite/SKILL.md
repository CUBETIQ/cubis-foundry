---
name: sqlite
description: SQLite local/edge data strategy, schema design, indexing, and WAL tuning.
---

# SQLite

Load references as needed:
- `references/local-first.md`
- `references/performance.md`

Key rules:
- Use WAL mode for mixed read/write workloads.
- Keep write transactions short.
- Plan upgrade path if concurrency demands exceed SQLite limits.
