---
name: redis
description: Redis data modeling, caching strategy, throughput/latency optimization, and operational safety.
---
# Redis

## Optimization workflow

1. Define key schema and TTL policy first.
2. Reduce round-trips with pipelining and batching.
3. Tune memory footprint by data structure choice.
4. Diagnose latency with server + system context.
5. Validate hot-key and cluster-slot distribution for scale.

## Indexing-style patterns in Redis

- Redis is key-based; design key schema as your primary access index.
- Use sorted sets and secondary lookup structures for query-like access.
- Use `SCAN`-family commands for incremental traversal; avoid `KEYS` in production.

## Pagination techniques

- For ordered feeds/leaderboards, paginate with sorted set score/member boundaries.
- For keyspace traversal, cursor-based `SCAN` pagination only.

## Performance guardrails

- Keep value payloads bounded; avoid giant hot keys.
- Monitor expiry storms and eviction behavior.
- Use realistic load tests for pipeline and memory tuning.

## References

- `references/cache-patterns.md`
- `references/operations.md`
