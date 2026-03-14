# Messaging Patterns

## Message Broker Selection

| Broker | Delivery | Ordering | Throughput | Best for |
|--------|----------|----------|------------|----------|
| **Kafka** | At-least-once (configurable) | Per-partition | Very high (millions/sec) | Event streaming, log aggregation, high-throughput pipelines |
| **RabbitMQ** | At-most-once or at-least-once | Per-queue (with single consumer) | Medium (tens of thousands/sec) | Task queues, request-reply, complex routing |
| **Amazon SQS** | At-least-once | No ordering (standard) or FIFO | High | Simple task queues, serverless integration |
| **Amazon SNS** | At-most-once | No ordering | High | Fan-out notifications, pub/sub |
| **NATS** | At-most-once (core), at-least-once (JetStream) | Per-stream | Very high | Low-latency messaging, IoT, microservices |
| **Google Pub/Sub** | At-least-once | Per-key ordering | High | Cloud-native event streaming, analytics |

## Delivery Guarantees

### At-Most-Once

```
Producer sends message → Broker receives → Consumer processes
No retry. If anything fails, the message is lost.
```

Use when: Loss is acceptable (metrics, logs, non-critical notifications).

### At-Least-Once

```
Producer sends message → Broker acknowledges → Consumer processes → Consumer acknowledges
If consumer fails to acknowledge, broker redelivers.
Consequence: Consumer may process the same message multiple times.
```

Use when: Loss is unacceptable but duplicates can be handled (most business workflows).

### Exactly-Once (Effectively)

True exactly-once across distributed systems is impossible without coupling all components transactionally. The practical approach is **at-least-once delivery + idempotent consumer**.

```
Producer sends message → Broker delivers (may redeliver)
Consumer:
  1. Check idempotency store: "Have I processed message ID X?"
  2. If yes → ACK without processing
  3. If no → process in a transaction with idempotency record → ACK
```

## Topic Design

### One Topic Per Event Type

```
topics:
  order.placed
  order.confirmed
  order.shipped
  order.cancelled
  payment.charged
  payment.refunded
  inventory.reserved
  inventory.released
```

Pros: Consumers subscribe only to events they care about. Schema evolution is scoped per topic.
Cons: Many topics to manage. Cross-event ordering not guaranteed.

### One Topic Per Aggregate (Entity)

```
topics:
  orders        (all order events)
  payments      (all payment events)
  inventory     (all inventory events)
```

Pros: All events for one entity are in one partition (ordered). Fewer topics.
Cons: Consumers receive events they do not care about. Schema must handle multiple event types.

Recommendation: Use **one topic per aggregate** for most systems. It balances ordering guarantees with operational simplicity.

## Partitioning and Ordering

### Partition Key Selection

| Key | Ordering guarantee | Use when |
|-----|-------------------|----------|
| Entity ID (order_id) | All events for one entity are ordered | Most business workflows |
| Tenant ID | All events for one tenant are ordered | Multi-tenant systems |
| Region | Events within a region are ordered | Geo-distributed systems |
| Random/round-robin | No ordering | Maximum throughput, ordering not needed |

### Ordering Guarantees

Kafka guarantees ordering **within a partition**, not across partitions.

```
Topic: orders (8 partitions)
  Partition 0: order_1 events → consumed in order
  Partition 1: order_2 events → consumed in order
  ...
  order_1 and order_2 events have NO ordering guarantee relative to each other
```

If you need global ordering across all events, use a single partition. This limits throughput to a single consumer.

## Consumer Patterns

### Competing Consumers

Multiple consumers in the same group process different messages from the same topic:

```
Topic: orders (8 partitions)
Consumer Group: order-processor
  Consumer A → partitions 0, 1, 2, 3
  Consumer B → partitions 4, 5, 6, 7

Adding Consumer C triggers rebalance:
  Consumer A → partitions 0, 1, 2
  Consumer B → partitions 3, 4, 5
  Consumer C → partitions 6, 7
```

Rule: Number of consumers <= number of partitions. Extra consumers sit idle.

### Fan-Out

Multiple consumer groups process the same messages independently:

```
Topic: order.placed
  Consumer Group: payment-processor → processes payment
  Consumer Group: inventory-manager → reserves stock
  Consumer Group: notification-sender → sends confirmation
  Consumer Group: analytics-pipeline → records metrics
```

Each group maintains its own offset. They process at their own pace.

### Consumer Offset Management

| Strategy | Behavior | Risk |
|----------|----------|------|
| Auto-commit | Offsets committed periodically (5s default) | Message loss if consumer crashes between commit and processing |
| Manual commit after processing | Commit after business logic succeeds | Duplicate processing if crash between processing and commit |
| Transactional commit | Commit offset in same transaction as business logic | No loss, no duplicates. Requires transactional consumer support |

Recommendation: Manual commit after processing + idempotent consumer for most systems.

## Dead Letter Queue

Messages that fail processing after retries are routed to a dead letter queue:

```
Main topic: orders
  → Consumer processes
  → Retry 1 (after 1s)
  → Retry 2 (after 5s)
  → Retry 3 (after 30s)
  → Dead letter topic: orders.dlq

DLQ message includes:
  - Original message
  - Error message and stack trace
  - Retry count
  - Original topic and partition
  - Timestamp of first failure
```

### DLQ Workflow

1. **Alert** on DLQ depth > 0 (every DLQ message is a business failure).
2. **Inspect** via admin UI: view message content, error, and context.
3. **Fix** the root cause (code bug, schema change, downstream outage).
4. **Replay** messages from DLQ back to the original topic.
5. **Retain** DLQ messages for 30 days (longer than normal topics).

## Event Schema Evolution

### Compatibility Modes

| Mode | Rule | Effect |
|------|------|--------|
| **Backward compatible** | New schema can read old data | Consumers can upgrade before producers |
| **Forward compatible** | Old schema can read new data | Producers can upgrade before consumers |
| **Full compatible** | Both backward and forward | Either side can upgrade independently |

### Safe Changes (Backward + Forward Compatible)

- Add optional fields with default values
- Add new enum values (if consumers handle unknown values)
- Add new event types to a topic

### Breaking Changes (Avoid)

- Remove or rename fields
- Change field types
- Change field semantics (same name, different meaning)
- Reorder fields in Avro/Protobuf (changes binary encoding)

### Schema Registry

Use a schema registry (Confluent Schema Registry, AWS Glue Schema Registry) to:
1. Store schemas with version history.
2. Validate compatibility at publish time.
3. Reject backward-incompatible changes automatically.
4. Provide schema lookup for consumers (by topic, by ID).

## Monitoring

| Metric | Alert threshold | Why |
|--------|----------------|-----|
| Consumer lag | > 10K messages for 5 min | Consumer is falling behind; messages are stale |
| DLQ depth | > 0 messages | Business logic is failing |
| Producer error rate | > 0.1% | Messages are being lost |
| Rebalance frequency | > 1/hour | Consumer instability, likely crashes or scaling |
| End-to-end latency | > 30s p99 | Messages are not being processed timely |
| Partition skew | > 2x between busiest and quietest | Hot partition, bad partition key choice |
