---
name: mysql
description: MySQL/InnoDB schema design, indexing, query tuning, and operational safety.
---

# MySQL

Load references as needed:
- `references/query-indexing.md`
- `references/locking-ddl.md`

Key rules:
- Use `EXPLAIN` before optimization.
- Prefer online-safe schema change plans.
- Track lock waits and deadlocks during rollout.
