---
name: vitess
description: "Use when the task is specifically Vitess or Vitess-backed MySQL platforms: shard-key design, vindexes, resharding, query-routing constraints, Online DDL, and operational tradeoffs for horizontally scaled MySQL."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Vitess

## Purpose

Use when the task is specifically Vitess or Vitess-backed MySQL platforms: shard-key design, vindexes, resharding, query-routing constraints, Online DDL, and operational tradeoffs for horizontally scaled MySQL.

## When to Use

- The engine is Vitess or a Vitess-backed managed MySQL platform.
- The problem depends on shard keys, vindexes, resharding, query routing, or Online DDL behavior.
- You need guidance for scaling MySQL horizontally rather than treating it like a single-node database.

## Instructions

1. Confirm whether the task is schema design, query shape, shard-key choice, or operational scaling.
2. Make entity ownership and routing key choice explicit before optimizing anything else.
3. Check whether queries respect shard boundaries and Vitess execution constraints.
4. Plan Online DDL, resharding, and rollback with operational evidence.
5. Report the coupling, fan-out, and migration risks that remain after the change.

### Baseline standards

- Choose shard keys from access patterns and ownership, not convenience.
- Minimize cross-shard fan-out and hidden coordination costs.
- Treat Online DDL and resharding as operational programs, not single commands.
- Keep query routing constraints visible to application teams.

### Constraints

- Avoid designing as if the database were a single-node MySQL instance.
- Avoid late shard-key decisions after application coupling hardens.
- Avoid cross-shard joins or transactions without explicit justification.
- Avoid treating Vitess complexity as free scale.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/vitess-checklist.md` | You need deeper Vitess guidance for shard keys, vindexes, query routing, resharding, and Online DDL tradeoffs. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with vitess best practices in this project"
- "Review my vitess implementation for issues"
