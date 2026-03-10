# Redis Checklist

Load this when Redis-specific tradeoffs matter.

## Data purpose

- Confirm whether Redis is cache, queue, coordination layer, or transient store.
- Keep the system of record explicit.

## Keys and TTL

- Design keys, namespaces, and cardinality deliberately.
- Make TTL and invalidation policy explicit.
- Check hot keys and unbounded growth risk.

## Operations

- Choose persistence and eviction posture intentionally.
- Re-check failure behavior, stale data handling, and cache miss correctness.
