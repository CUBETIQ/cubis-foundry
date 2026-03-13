````markdown
---
inclusion: manual
name: redis
description: "Use when the task is specifically Redis: cache design, key strategy, TTLs, queues, rate limiting, pub/sub, memory tradeoffs, and safe persistence or eviction decisions."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Redis

## Purpose

Use when the task is specifically Redis: cache design, key strategy, TTLs, queues, rate limiting, pub/sub, memory tradeoffs, and safe persistence or eviction decisions.

## When to Use

- The task is specifically about Redis for cache, coordination, queue, rate-limit, or ephemeral data behavior.
- You need Redis-aware key design, TTL, eviction, persistence, or memory guidance.
- The workload depends on Redis data structures or latency-sensitive read paths.

## Instructions

1. Confirm whether Redis is cache, queue, coordination layer, or primary transient store.
2. Define key shape, TTL, invalidation, and cardinality expectations explicitly.
3. Choose the smallest data structure and persistence posture that fits the workload.
4. Check memory pressure, eviction, hot-key risk, and failure behavior.
5. Validate correctness under cache misses, stale data, and failover.

### Baseline standards

- Treat invalidation and staleness as design work, not cleanup.
- Prefer simple keys and clear TTL policy.
- Make persistence and recovery expectations explicit.
- Use Redis to reduce latency or coordination cost, not to hide data-model ambiguity.

### Constraints

- Avoid permanent business truth in cache without justification.
- Avoid unbounded key growth or missing TTL strategy.
- Avoid complex Lua or multi-step logic where simpler patterns would suffice.
- Avoid ignoring eviction behavior in production planning.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/redis-checklist.md` | You need a deeper Redis playbook for keys, TTL, invalidation, eviction, queues, and persistence tradeoffs. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with redis best practices in this project"
- "Review my redis implementation for issues"
````
