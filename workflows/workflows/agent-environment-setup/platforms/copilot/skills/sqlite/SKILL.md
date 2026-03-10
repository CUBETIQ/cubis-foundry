---
name: sqlite
description: "Use when the task is specifically SQLite or libSQL/Turso-style SQLite: local-first schema design, WAL/concurrency tradeoffs, embedded deployments, and lightweight migration strategy."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# SQLite

## Purpose

Use when the task is specifically SQLite or libSQL/Turso-style SQLite: local-first schema design, WAL/concurrency tradeoffs, embedded deployments, and lightweight migration strategy.

## When to Use

- The engine is SQLite, libSQL, Turso, or another SQLite-derived deployment.
- The task depends on embedded/local-first behavior, WAL mode, file-level concurrency, or sync constraints.
- You need SQLite-aware schema, migration, or indexing guidance.

## Instructions

1. Confirm whether the workload is embedded, mobile, edge, or remotely replicated SQLite.
2. Model data and indexes around the read paths while keeping writes and locking behavior visible.
3. Decide WAL, foreign key, sync, and migration posture explicitly.
4. Validate whether single-writer and file-level concurrency constraints remain acceptable.
5. Report operational caveats such as replication, backup, and schema rollout behavior.

### Baseline standards

- Prefer simple relational design and predictable transactions.
- Keep migrations small and reversible.
- Treat write concurrency and sync semantics as product constraints, not implementation details.
- Use SQLite because the workload fits it, not because setup is easy.

### Constraints

- Avoid assuming server-database scaling behavior.
- Avoid ignoring WAL, checkpointing, or file-lock realities.
- Avoid large migration steps with no rollback or recovery plan.
- Avoid using SQLite past the point where product constraints clearly demand a different engine.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/sqlite-checklist.md` | You need a deeper SQLite playbook for WAL, concurrency, local-first deployment, sync constraints, and lightweight migration posture. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with sqlite best practices in this project"
- "Review my sqlite implementation for issues"
