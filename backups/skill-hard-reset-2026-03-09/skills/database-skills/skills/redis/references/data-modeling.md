# Redis — Data Modeling and Key Design

## The golden rule

In Redis, the **data structure determines your access pattern** — pick the structure based on what operations you need, not what the data looks like.

## Data structure decision guide

### String — simplest value

Use for: counters, single scalar values, serialized blobs, feature flags.

```redis
SET user:42:points 1500
INCR user:42:points              # atomic increment
INCRBY user:42:points 50
GET user:42:points

# Serialized JSON (avoid if you only need individual fields — use Hash instead)
SET product:99 '{"name":"Widget","price":9.99}'
```

### Hash — object with fields

Use for: user profiles, session data, config objects with named fields. Avoids deserializing a full JSON blob to update one field.

```redis
HSET user:42 name "Alice" email "alice@example.com" plan "pro"
HGET user:42 email
HMGET user:42 name plan          # fetch specific fields
HINCRBY user:42 login_count 1    # atomic field increment
HDEL user:42 temp_field           # remove one field
HGETALL user:42                   # get all fields (watch size)
```

Memory note: Hashes with ≤128 fields and short values use a compact ziplist encoding — much cheaper than separate String keys.

### List — ordered sequence / queue

Use for: message queues, activity feeds (append + trim), task lists.

```redis
LPUSH queue:emails '{"to":"a@b.com"}'   # push to head
RPUSH queue:emails '{"to":"c@d.com"}'   # push to tail
LPOP queue:emails                        # dequeue from head (FIFO)
RPOP queue:emails                        # dequeue from tail (LIFO)
LLEN queue:emails                        # current length
LTRIM feed:user:42 0 99                  # keep only last 100 items
```

For producer/consumer queues in production prefer **Streams** (more features, consumer groups, acknowledgment).

### Set — unordered unique values

Use for: membership checks, unique visitors, tagging, deduplication.

```redis
SADD online_users user:42 user:99
SISMEMBER online_users user:42   # O(1) membership check
SMEMBERS online_users            # all members (avoid on large sets)
SCARD online_users               # count
SREM online_users user:42        # remove

# Set operations (great for permission/feature checks)
SUNION editors:org:1 editors:org:2          # union
SINTER subscribers premium_users           # intersection
```

### Sorted Set (ZSET) — ordered by score

Use for: leaderboards, rate limiting, scheduled jobs, range queries, time-series indexes.

```redis
ZADD leaderboard:global 1500 "user:42"    # score = 1500
ZINCRBY leaderboard:global 100 "user:42"  # atomic score increment
ZREVRANK leaderboard:global "user:42"      # rank (0-indexed, desc)
ZREVRANGE leaderboard:global 0 9 WITHSCORES  # top 10 with scores

# Range by score (e.g., all jobs due in next 60s)
ZRANGEBYSCORE scheduled_jobs 0 1706000060 WITHSCORES LIMIT 0 10
ZREM scheduled_jobs "job:123"             # remove after processing
```

### Stream — append-only log with consumer groups

Use for: event sourcing, reliable message delivery, audit logs, notifications.

```redis
XADD events:orders '*' type order_created orderId 99 userId 42  # auto-ID
XLEN events:orders
XRANGE events:orders - +                 # all events
XRANGE events:orders 1706000000000-0 +  # from timestamp

# Consumer group for reliable delivery
XGROUP CREATE events:orders workers $ MKSTREAM
XREADGROUP GROUP workers consumer1 COUNT 10 STREAMS events:orders >  # read new
XACK events:orders workers <message-id>  # acknowledge after processing
```

## Key naming

```
<entity>:<id>:<field>

user:42:points          String — points counter
user:42                 Hash   — user profile object
leaderboard:global      ZSET   — global score board
queue:emails            List   — email send queue
online_users            Set    — currently online user IDs
events:orders           Stream — order event log
rate:user:42:202501     String — rate limit bucket
session:abc123          String/Hash — session data
```

Rules:
- Use `:` as separator.
- Keep namespaces consistent across the codebase.
- Include an entity type so `SCAN type:*` works for debugging.
- Include a time bucket in rate limit keys so they auto-expire when the window passes.

## TTL strategy

| Key type | TTL strategy |
| --- | --- |
| Sessions | Explicit TTL on set, slide it on read (`EXPIRE key 3600`) |
| Cache keys | Fixed TTL matching acceptable staleness |
| Rate limit buckets | 2× the window duration |
| Leaderboards | No TTL (explicit reset with `DEL`) |
| Streams | Use `MAXLEN` to cap length, or `EXPIRE` on the whole stream |

```redis
# Sliding session TTL
SET session:abc123 "{...}" EX 3600
# On each read, reset the TTL:
EXPIRE session:abc123 3600
```

## Avoid these patterns

| Antipattern | Problem | Fix |
| --- | --- | --- |
| Storing JSON in String when you need individual fields | Full deser on every access | Use Hash |
| Unbounded List/Set with no trim | Memory growth without bound | `LTRIM`, `SREM`, or `MAXLEN` |
| `KEYS *` in production | Blocks event loop | Use `SCAN` |
| No TTL on cache keys | Memory leak | Always set TTL |
| Huge Hash (`HGETALL`) on hot path | Transfers more data than needed | Project with `HMGET` |
| Sequences as String with `INCR` shared globally | Bottleneck at high QPS | Shard or batch |

## Sources
- Redis data types: https://redis.io/docs/latest/develop/data-types/
- Streams: https://redis.io/docs/latest/develop/data-types/streams/
- Sorted sets: https://redis.io/docs/latest/develop/data-types/sorted-sets/
