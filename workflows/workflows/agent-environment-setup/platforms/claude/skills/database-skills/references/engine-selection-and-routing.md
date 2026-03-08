# Engine Selection And Routing

Load this when a database task needs routing before implementation depth.

## First decision

- Is the real task engine choice, schema design, or performance triage?
- Do not jump to tuning when the workload or model is still unclear.

## Engine escalation

- `postgres`: relational depth, extensions, advanced indexing, managed Postgres behavior.
- `mysql`: InnoDB behavior, Online DDL, replication-aware rollout.
- `sqlite`: embedded, local-first, WAL, and constrained write concurrency.
- `mongodb`: document boundaries, aggregation, shard-key decisions.
- `redis`: cache, TTL, queue, rate-limit, in-memory coordination.
- `supabase`: managed Postgres plus RLS, auth, storage, and platform policy.
- `vitess`: sharded MySQL routing, vindexes, and Online DDL at scale.
- `neki`: sharded Postgres assumptions and distributed Postgres constraints.

## Companion skill routing

- `database-design` when entities, keys, relationships, migrations, and indexes are the main problem.
- `database-optimizer` when the problem is plans, waits, contention, or throughput.
- Add one language or framework skill only when query code or ORM integration is the active layer.
