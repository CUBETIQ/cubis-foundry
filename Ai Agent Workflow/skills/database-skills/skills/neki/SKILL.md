---
name: neki
description: Neki-oriented guidance for sharded Postgres planning, placement, and operational constraints.
---

# Neki

Load references as needed:
- `references/architecture.md`
- `references/operations.md`

Key rules:
- Treat shard boundaries as primary architecture decisions.
- Model tenant/data locality early.
- Validate failover and maintenance behavior before production.
