---
name: "neki"
description: "Use when the task is specifically Neki, PlanetScale’s sharded Postgres architecture: shard-key design, distributed Postgres tradeoffs, routing constraints, and operational decisions for large-scale Postgres workloads."
license: MIT
metadata:
  version: "3.0.0"
  domain: "data"
  role: "specialist"
  stack: "neki"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "experimental"
  baseline: "neki-aware sharded postgres design"
  tags: ["neki", "postgres", "sharding", "planetscale", "distributed-postgres", "routing"]
---

# Neki

## When to use

- The task is specifically about Neki or PlanetScale’s sharded Postgres posture.
- The problem depends on shard keys, distributed Postgres behavior, routing constraints, or operational scaling tradeoffs.
- You need guidance that differs from plain single-cluster Postgres assumptions.

## When not to use

- Standard Postgres guidance is sufficient.
- The system is Vitess/MySQL rather than sharded Postgres.
- The workload is not at a scale where distributed Postgres constraints matter.

## Core workflow

1. Confirm what is known about the Neki deployment and which product constraints are actually available today.
2. Separate normal Postgres reasoning from sharding-specific concerns such as routing, fan-out, and ownership.
3. Make shard-key and entity-boundary choices explicit before proposing query or schema changes.
4. Prefer conservative operational guidance when platform details are still evolving.
5. Report assumptions, unknowns, and fallback plans clearly.

## Baseline standards

- Treat Neki as sharded Postgres, not just “Postgres but bigger.”
- Keep assumptions explicit because the platform is still evolving.
- Design around ownership, routing, and predictable access paths.
- Fall back to standard Postgres guidance whenever a Neki-specific claim is not well supported.

## Avoid

- Assuming all Postgres features behave identically in a sharded environment.
- Recommending cross-shard patterns without evidence.
- Hiding uncertainty when product details are incomplete.
- Using Neki-specific advice when plain Postgres guidance would be safer.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/neki-checklist.md` | You need a sharper Neki-specific checklist for sharded Postgres assumptions, routing, uncertainty handling, and fallback to plain Postgres guidance. |
