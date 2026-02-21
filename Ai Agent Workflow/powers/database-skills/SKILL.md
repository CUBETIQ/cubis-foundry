---
name: database-skills
description: Unified database skill hub with engine-specific packs for PostgreSQL, MySQL, Vitess, Neki, MongoDB (Mongoose), SQLite, Supabase, and Redis.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
metadata:
  version: "2.0.0"
  domain: data
  triggers: database, sql, postgres, mysql, vitess, neki, mongodb, mongoose, sqlite, supabase, redis, schema, migration, index, query, performance, pagination, replication, pooling, sharding, cache
---

# Database Skills Hub

Use this as the primary database hub. Keep `database-design`, `database-optimizer`, and `drift-flutter` available for specialized/legacy-compatible flows. Load the target engine's `SKILL.md` from `skills/<engine>/`, then load relevant `references/*` files.

## Engine selection

| Situation | Engine |
| --- | --- |
| Relational OLTP, self-hosted or cloud | Postgres |
| Relational OLTP, MySQL-compatible managed service | MySQL + Vitess (PlanetScale) |
| Multi-tenant SaaS needing horizontal Postgres scale | Neki |
| Document model, flexible schema | MongoDB |
| Mobile / desktop / edge local storage | SQLite |
| BaaS with built-in auth, storage & realtime | Supabase |
| Caching, queues, leaderboards, pub/sub | Redis |

## Structure

```
skills/
  postgres/
    SKILL.md
    references/
      schema-indexing.md       ← index types, composite, partial, INCLUDE
      performance-ops.md       ← EXPLAIN, pg_stat_statements, VACUUM, autovacuum
      migrations.md            ← zero-downtime DDL, expand/contract, tools
      connection-pooling.md    ← PgBouncer, pool sizing, serverless patterns

  mysql/
    SKILL.md
    references/
      query-indexing.md        ← EXPLAIN, composite indexes, covering, seek pagination
      locking-ddl.md           ← INSTANT/INPLACE/COPY, MDL, gh-ost, deadlocks
      replication.md           ← binlog formats, GTID, lag monitoring, read routing

  vitess/
    SKILL.md
    references/
      sharding-routing.md      ← VSchema, vindexes, sequences, scatter queries
      operational-safety.md    ← Online DDL strategies, migration lifecycle, VReplication

  neki/
    SKILL.md
    references/
      architecture.md          ← sharded Postgres architecture, pre-sharding checklist
      operations.md            ← migration planning, validation, provisional pre-GA guidance

  mongodb/
    SKILL.md
    references/
      modeling.md              ← embed vs reference, compound indexes, explain(), pagination
      mongoose-nestjs.md       ← repository pattern, lean reads, transactions, NestJS setup
      aggregation.md           ← pipeline stages, $group, $lookup, $facet, performance

  sqlite/
    SKILL.md
    references/
      local-first.md           ← WAL mode, migration patterns, sync/conflict strategies
      performance.md           ← EXPLAIN QUERY PLAN, indexes, batch writes, checkpoint tuning

  supabase/
    SKILL.md
    references/
      rls-auth.md              ← RLS policies, auth.uid(), index predicates, service_role
      performance-operations.md ← query optimization, connection modes, pooler selection

  redis/
    SKILL.md
    references/
      data-modeling.md         ← data structure selection, key naming, TTL strategy
      cache-patterns.md        ← pipelining, SCAN, rate limiting, leaderboards, invalidation
      operations.md            ← memory management, eviction policies, latency diagnostics
```

## Required flow

1. Read `LATEST_VERSIONS.md` before proposing version-specific behavior.
2. Use engine selection table above to pick the target engine.
3. Load the target engine `SKILL.md` and relevant `references/*` files — read the ones that match the task (indexing, migrations, replication, etc.).
4. Provide an optimization or implementation plan that includes:
   - specific change with rationale,
   - indexing or schema decisions,
   - migration safety (online vs offline),
   - rollback path.
5. For production-impacting changes, include blast-radius assessment and rollout stages.

## Cross-engine performance checklist

- **Indexing**: add indexes only for real predicates and sort patterns. Drop unused indexes — they penalize writes.
- **Pagination**: prefer keyset/seek for deep or high-throughput pagination. Reserve offset for shallow interactive pages only.
- **Measurement**: compare before/after plans with engine-native explain tooling (`EXPLAIN ANALYZE`, `VEXPLAIN`, `explain()`). Validate with realistic cardinality.
- **Safety**: no destructive data/schema operations without explicit user confirmation. Always include rollback/recovery steps.
