# Vitess Checklist

Load this when sharded MySQL behavior is the real problem.

## Routing and ownership

- Choose shard keys from access patterns and ownership boundaries.
- Keep cross-shard fan-out visible and minimized.
- Treat vindexes as application-shaping decisions, not low-level detail.

## Query behavior

- Check whether queries respect shard routing constraints.
- Avoid assuming single-node MySQL semantics when the topology is distributed.

## Operations

- Make Online DDL, resharding, and rollback operationally explicit.
- Keep coupling and migration risk visible to application teams.
