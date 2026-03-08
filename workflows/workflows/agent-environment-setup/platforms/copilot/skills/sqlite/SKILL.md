---
name: "sqlite"
description: "Use when the task is specifically SQLite or libSQL/Turso-style SQLite: local-first schema design, WAL/concurrency tradeoffs, embedded deployments, and lightweight migration strategy."
license: MIT
metadata:
  version: "3.0.0"
  domain: "data"
  role: "specialist"
  stack: "sqlite"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "stable"
  baseline: "modern sqlite engineering"
  tags: ["sqlite", "libsql", "turso", "embedded", "wal", "local-first"]
---
# SQLite

## When to use

- The engine is SQLite, libSQL, Turso, or another SQLite-derived deployment.
- The task depends on embedded/local-first behavior, WAL mode, file-level concurrency, or sync constraints.
- You need SQLite-aware schema, migration, or indexing guidance.

## When not to use

- The workload clearly requires a server database and operational coordination beyond SQLite’s model.
- The issue is purely app-layer logic with no persistence-specific behavior.
- The engine is actually Postgres, MySQL, MongoDB, Redis, or another managed service.

## Core workflow

1. Confirm whether the workload is embedded, mobile, edge, or remotely replicated SQLite.
2. Model data and indexes around the read paths while keeping writes and locking behavior visible.
3. Decide WAL, foreign key, sync, and migration posture explicitly.
4. Validate whether single-writer and file-level concurrency constraints remain acceptable.
5. Report operational caveats such as replication, backup, and schema rollout behavior.

## Baseline standards

- Prefer simple relational design and predictable transactions.
- Keep migrations small and reversible.
- Treat write concurrency and sync semantics as product constraints, not implementation details.
- Use SQLite because the workload fits it, not because setup is easy.

## Avoid

- Assuming server-database scaling behavior.
- Ignoring WAL, checkpointing, or file-lock realities.
- Large migration steps with no rollback or recovery plan.
- Using SQLite past the point where product constraints clearly demand a different engine.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/sqlite-checklist.md` | You need a deeper SQLite playbook for WAL, concurrency, local-first deployment, sync constraints, and lightweight migration posture. |
