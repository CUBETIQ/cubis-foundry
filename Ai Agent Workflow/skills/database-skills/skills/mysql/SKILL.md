---
name: mysql
description: MySQL/InnoDB schema design, indexing, pagination, query tuning, and operational safety.
---

# MySQL

## Version posture

- Prefer **8.4 LTS** for long-lived production stability.
- Use **9.x Innovation** only when you need newest features and can absorb faster change cadence.

## Optimization workflow

1. Baseline with `EXPLAIN` and `EXPLAIN ANALYZE`.
2. Tune indexes around dominant filter and sort paths.
3. Validate pagination path (`ORDER BY` + index coverage).
4. Evaluate DDL lock/replication impact before migration.

## Indexing techniques

- Composite indexes that match predicate and ordering direction.
- Covering indexes for hot read endpoints.
- Keep clustered primary key narrow to reduce secondary index overhead.
- Avoid shotgun indexing; measure write amplification impact.

## Pagination techniques

- Prefer seek/keyset pagination with deterministic ordering.
- Include unique tie-breaker for stable page boundaries.
- Avoid large offset pagination for deep traversal.

## Operational guardrails

- Treat online DDL mode and lock behavior as explicit rollout risks.
- Test DDL on production-like data volume and replica topology.

## References

- `references/query-indexing.md`
- `references/locking-ddl.md`
