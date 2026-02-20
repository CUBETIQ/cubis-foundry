# Redis — Cache and Throughput Patterns

## Choosing the right data structure

This is the most important Redis decision. Using the wrong type causes unnecessary memory use and complexity.

| Use case | Data structure | Key pattern |
| --- | --- | --- |
| Single value / counter | `String` | `user:{id}:session` |
| Object with fields | `Hash` | `user:{id}` |
| Ordered leaderboard / timeline | `Sorted Set` (ZSET) | `leaderboard:global` |
| Unique membership / deduplication | `Set` | `online_users` |
| Message queue / feed | `List` (LPUSH/RPOP) or `Stream` | `queue:emails` |
| Feature flags per user | `Hash` or `Bitmap` | `flags:{user_id}` |
| Rate limiting | `String` + `INCR` + `EXPIRE` | `rate:{user_id}:{window}` |
| Time-series / event log | `Stream` | `events:{service}` |
| Pub/Sub fan-out | `Pub/Sub` channel | `channel:notifications` |

**Never** store serialized JSON in a `String` if you only need individual fields — use `Hash` and `HGET`/`HSET` to avoid deserializing the whole blob.

## Key naming conventions

Consistent naming prevents key collisions and makes `SCAN`-based debugging possible.

```
<namespace>:<entity>:<id>[:<field>]

user:42:session        → session token for user 42
product:99:views       → view counter for product 99
rate:192.168.1.1:1706  → rate limit bucket for IP + minute window
leaderboard:global     → global ZSET leaderboard
queue:emails           → email send queue (List)
```

Rules:
- Use `:` as separator, not `.` or `/`.
- Keep keys short — key names count toward memory.
- Avoid dynamic segments that produce unbounded key space without TTL.

## TTL strategy

Always set TTLs on cache keys. Omitting TTL = memory leak.

```redis
SET user:42:session "token" EX 3600         # expires in 1 hour
SETEX user:42:profile 300 "{...}"           # 5 minutes
EXPIRE user:42:temp 60                       # set TTL on existing key

# Atomic set + expire (preferred over SETEX)
SET key value EX 300 NX                     # set only if not exists + TTL
```

Check TTL on a key:
```redis
TTL user:42:session     # -1 = no TTL (danger!), -2 = key gone, N = seconds left
```

## Pipelining — batch commands to reduce round-trips

Each Redis command is a network round-trip. Pipeline batches commands into a single trip.

```ts
// Node.js (ioredis) example
const pipeline = redis.pipeline();
pipeline.get('user:1:session');
pipeline.incr('user:1:views');
pipeline.expire('user:1:views', 3600);
const results = await pipeline.exec();
```

Use pipelining for any hot path that issues 3+ Redis commands in sequence.

## SCAN instead of KEYS in production

`KEYS pattern` blocks the Redis event loop for its entire duration — it will freeze Redis under load.

```redis
# NEVER in production
KEYS user:*

# CORRECT: iterative cursor scan
SCAN 0 MATCH user:* COUNT 100
# Use returned cursor until it returns 0
```

In code:
```ts
let cursor = '0';
do {
  const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'user:*', 'COUNT', 100);
  cursor = newCursor;
  // process keys
} while (cursor !== '0');
```

## Rate limiting pattern

```ts
// Sliding window rate limit: max 100 requests per minute per user
async function isRateLimited(userId: string): Promise<boolean> {
  const key = `rate:${userId}:${Math.floor(Date.now() / 60000)}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 120); // 2 min window safety margin
  return count > 100;
}
```

## Sorted sets for leaderboards and pagination

```redis
# Add score
ZADD leaderboard:global 1500 "user:42"

# Top 10
ZREVRANGEBYSCORE leaderboard:global +inf -inf WITHSCORES LIMIT 0 10

# Rank of a user (0-indexed)
ZREVRANK leaderboard:global "user:42"
```

Cursor-based pagination with sorted sets:
```redis
# Page 1: get top 20
ZREVRANGE leaderboard:global 0 19 WITHSCORES

# Page 2: skip 20
ZREVRANGE leaderboard:global 20 39 WITHSCORES
```

## Cache invalidation patterns

| Pattern | When to use |
| --- | --- |
| **TTL expiry** | Acceptable staleness (most cases) |
| **Write-through** | Update cache on every write — consistent but coupled |
| **Write-behind** | Write to cache; async flush to DB — fast writes, risk of loss |
| **Cache-aside** | App reads cache → miss → read DB → populate cache |
| **Tag-based invalidation** | Delete multiple related keys via a shared tag key |

Tag-based with a Set:
```ts
// On write: register the key under its tag
await redis.sadd('tag:user:42', 'user:42:profile', 'user:42:orders');

// On invalidation: delete all tagged keys
const keys = await redis.smembers('tag:user:42');
await redis.del(...keys, 'tag:user:42');
```

## Sources
- Pipelining: https://redis.io/docs/latest/develop/using-commands/pipelining/
- SCAN command: https://redis.io/docs/latest/commands/scan/
- Sorted sets: https://redis.io/docs/latest/develop/data-types/sorted-sets/
- Data types overview: https://redis.io/docs/latest/develop/data-types/
