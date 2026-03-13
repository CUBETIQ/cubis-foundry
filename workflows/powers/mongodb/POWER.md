````markdown
---
inclusion: manual
name: mongodb
description: "Use when the task is specifically MongoDB: document-model design, aggregation pipelines, index strategy, shard-key tradeoffs, and operational guidance for document workloads."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# MongoDB

## Purpose

Use when the task is specifically MongoDB: document-model design, aggregation pipelines, index strategy, shard-key tradeoffs, and operational guidance for document workloads.

## When to Use

- The engine is MongoDB or a MongoDB-compatible managed service.
- The task depends on document modeling, aggregation pipelines, compound indexes, or shard-key behavior.
- You need MongoDB-aware schema evolution or query guidance.

## Instructions

1. Confirm document boundaries, write patterns, and query shape.
2. Choose embed vs reference deliberately from update and read behavior.
3. Design indexes and aggregation stages around actual filters, sorts, and fan-out.
4. Make schema evolution, validation, and shard-key risk explicit when relevant.
5. Re-check operational impact with evidence from query behavior and workload hotspots.

### Baseline standards

- Model documents from access patterns, not from relational habit alone.
- Keep schema validation and lifecycle rules explicit even in flexible models.
- Treat shard-key choice as a product-level scaling decision.
- Use aggregation only when it improves the real workflow, not because it can.

### Constraints

- Avoid unbounded document growth.
- Avoid overusing references or embeds without workload evidence.
- Avoid weak validation because the database is “schema-less.”.
- Avoid premature sharding with no distribution evidence.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/mongodb-checklist.md` | You need deeper MongoDB guidance for embed-vs-reference choices, aggregation, indexing, validation, and shard-key tradeoffs. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with mongodb best practices in this project"
- "Review my mongodb implementation for issues"
````
