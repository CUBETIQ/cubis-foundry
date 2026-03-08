---
name: "vitess"
description: "Use when the task is specifically Vitess or Vitess-backed MySQL platforms: shard-key design, vindexes, resharding, query-routing constraints, Online DDL, and operational tradeoffs for horizontally scaled MySQL."
license: MIT
metadata:
  version: "3.0.0"
  domain: "data"
  role: "specialist"
  stack: "vitess"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "stable"
  baseline: "vitess-aware sharded mysql design"
  tags: ["vitess", "sharding", "mysql", "vindexes", "online-ddl", "routing"]
---

# Vitess

## When to use

- The engine is Vitess or a Vitess-backed managed MySQL platform.
- The problem depends on shard keys, vindexes, resharding, query routing, or Online DDL behavior.
- You need guidance for scaling MySQL horizontally rather than treating it like a single-node database.

## When not to use

- The workload is not actually sharded or distributed.
- The real issue is generic MySQL tuning with no Vitess-specific constraint.
- The engine is Postgres, Neki, MongoDB, SQLite, Redis, or Supabase.

## Core workflow

1. Confirm whether the task is schema design, query shape, shard-key choice, or operational scaling.
2. Make entity ownership and routing key choice explicit before optimizing anything else.
3. Check whether queries respect shard boundaries and Vitess execution constraints.
4. Plan Online DDL, resharding, and rollback with operational evidence.
5. Report the coupling, fan-out, and migration risks that remain after the change.

## Baseline standards

- Choose shard keys from access patterns and ownership, not convenience.
- Minimize cross-shard fan-out and hidden coordination costs.
- Treat Online DDL and resharding as operational programs, not single commands.
- Keep query routing constraints visible to application teams.

## Avoid

- Designing as if the database were a single-node MySQL instance.
- Late shard-key decisions after application coupling hardens.
- Cross-shard joins or transactions without explicit justification.
- Treating Vitess complexity as free scale.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/vitess-checklist.md` | You need deeper Vitess guidance for shard keys, vindexes, query routing, resharding, and Online DDL tradeoffs. |
