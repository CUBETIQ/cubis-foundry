---
name: database-skills
description: Unified database skill hub with engine-specific packs for PostgreSQL, MySQL, Vitess, Neki, MongoDB (Mongoose), SQLite, Supabase, and Redis.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
metadata:
  version: "2.0.0"
  domain: "data"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "stable"
  role: "hub"
  triggers: database, sql, postgres, mysql, vitess, neki, mongodb, mongoose, sqlite, supabase, redis, schema, migration, index, query, performance, pagination, replication, pooling, sharding, cache
  tags: ["database", "sql", "nosql", "schema", "migrations", "indexing", "query-plans"]
---

# Database Skills Hub

Use this as the primary database routing skill. Start here for engine choice, then load the target engine pack from `skills/<engine>/`. Keep `database-design`, `database-optimizer`, and `drift-flutter` available only when the task clearly needs schema-design strategy, system-level performance triage, or Flutter-local persistence detail.

## When to use

- Choosing the right database engine or database subskill.
- Planning schema, indexing, migration, or query work before engine-specific deep dives.
- Routing a database task to the correct engine pack and references.

## When not to use

- Language/framework-only work where the real risk is application architecture, not data storage.
- Single-engine deep work when the target engine is already known and its engine pack should be loaded directly.
- Local mobile persistence tasks that are clearly `drift-flutter`.

## Engine selection

| Situation | Engine |
| --- | --- |
| Relational OLTP, self-hosted or cloud | Postgres |
| Relational OLTP, MySQL-compatible managed service | MySQL + Vitess |
| Multi-tenant SaaS needing horizontal Postgres scale | Neki |
| Document model, flexible schema | MongoDB |
| Mobile, desktop, or edge local storage | SQLite |
| BaaS with built-in auth, storage, and realtime | Supabase |
| Caching, queues, leaderboards, pub/sub | Redis |

## Required flow

1. Read `references/LATEST_VERSIONS.md` before proposing version-specific behavior.
2. Use the engine selection table above to pick the target engine.
3. Load the target engine `SKILL.md` and only the relevant `references/*` files that match the task.
4. Provide a plan that includes the proposed change, indexing or schema decisions, migration safety, and rollback path.
5. For production-impacting changes, include blast-radius assessment and rollout stages.

## Cross-engine checklist

- Add indexes only for real predicates and sort patterns.
- Prefer keyset or seek pagination for deep/high-throughput access patterns.
- Compare before/after plans with engine-native explain tooling.
- Do not propose destructive data or schema operations without explicit user confirmation.
