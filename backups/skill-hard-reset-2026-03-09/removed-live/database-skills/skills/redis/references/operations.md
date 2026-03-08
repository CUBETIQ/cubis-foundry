# Redis — Operations, Memory, and Latency

## Memory management

Redis stores all data in memory. Running out of memory is the #1 operational failure mode.

### Monitor memory

```redis
INFO memory
# Key fields:
# used_memory_human        — actual data memory
# used_memory_rss_human    — RSS from OS (includes fragmentation)
# mem_fragmentation_ratio  — rss / used. >1.5 = high fragmentation
# maxmemory                — configured limit (0 = unlimited — dangerous)
# maxmemory_human          — human readable limit
```

Always set `maxmemory`:
```redis
CONFIG SET maxmemory 2gb
```

### Eviction policies

When `maxmemory` is reached, Redis uses the configured eviction policy:

| Policy | Behavior |
| --- | --- |
| `noeviction` | Returns error on writes — safe for primary data stores |
| `allkeys-lru` | Evicts least recently used keys — good for caches |
| `volatile-lru` | Evicts LRU keys that have a TTL set |
| `allkeys-lfu` | Evicts least frequently used — better than LRU for skewed access |
| `volatile-ttl` | Evicts keys with shortest remaining TTL first |
| `allkeys-random` | Random eviction — rarely useful |

For pure caches: `allkeys-lru` or `allkeys-lfu`.
For mixed primary + cache data: `volatile-lru` (only evicts keys with TTL).

```redis
CONFIG SET maxmemory-policy allkeys-lru
```

### Handle fragmentation

When `mem_fragmentation_ratio > 1.5`, trigger active defragmentation (Redis 4.0+):
```redis
CONFIG SET activedefrag yes
CONFIG SET active-defrag-ignore-bytes 100mb
CONFIG SET active-defrag-threshold-lower 10
```

## Latency diagnostics

Redis should respond in microseconds. If you're seeing millisecond latency, investigate:

```redis
# Check for slow commands (logged automatically)
SLOWLOG GET 10
SLOWLOG LEN
SLOWLOG RESET

# Default slow threshold is 10ms — lower for tighter monitoring:
CONFIG SET slowlog-log-slower-than 1000   # microseconds = 1ms

# Latency history (built-in latency monitoring)
LATENCY LATEST
LATENCY HISTORY event_name
LATENCY RESET
```

### Common latency causes

| Cause | Symptom | Fix |
| --- | --- | --- |
| `KEYS *` in production | Periodic spikes | Replace with `SCAN` |
| Large key values (MB-range) | Slow reads/writes | Chunk data or use a different store |
| AOF fsync on every write | Consistent high latency | Switch to `fsync everysec` |
| Memory pressure / eviction | Increasing latency trend | Add memory or tune eviction |
| Blocking commands (`BLPOP`, `BRPOP`) | Thread holds connection | Use timeouts |
| Fork for RDB/AOF rewrite | Latency spike every N minutes | Schedule rewrites in off-peak windows |

## Persistence configuration

Choose based on durability requirements:

| Config | Durability | Performance |
| --- | --- | --- |
| No persistence | None (cache only) | Fastest |
| RDB snapshots only | Up to snapshot interval | Fast |
| AOF `everysec` | Up to ~1s of data loss | Good |
| AOF `always` | No data loss | Slowest — 1 fsync per write |
| RDB + AOF | Best of both | Moderate |

For caches where losing data on restart is acceptable, disable persistence:
```redis
CONFIG SET save ""         # disable RDB
CONFIG SET appendonly no   # disable AOF
```

## Monitor key space

```redis
# Count keys per database
INFO keyspace

# Sample key patterns (does not block)
redis-cli --scan --pattern 'user:*' | head -20

# Key size distribution — pick a sample
redis-cli --bigkeys       # finds largest keys by type
```

## Connection limits

```redis
INFO clients
# connected_clients       — current connections
# maxclients              — configured limit (default 10000)
```

Redis is single-threaded for command execution. High connection counts add overhead via:
- Select/poll overhead on the socket set.
- Memory per connection (~20KB).

Use a connection pool in your application. Most Redis clients (ioredis, redis-py) pool by default. Check pool size matches your concurrency model.

## Key expiry and eviction monitoring

```redis
INFO stats
# expired_keys     — keys removed by TTL expiry since start
# evicted_keys     — keys removed by maxmemory policy
# keyspace_hits    — cache hit count
# keyspace_misses  — cache miss count

# Hit rate = hits / (hits + misses). Below 80% suggests key design issues.
```

## Sources
- Memory optimization: https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/
- Latency optimization: https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/
- Persistence options: https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
- SLOWLOG: https://redis.io/docs/latest/commands/slowlog/
