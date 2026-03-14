# System Design Eval Assertions

## Eval 1: Distributed Cache Design

This eval tests the ability to design a caching architecture with proper pattern selection, invalidation, consistency trade-offs, and failure handling for a high-traffic read path.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `cache-aside` — Caching pattern identification | The design must name and justify the caching pattern. Cache-aside is the most appropriate for read-heavy catalogs because the application controls when to populate and invalidate. |
| 2 | contains | `TTL` — Time-to-live expiration | TTL provides a safety net for cache invalidation. Without it, stale data can persist indefinitely if active invalidation fails. The duration must be justified by the staleness tolerance. |
| 3 | contains | `invalidat` — Active invalidation strategy | With 500 updates/minute, relying solely on TTL expiry means customers see stale prices and stock levels. Active invalidation (event-driven or direct) is necessary for acceptable freshness. |
| 4 | contains | `failover` — Cache failure handling | A cache outage must not become a database outage. The design must specify fallback behavior: direct DB reads with circuit breaker, local in-process cache, or graceful degradation. |
| 5 | contains | `consistent hashing` — Key distribution strategy | Adding or removing cache nodes without consistent hashing causes a thundering herd of cache misses. Consistent hashing minimizes redistribution when the cluster topology changes. |

### What a passing response looks like

- Cache-aside pattern with Redis Cluster as the primary cache layer.
- TTL of 5-15 minutes with justification based on acceptable staleness for catalog data.
- Event-driven invalidation via Kafka/SNS triggered by merchant product updates.
- Consistent hashing for distributing keys across Redis nodes with virtual nodes for balance.
- Failover strategy: circuit breaker on cache reads, fall back to database with rate limiting.
- Capacity estimate: 2M products x average 2KB per cached entry = ~4GB base, with headroom for hot keys and replication.
- Thundering herd prevention: request coalescing or probabilistic early expiration.

---

## Eval 2: Event-Driven Architecture

This eval tests the ability to design an event-driven system with proper delivery semantics, schema management, consumer design, and failure handling for a critical business workflow.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `idempoten` — Idempotent consumer design | At-least-once delivery means consumers will receive duplicates. Without idempotency (deduplication keys, upserts), duplicate processing creates financial and data integrity issues. |
| 2 | contains | `dead letter` — Failed event handling | Events that cannot be processed after retries must be moved to a dead letter queue for manual inspection. Without this, poison messages block the entire consumer group. |
| 3 | contains | `partition` — Event partitioning strategy | Partitioning by order ID ensures all events for a single order are processed in sequence while enabling parallel processing across different orders. Wrong partitioning breaks ordering guarantees. |
| 4 | contains | `schema` — Event schema with versioning | Events are contracts between services. Without versioned schemas, a producer change can silently break all consumers. Schema registry enforces compatibility at publish time. |
| 5 | contains | `at-least-once` — Explicit delivery guarantee | The design must state the delivery guarantee and explain why exactly-once is not achievable in practice across distributed systems, requiring idempotent consumers as the mitigation. |

### What a passing response looks like

- Kafka or equivalent event streaming platform with topics per business domain (orders, payments, inventory, shipping).
- Partitioning by order ID for ordering guarantees within a single order flow.
- At-least-once delivery with idempotent consumers using a processed-event deduplication table.
- Event schemas defined in Avro or Protobuf with a schema registry enforcing backward compatibility.
- Dead letter topic per consumer group with alerting on DLQ depth.
- Consumer group configuration with appropriate parallelism (partitions >= consumers).
- Retention policy enabling replay for debugging (7-30 days).
- Back-of-envelope: 10K orders/min x 5 events/order = 50K events/min, sizing for 3x headroom.
