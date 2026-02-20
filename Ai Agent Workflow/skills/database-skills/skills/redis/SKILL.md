---
name: redis
description: Redis data modeling, caching strategy, latency tuning, and operational safety.
---

# Redis

Load references as needed:
- `references/cache-patterns.md`
- `references/operations.md`

Key rules:
- Treat Redis as a data structure server, not generic storage.
- Define TTL, invalidation, and consistency strategy upfront.
- Monitor memory, eviction policy, and command latency.
