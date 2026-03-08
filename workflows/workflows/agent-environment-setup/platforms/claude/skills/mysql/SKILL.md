---
name: "mysql"
description: "Use when the task is specifically MySQL or InnoDB: schema/index design, transaction behavior, replication-aware migrations, query tuning, and managed MySQL operational tradeoffs."
license: MIT
metadata:
  version: "3.0.0"
  domain: "data"
  role: "specialist"
  stack: "mysql"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "stable"
  baseline: "modern mysql engineering"
  tags: ["mysql", "innodb", "replication", "online-ddl", "indexes", "transactions"]
---

# MySQL

## When to use

- The engine is MySQL, MariaDB-compatible MySQL, or a managed MySQL platform.
- The task depends on InnoDB behavior, replication, Online DDL, or MySQL-specific indexing/query behavior.
- You need MySQL-aware migration, lock, or read/write topology guidance.

## When not to use

- The real decision is engine selection, not MySQL implementation.
- The workload is fundamentally Postgres, SQLite, MongoDB, Redis, Vitess, or Supabase-specific.
- The problem is generic schema design with no MySQL-specific behavior.

## Core workflow

1. Confirm MySQL variant, version, topology, and operational constraints.
2. Identify the dominant query and write patterns before changing schema or indexes.
3. Design for InnoDB realities: clustering, covering indexes, transaction scope, and lock impact.
4. Plan migrations around Online DDL behavior, replicas, and rollback constraints.
5. Re-check with query-plan evidence and operational safety notes.

## Baseline standards

- Optimize for actual read/write mix, not synthetic benchmarks.
- Keep transaction boundaries tight and predictable.
- Treat index shape and row access order as first-class design concerns.
- Make replication lag, schema rollout, and failover constraints explicit.

## Avoid

- Wide indexes with no evidence.
- Large DDL changes without topology-aware rollout.
- Assuming MySQL and Postgres tuning rules are interchangeable.
- Hiding consistency tradeoffs behind ORM defaults.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/mysql-checklist.md` | You need a deeper MySQL playbook for InnoDB behavior, Online DDL, replication-aware rollout, and index tradeoffs. |
