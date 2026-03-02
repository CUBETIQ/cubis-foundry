---
name: vitess
description: Vitess sharding strategy, VSchema/vindex design, routing, and scale operations.
---

# Vitess

## Primary focus

- Choose a strong primary vindex.
- Keep hot queries shard-local.
- Minimize cross-shard joins and transactions.

## Optimization workflow

1. Identify dominant access patterns and routing keys.
2. Design VSchema/vindex for locality and balanced distribution.
3. Validate routing/fan-out behavior on critical queries.
4. Use seek pagination anchored on routing key and tie-breaker.
5. Stage topology/resharding changes with rollback checkpoints.

## Pagination techniques

- Prefer shard-aware keyset pagination.
- Avoid broad fan-out + offset combinations.

## Operational guardrails

- Treat resharding as staged production operation.
- Monitor fan-out, replica lag, and failover behavior during topology changes.

## References

- `references/sharding-routing.md`
- `references/operational-safety.md`
