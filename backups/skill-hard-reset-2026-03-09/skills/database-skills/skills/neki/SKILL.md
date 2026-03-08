---
name: neki
description: Neki planning guidance for sharded Postgres architecture decisions and operational guardrails.
---

# Neki

Neki is currently pre-GA (announced and under active development), so guidance is architecture-first and risk-aware.

## Planning workflow

1. Define shard key, tenant locality, and cross-shard boundaries.
2. Map query classes to expected shard-local or cross-shard paths.
3. Define migration milestones and fallback checkpoints.
4. Preserve compatibility path with current managed Postgres baseline.

## Performance planning focus

- Prioritize shard-local access for hot request paths.
- Plan read/write amplification expectations early.
- Avoid hard assumptions about undocumented internals.

## References

- `references/architecture.md`
- `references/operations.md`
