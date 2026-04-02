# Caching Strategies

## Cache Patterns

### Cache-Aside (Lazy Loading)

```
Read path:
  1. Application checks cache
  2. Cache HIT → return cached data
  3. Cache MISS → read from database → write to cache → return data

Write path:
  1. Application writes to database
  2. Application invalidates (deletes) the cache entry
  3. Next read will populate the cache with fresh data
```

| Pro | Con |
|-----|-----|
| Application controls cache population | Cache miss penalty on first access |
| Only requested data is cached | Potential stale data between write and invalidation |
| Cache failure does not block writes | Application must implement caching logic |

**Best for:** Read-heavy workloads with tolerance for brief staleness. Most common pattern.

### Write-Through

```
Write path:
  1. Application writes to cache AND database simultaneously
  2. Write is acknowledged only after both succeed

Read path:
  1. Application reads from cache (always populated)
```

| Pro | Con |
|-----|-----|
| Cache is always consistent with database | Write latency increased (two writes per operation) |
| No cache miss on read after write | All data is cached, even if rarely read |
| Simpler read path | Cache and database must be coordinated |

**Best for:** Read-after-write consistency is critical. Small datasets where caching everything is feasible.

### Write-Behind (Write-Back)

```
Write path:
  1. Application writes to cache only
  2. Cache asynchronously flushes to database (batched, delayed)

Read path:
  1. Application reads from cache (always populated)
```

| Pro | Con |
|-----|-----|
| Write latency is minimal (cache only) | Risk of data loss if cache fails before flush |
| Batched writes reduce database load | Increased complexity for durability guarantees |
| Excellent for write-heavy workloads | Debugging is harder (data in cache may not be in DB yet) |

**Best for:** Write-heavy workloads where brief data loss is acceptable (analytics, counters, session data).

### Read-Through

```
Read path:
  1. Application asks cache for data
  2. Cache checks itself
  3. Cache MISS → cache fetches from database, stores, returns
  4. Cache HIT → returns data

Application never talks to database directly for reads.
```

| Pro | Con |
|-----|-----|
| Application code is simpler (no cache logic) | Cache must know how to fetch from the data source |
| Consistent caching behavior | Less flexibility for complex query patterns |

**Best for:** CDNs, proxy caches, ORM-level caching layers.

## Cache Invalidation

### Strategies

| Strategy | How | When to use |
|----------|-----|------------|
| **TTL-based** | Set expiration time on cache entries | All caches (safety net) |
| **Event-driven** | Publish invalidation event on data change | When freshness matters (< 1 min staleness) |
| **Version-based** | Include version number in cache key | When data changes infrequently |
| **Write-invalidate** | Delete cache entry on write | Cache-aside pattern (most common) |
| **Write-update** | Update cache entry on write | When recomputing is cheap, reads are frequent |

### TTL Selection

| Data type | TTL | Rationale |
|-----------|-----|-----------|
| User session | 30 min | Security: sessions should expire |
| Product catalog | 5-15 min | Merchant updates should be visible within minutes |
| Configuration | 1-5 min | Config changes should propagate quickly |
| Static assets | 1 year + versioned URL | Immutable content, cache-busted by URL |
| Search results | 30-60 sec | Frequently changing, high volume |
| User preferences | 1 hour | Changes infrequently, not time-critical |

### Thundering Herd Prevention

When a popular cache entry expires, many concurrent requests hit the database simultaneously:

**Mitigation 1: Request Coalescing (Singleflight)**
Only one request fetches from the database. All other concurrent requests wait for and share the result.

```go
// Go example with singleflight
group := singleflight.Group{}
result, err, _ := group.Do(cacheKey, func() (interface{}, error) {
    return fetchFromDatabase(key)
})
```

**Mitigation 2: Probabilistic Early Expiration**
Each request has a small probability of refreshing the cache before TTL expires:

```
effective_ttl = ttl - (random() * beta * log(random()))
```

Hot keys are refreshed early by one of the many readers, preventing synchronized expiration.

**Mitigation 3: Stale-While-Revalidate**
Return the stale cached value immediately while fetching fresh data in the background:

```
Cache-Control: max-age=300, stale-while-revalidate=60
```

For 300 seconds, return cached data. For the next 60 seconds, return stale data while revalidating.

## Cache Topology

### Local (In-Process) Cache

```
Application process
  └── LRU cache (ConcurrentHashMap, Caffeine, lru-cache)
      ├── Capacity: 1,000-50,000 entries
      ├── TTL: 10-60 seconds
      └── Latency: < 1ms (memory access)
```

Pros: Fastest possible. No network hop.
Cons: Per-instance (not shared), memory pressure, cold after restart.

### Remote Distributed Cache

```
Application ──network──► Redis Cluster / Memcached
                           ├── Capacity: 10GB-1TB
                           ├── TTL: minutes to hours
                           └── Latency: 0.5-2ms (network RTT)
```

Pros: Shared across instances, survives restarts, large capacity.
Cons: Network latency, operational complexity, serialization overhead.

### Multi-Tier (L1 + L2)

```
Application
  └── L1: Local LRU (hot entries, 30s TTL)
       └── L2: Redis Cluster (warm entries, 10min TTL)
            └── L3: Database (source of truth)
```

L1 absorbs hot-key traffic (40-60% hit rate). L2 handles the rest (90-95% hit rate). Database sees only 5-10% of total read traffic.

Invalidation flow: L2 invalidation broadcasts to all L1 instances via pub/sub.

## Cache Key Design

### Key Structure

```
{namespace}:{entity}:{identifier}:{version}
user:profile:12345:v2
product:detail:sku-abc:v1
search:results:q=shoes&page=1:v1
```

Rules:
- Include a namespace to prevent collisions between different cache consumers.
- Include a version to enable schema changes without full cache flush.
- Keep keys short: Redis performance degrades with very long keys.
- Use consistent hashing-friendly keys (no random components).

### Key Anti-Patterns

- **User-specific keys without bounds:** `user:{id}:feed` for 10M users = 10M cache entries.
- **Composite keys with too many dimensions:** `product:{id}:color:{c}:size:{s}:locale:{l}` explodes combinatorially.
- **Keys containing mutable data:** `user:{name}:profile` breaks when username changes.

## Monitoring

| Metric | Target | Alert when |
|--------|--------|------------|
| Hit ratio | > 90% (L2), > 40% (L1) | Drops below 80% (L2) for 5 minutes |
| Latency p99 | < 2ms (Redis) | Exceeds 5ms for 5 minutes |
| Memory usage | < 80% of allocated | Exceeds 85% (eviction starts) |
| Eviction rate | Near zero | Sustained evictions (underprovised) |
| Connection pool utilization | < 70% | Exceeds 85% (pool exhaustion risk) |
| Key count | Within expected range | 2x above expected (leak or missing TTL) |

## Cache Consistency Patterns

| Pattern | Consistency | Complexity | Use when |
|---------|------------|------------|----------|
| Invalidate on write | Eventual (next read) | Low | Most applications |
| Update on write | Immediate for same key | Medium | Read-after-write critical |
| Double-delete | Stronger eventual | Medium | Race conditions between cache and DB |
| Event-driven invalidation | Eventual (event lag) | Higher | Multi-service, many cache consumers |
| Cache-database transaction | Strong | High | Financial, compliance-critical data |

### Double-Delete Pattern

```
1. Delete cache entry
2. Update database
3. Wait ~500ms
4. Delete cache entry again
```

The second delete catches race conditions where a concurrent read re-populated the cache with stale data between steps 1 and 2.
