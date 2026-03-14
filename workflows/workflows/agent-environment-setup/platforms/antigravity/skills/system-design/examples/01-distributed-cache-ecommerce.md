# Example: Distributed Cache for E-Commerce Catalog

## Prompt

> Design a caching layer for our product catalog. We serve 50K reads/sec, have 2M products, and merchants update ~500 products per minute. Latency target is p99 < 10ms. What caching strategy, topology, and invalidation approach should we use?

## Response

### Requirements Summary

| Metric | Value |
|--------|-------|
| Read QPS | 50,000 |
| Catalog size | 2,000,000 products |
| Update rate | ~500 writes/min (~8/sec) |
| Latency target | p99 < 10ms |
| Read/write ratio | ~6000:1 (heavily read-biased) |

### Caching Pattern: Cache-Aside

Cache-aside is the correct pattern for this workload because:

- The read-to-write ratio (6000:1) means nearly all traffic hits the cache.
- The application controls cache population on miss, avoiding unnecessary cache writes for rarely-accessed products.
- Write-through would add latency to the merchant update path without proportional benefit given the low write rate.
- Write-behind adds complexity and risk of data loss for minimal gain at 8 writes/sec.

### Cache Topology

```
                  ┌──────────────────────┐
                  │    Load Balancer      │
                  └──────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼───┐    ┌────▼───┐    ┌────▼───┐
         │ App-1  │    │ App-2  │    │ App-3  │
         │ L1 LRU │    │ L1 LRU │    │ L1 LRU │
         └────┬───┘    └────┬───┘    └────┬───┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                  ┌──────────▼───────────┐
                  │   Redis Cluster (L2) │
                  │   6 nodes, 3 primary │
                  │   consistent hashing │
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │  PostgreSQL (source)  │
                  │  read replicas x3    │
                  └──────────────────────┘
```

**L1 (in-process):** 10,000-entry LRU per application instance. TTL: 30 seconds. Absorbs ~40% of reads for hot products. Near-zero latency.

**L2 (Redis Cluster):** 6-node cluster with 3 primaries and 3 replicas. Keys distributed via consistent hashing with 150 virtual nodes per physical node to ensure even distribution. TTL: 10 minutes.

### Invalidation Strategy

Passive TTL alone is insufficient. With 500 updates/minute, a 10-minute TTL means customers could see stale prices for up to 10 minutes after a merchant update.

**Active invalidation via event stream:**

1. Merchant updates product in PostgreSQL.
2. Application publishes `product.updated` event to Kafka topic.
3. Cache invalidation consumer receives the event and issues `DEL product:{id}` to Redis.
4. Next read triggers a cache miss and populates the cache with fresh data.

**L1 invalidation:** Broadcast invalidation messages via Redis Pub/Sub. Each application instance subscribes and evicts the key from its local LRU. Staleness window: ~1 second.

### Failure Handling

| Failure | Behavior |
|---------|----------|
| Redis node failure | Consistent hashing redistributes keys to remaining nodes. Failover replica promoted. Circuit breaker prevents cascading retries. |
| Full Redis cluster outage | Application falls back to direct PostgreSQL reads via read replicas with rate limiting (10K QPS cap). L1 cache absorbs hot-key traffic. |
| Kafka consumer lag | TTL provides safety net. Stale data persists for at most 10 minutes. Alert on consumer lag > 60 seconds. |
| Thundering herd on cold start | Request coalescing: only one thread populates cache per key, others wait. Probabilistic early expiration for hot keys. |

### Capacity Estimates

| Item | Calculation | Result |
|------|-------------|--------|
| Per-product cache entry | avg 2KB (JSON + metadata) | 2KB |
| Full catalog in cache | 2M x 2KB | 4 GB |
| Hot set (20% of catalog) | 400K x 2KB | 800 MB |
| Redis memory (with overhead) | 4GB x 1.5 (fragmentation, metadata) | 6 GB |
| Redis cluster total | 6 GB x 2 (replication) | 12 GB across 6 nodes |

### Monitoring

- Cache hit ratio (target: > 95% at L2, > 40% at L1)
- p50/p95/p99 latency per cache tier
- Invalidation lag (time from DB write to cache eviction)
- Redis memory usage and eviction rate
- Circuit breaker state transitions
