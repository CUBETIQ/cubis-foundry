# Postgres Checklist

Load this when PostgreSQL work needs deeper tactical guidance.

## Modeling and indexes

- Prefer ordinary relational design before JSONB or specialized extensions.
- Choose indexes from actual predicates, joins, and ordering.
- Keep pagination aligned to index shape.

## Operations

- Check lock behavior and migration blast radius.
- Keep replication and failover posture visible when schema or extension usage changes.
- Use staged rollouts for heavy DDL or large backfills.

## Evidence

- Use `EXPLAIN` or `EXPLAIN ANALYZE` when query behavior is in scope.
- Make write amplification, vacuum impact, and rollback explicit.
