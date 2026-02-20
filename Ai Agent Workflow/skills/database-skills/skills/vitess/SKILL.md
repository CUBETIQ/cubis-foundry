---
name: vitess
description: Vitess and sharded MySQL planning, VSchema, routing, and online schema migration concerns.
---

# Vitess

Load references as needed:
- `references/sharding-routing.md`
- `references/operational-safety.md`

Key rules:
- Model entity ownership before keyspace/shard strategy.
- Avoid cross-shard patterns unless explicitly required.
- Plan online schema changes with observability checkpoints.
