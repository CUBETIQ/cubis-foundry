---
name: "redis"
description: "Use when the task is specifically Redis: cache design, key strategy, TTLs, queues, rate limiting, pub/sub, memory tradeoffs, and safe persistence or eviction decisions."
license: MIT
metadata:
  version: "3.0.0"
  domain: "data"
  role: "specialist"
  stack: "redis"
  category: "databases"
  layer: "databases"
  canonical: true
  maturity: "stable"
  baseline: "modern redis engineering"
  tags: ["redis", "cache", "ttl", "queues", "rate-limits", "eviction"]
---

# Redis

## When to use

- The task is specifically about Redis for cache, coordination, queue, rate-limit, or ephemeral data behavior.
- You need Redis-aware key design, TTL, eviction, persistence, or memory guidance.
- The workload depends on Redis data structures or latency-sensitive read paths.

## When not to use

- Redis is being used as a default primary database with no strong justification.
- The issue is generic backend logic rather than cache or in-memory data behavior.
- The real system of record is another database and Redis-specific behavior is not the bottleneck.

## Core workflow

1. Confirm whether Redis is cache, queue, coordination layer, or primary transient store.
2. Define key shape, TTL, invalidation, and cardinality expectations explicitly.
3. Choose the smallest data structure and persistence posture that fits the workload.
4. Check memory pressure, eviction, hot-key risk, and failure behavior.
5. Validate correctness under cache misses, stale data, and failover.

## Baseline standards

- Treat invalidation and staleness as design work, not cleanup.
- Prefer simple keys and clear TTL policy.
- Make persistence and recovery expectations explicit.
- Use Redis to reduce latency or coordination cost, not to hide data-model ambiguity.

## Avoid

- Permanent business truth in cache without justification.
- Unbounded key growth or missing TTL strategy.
- Complex Lua or multi-step logic where simpler patterns would suffice.
- Ignoring eviction behavior in production planning.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/redis-checklist.md` | You need a deeper Redis playbook for keys, TTL, invalidation, eviction, queues, and persistence tradeoffs. |
