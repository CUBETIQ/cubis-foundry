# Example: Event-Driven Order Processing Architecture

## Prompt

> Design an event-driven architecture for our order processing system. It needs to handle order placement, payment, inventory, shipping, and notifications. Must guarantee no orders are lost and scale to 10K orders/min at peak. How do we handle failures, ordering, and schema evolution?

## Response

### Architecture Overview

```
    ┌─────────┐   order.placed    ┌──────────────┐
    │  Order   │ ───────────────► │              │
    │ Service  │                  │    Kafka     │
    └─────────┘                  │   Cluster    │
                                 │              │
    ┌─────────────────────────────┤  Topics:     │
    │  ┌──────────────────────────┤  - orders    │
    │  │  ┌───────────────────────┤  - payments  │
    │  │  │  ┌────────────────────┤  - inventory │
    │  │  │  │  ┌─────────────────┤  - shipping  │
    │  │  │  │  │                 │  - notifs    │
    │  │  │  │  │                 │  - dlq.*     │
    │  │  │  │  │                 └──────────────┘
    │  │  │  │  │
    ▼  ▼  ▼  ▼  ▼
  ┌───┐┌───┐┌───┐┌───┐┌───┐
  │Pay││Inv││Shp││Ntf││DLQ│
  │   ││   ││   ││   ││Mon│
  └───┘└───┘└───┘└───┘└───┘
```

### Event Schema Design

All events use Avro with a schema registry enforcing backward compatibility.

**Envelope:**

```json
{
  "event_id": "uuid-v7",
  "event_type": "order.placed",
  "aggregate_id": "order_abc123",
  "timestamp": "2025-03-14T10:30:00Z",
  "version": 2,
  "source": "order-service",
  "correlation_id": "trace_xyz",
  "payload": { ... }
}
```

Schema versioning rules:
- New fields are always optional with defaults.
- Fields are never removed; they are deprecated and ignored.
- Schema registry rejects backward-incompatible changes at publish time.

### Topic Structure and Partitioning

| Topic | Partition key | Partitions | Retention |
|-------|--------------|------------|-----------|
| `orders` | `order_id` | 32 | 14 days |
| `payments` | `order_id` | 16 | 14 days |
| `inventory` | `product_id` | 16 | 7 days |
| `shipping` | `order_id` | 16 | 7 days |
| `notifications` | `user_id` | 8 | 3 days |
| `dlq.payments` | `order_id` | 4 | 30 days |
| `dlq.inventory` | `product_id` | 4 | 30 days |

Partitioning by `order_id` ensures all events for a single order are consumed in order by a single consumer instance, maintaining causal ordering within an order lifecycle.

### Delivery Guarantees

**At-least-once delivery with idempotent consumers.**

Why not exactly-once:
- True exactly-once requires coupling producer, broker, and consumer transactionally.
- Kafka supports idempotent producers and transactional writes, but cross-system exactly-once (Kafka + external database) is impractical.
- At-least-once with idempotent consumers achieves the same user-visible outcome with simpler operations.

**Idempotency implementation:**

```sql
CREATE TABLE processed_events (
  event_id     UUID PRIMARY KEY,
  consumer_id  TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);
```

Each consumer checks `processed_events` before executing. If the event_id exists, the consumer acknowledges without re-processing. The check and business logic execute in a single database transaction.

### Consumer Group Configuration

| Consumer group | Instances | Concurrency | Commit strategy |
|----------------|-----------|-------------|-----------------|
| `payment-processor` | 4 | 4 partitions each | Manual commit after DB transaction |
| `inventory-reserver` | 4 | 4 partitions each | Manual commit after DB transaction |
| `shipping-scheduler` | 2 | 8 partitions each | Manual commit after DB transaction |
| `notification-sender` | 2 | 4 partitions each | Auto-commit (notifications are retry-safe) |

### Dead Letter Queue Handling

Events that fail processing after 3 retries (with exponential backoff: 1s, 5s, 30s) are published to the corresponding `dlq.*` topic.

**DLQ workflow:**
1. Failed event published to `dlq.{original-topic}` with failure metadata (error message, stack trace, retry count, original timestamp).
2. Alert fires when DLQ depth exceeds threshold (> 10 messages in 5 minutes).
3. On-call engineer inspects DLQ messages via admin UI.
4. After fixing the root cause, engineer replays DLQ messages back to the original topic.
5. DLQ retention: 30 days (longer than normal topics for investigation time).

### Scale Estimates

| Metric | Calculation | Result |
|--------|-------------|--------|
| Peak event throughput | 10K orders/min x 5 events/order | 50K events/min (~833/sec) |
| Average event size | 1KB (Avro-encoded) | 1KB |
| Bandwidth | 833 events/sec x 1KB | ~833 KB/sec |
| Daily storage | 50K events/min x 1440 min x 1KB | ~72 GB/day |
| 14-day retention | 72 GB x 14 | ~1 TB |
| Kafka cluster | 3 brokers, 32 partitions on orders topic | 3x replication |

### Monitoring and Observability

- **Consumer lag:** Alert if any consumer group falls > 10,000 messages behind. Critical if > 100,000.
- **DLQ depth:** Alert if any DLQ has > 0 messages (every DLQ message represents a business failure).
- **Event processing latency:** p50/p95/p99 from event timestamp to consumer completion.
- **Correlation tracing:** All events carry `correlation_id` propagated to distributed tracing (Jaeger/Datadog).
- **Schema compatibility:** CI check that new schema versions pass backward compatibility validation before deployment.
