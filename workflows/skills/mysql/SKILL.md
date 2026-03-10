---
name: mysql
description: "Use when the task is specifically MySQL or InnoDB: schema/index design, transaction behavior, replication-aware migrations, query tuning, and managed MySQL operational tradeoffs."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# MySQL

## Purpose

Use when the task is specifically MySQL or InnoDB: schema/index design, transaction behavior, replication-aware migrations, query tuning, and managed MySQL operational tradeoffs.

## When to Use

- The engine is MySQL, MariaDB-compatible MySQL, or a managed MySQL platform.
- The task depends on InnoDB behavior, replication, Online DDL, or MySQL-specific indexing/query behavior.
- You need MySQL-aware migration, lock, or read/write topology guidance.

## Instructions

1. Confirm MySQL variant, version, topology, and operational constraints.
2. Identify the dominant query and write patterns before changing schema or indexes.
3. Design for InnoDB realities: clustering, covering indexes, transaction scope, and lock impact.
4. Plan migrations around Online DDL behavior, replicas, and rollback constraints.
5. Re-check with query-plan evidence and operational safety notes.

### Baseline standards

- Optimize for actual read/write mix, not synthetic benchmarks.
- Keep transaction boundaries tight and predictable.
- Treat index shape and row access order as first-class design concerns.
- Make replication lag, schema rollout, and failover constraints explicit.

### Constraints

- Avoid wide indexes with no evidence.
- Avoid large DDL changes without topology-aware rollout.
- Avoid assuming MySQL and Postgres tuning rules are interchangeable.
- Avoid hiding consistency tradeoffs behind ORM defaults.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/mysql-checklist.md` | You need a deeper MySQL playbook for InnoDB behavior, Online DDL, replication-aware rollout, and index tradeoffs. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with mysql best practices in this project"
- "Review my mysql implementation for issues"
