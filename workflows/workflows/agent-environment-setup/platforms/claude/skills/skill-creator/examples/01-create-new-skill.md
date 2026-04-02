# Example: Create a New Skill

## User Request

> Create a skill called "redis-patterns" for production Redis usage patterns including caching strategies, pub/sub, streams, and cluster management.

## Skill Creator Output

### Step 1: Gather Requirements

**Domain:** Redis database usage patterns
**Audience:** Backend developers using Redis in production
**Trigger conditions:** Redis caching, pub/sub, streams, cluster, session storage, rate limiting

### Step 2: Generate SKILL.md

```yaml
---
name: redis-patterns
description: "Use when implementing Redis caching strategies, pub/sub messaging, Redis Streams for event processing, cluster management, session storage, or rate limiting. Covers Redis 7.4+ features including functions, triggers, and probabilistic data structures."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
```

### Step 3: Write Instructions (12-18, WHAT+WHY format)

1. **Select the appropriate Redis data structure for the access pattern** — use Strings for simple key-value, Hashes for object fields, Sorted Sets for ranked data, and Streams for event logs, because choosing the wrong data structure leads to excessive memory usage and slow operations.

2. **Set TTL on every cache key** — unbounded caches grow until Redis runs out of memory and triggers eviction, because eviction under memory pressure is unpredictable and can evict critical keys.

[...continues with 14-16 more instructions...]

### Step 4: Create Reference Files

- `references/caching-strategies.md` — Cache-aside, write-through, write-behind patterns
- `references/pubsub-streams.md` — Pub/Sub vs Streams, consumer groups, acknowledgment
- `references/cluster.md` — Cluster topology, hash slots, failover, client routing
- `references/data-structures.md` — Deep dive on each data type with time complexity
- `references/monitoring.md` — Slow log, memory analysis, Sentinel, metrics

### Step 5: Create Evals

```json
{
  "evals": [
    {
      "prompt": "Design a caching strategy for a product catalog API with 100K products...",
      "assertions": [...]
    }
  ]
}
```

### Step 6: Quality Check

- [x] Valid YAML frontmatter
- [x] Description starts with "Use when..."
- [x] 16 instructions in WHAT+WHY format
- [x] References table with 5 files
- [x] evals.json with 2 evals, 5 assertions each
- [x] examples/ with 2 files
