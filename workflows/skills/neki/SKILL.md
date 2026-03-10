---
name: neki
description: "Use when the task is specifically Neki, PlanetScale’s sharded Postgres architecture: shard-key design, distributed Postgres tradeoffs, routing constraints, and operational decisions for large-scale Postgres workloads."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Neki

## Purpose

Use when the task is specifically Neki, PlanetScale’s sharded Postgres architecture: shard-key design, distributed Postgres tradeoffs, routing constraints, and operational decisions for large-scale Postgres workloads.

## When to Use

- The task is specifically about Neki or PlanetScale’s sharded Postgres posture.
- The problem depends on shard keys, distributed Postgres behavior, routing constraints, or operational scaling tradeoffs.
- You need guidance that differs from plain single-cluster Postgres assumptions.

## Instructions

1. Confirm what is known about the Neki deployment and which product constraints are actually available today.
2. Separate normal Postgres reasoning from sharding-specific concerns such as routing, fan-out, and ownership.
3. Make shard-key and entity-boundary choices explicit before proposing query or schema changes.
4. Prefer conservative operational guidance when platform details are still evolving.
5. Report assumptions, unknowns, and fallback plans clearly.

### Baseline standards

- Treat Neki as sharded Postgres, not just “Postgres but bigger.”
- Keep assumptions explicit because the platform is still evolving.
- Design around ownership, routing, and predictable access paths.
- Fall back to standard Postgres guidance whenever a Neki-specific claim is not well supported.

### Constraints

- Avoid assuming all Postgres features behave identically in a sharded environment.
- Avoid recommending cross-shard patterns without evidence.
- Avoid hiding uncertainty when product details are incomplete.
- Avoid using Neki-specific advice when plain Postgres guidance would be safer.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/neki-checklist.md` | You need a sharper Neki-specific checklist for sharded Postgres assumptions, routing, uncertainty handling, and fallback to plain Postgres guidance. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with neki best practices in this project"
- "Review my neki implementation for issues"
