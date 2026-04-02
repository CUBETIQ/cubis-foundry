# Data Partitioning

## Why Partition

A single database node has limits: storage capacity, write throughput, read throughput, and connection count. When any limit is reached, partitioning (sharding) distributes data across multiple nodes so that each node handles a subset of the total load.

| Metric | Single node limit (approximate) | When to partition |
|--------|-------------------------------|-------------------|
| Storage | 1-10 TB (practical) | Data exceeds single-node storage |
| Write QPS | 1,000-5,000 | Write throughput saturates |
| Read QPS | 10,000-50,000 | Read replicas are insufficient |
| Connections | 500-2,000 | Connection pool exhaustion across services |

## Partitioning Strategies

### Hash-Based Partitioning

```
partition = hash(partition_key) % num_partitions
```

| Pro | Con |
|-----|-----|
| Even distribution across partitions | Range queries require scatter-gather across all partitions |
| Simple implementation | Adding/removing nodes redistributes many keys |
| No hot spots (with good hash function) | Cannot efficiently scan ranges |

**Best for:** Key-value lookups, user data, session stores, cache layers.

### Range-Based Partitioning

```
partition 0: A-F
partition 1: G-M
partition 2: N-S
partition 3: T-Z
```

| Pro | Con |
|-----|-----|
| Range queries stay within one partition | Uneven distribution (some ranges are hotter) |
| Efficient for time-series data (partition by month) | Hot spots if access pattern is skewed |
| Natural ordering within partition | Requires monitoring for partition balance |

**Best for:** Time-series data, analytics, data that is frequently scanned in ranges.

### Composite Key Partitioning

```
partition_key = tenant_id
sort_key = timestamp

All data for tenant_123 is in one partition, ordered by time.
```

| Pro | Con |
|-----|-----|
| Queries within a tenant are fast and ordered | Large tenants can create hot partitions |
| Good for multi-tenant applications | Cross-tenant queries require scatter-gather |
| Natural data isolation between tenants | Rebalancing is harder |

**Best for:** Multi-tenant SaaS, per-user data stores.

## Consistent Hashing

Standard hash partitioning (`hash % N`) redistributes nearly all keys when N changes. Consistent hashing minimizes redistribution.

### How It Works

```
1. Map partition nodes to positions on a hash ring (0 to 2^32)
2. Map each key to a position on the same ring
3. Walk clockwise from the key's position to find the first node
4. That node owns the key

When a node is added:
  Only keys between the new node and its predecessor are reassigned.
  All other keys stay where they are.

When a node is removed:
  Only keys owned by the removed node are reassigned to the next node clockwise.
```

### Virtual Nodes

Physical nodes are unevenly distributed on the ring, causing imbalanced load. Virtual nodes solve this:

```
Physical node A → virtual nodes: A-1, A-2, A-3, ..., A-150
Physical node B → virtual nodes: B-1, B-2, B-3, ..., B-150
Physical node C → virtual nodes: C-1, C-2, C-3, ..., C-150
```

Each physical node is represented by 100-200 virtual nodes spread across the ring. This ensures even distribution regardless of the number of physical nodes.

| Virtual nodes per physical | Distribution evenness | Metadata overhead |
|---------------------------|----------------------|-------------------|
| 10 | Poor (20% imbalance) | Low |
| 50 | Good (5% imbalance) | Medium |
| 150 | Excellent (< 2% imbalance) | Higher |

## Replication

### Replication Strategies

| Strategy | Consistency | Availability | Write latency |
|----------|------------|--------------|---------------|
| **Single leader** | Strong (leader) | Leader failure = brief unavailability | Low (one write) |
| **Multi-leader** | Eventual (conflict resolution needed) | High (any leader accepts writes) | Low per region |
| **Leaderless** | Tunable (quorum: W + R > N) | High (no single point of failure) | Varies by quorum |

### Quorum Reads and Writes

```
N = total replicas = 3
W = write quorum = 2 (write must be acknowledged by 2 of 3 replicas)
R = read quorum = 2 (read from 2 of 3 replicas, return latest)

W + R > N ensures overlap: at least one replica in the read set has the latest write.
```

| Configuration | Guarantee | Trade-off |
|--------------|-----------|-----------|
| W=N, R=1 | Strong consistency on read | Slow writes, any node failure blocks writes |
| W=1, R=N | Fast writes | Slow reads, any node failure blocks reads |
| W=2, R=2 (N=3) | Balanced | Tolerates 1 node failure for both reads and writes |
| W=1, R=1 | Eventual consistency | Fastest, but may read stale data |

## Shard Key Selection

The shard key determines which partition holds each record. It is the most critical design decision in a sharded system.

### Selection Criteria

| Criterion | Why |
|-----------|-----|
| **High cardinality** | More distinct values = more even distribution |
| **Even distribution** | Avoid hot partitions (one shard getting all traffic) |
| **Query alignment** | Most queries should target a single shard |
| **Immutability** | Changing the shard key requires moving data between partitions |
| **Not monotonically increasing** | Auto-increment IDs create a hot partition (all writes go to the latest shard) |

### Examples

| Entity | Good shard key | Bad shard key | Why |
|--------|---------------|--------------|-----|
| Users | user_id (hash) | created_at (range) | User access is random, not time-sequential |
| Orders | order_id (hash) | customer_id (hash) | One customer may have millions of orders (hot shard) |
| Time-series | sensor_id + time_bucket | timestamp only | All current data hits one partition |
| Multi-tenant | tenant_id | region | Tenant sizes vary wildly; region has low cardinality |

## Cross-Partition Operations

### Scatter-Gather

When a query cannot be routed to a single partition, it must be sent to all partitions:

```
Query: "Find all orders with status=pending"
  → Send query to all N partitions
  → Each partition returns its matching results
  → Coordinator merges and sorts results
  → Return to client
```

Performance: O(N) where N = number of partitions. Acceptable for infrequent queries, unacceptable for hot paths.

### Secondary Indexes

| Approach | How | Trade-off |
|----------|-----|-----------|
| **Local index** | Each partition indexes its own data | Reads require scatter-gather; writes are fast |
| **Global index** | Separate partition for the index | Reads are fast; writes must update index partition (async) |

### Cross-Shard Joins

Avoid cross-shard joins. Strategies:

1. **Denormalize:** Store the joined data in the same partition (duplicate data).
2. **Application-side join:** Query both partitions, join in application code.
3. **Materialized view:** Pre-compute the join result, update asynchronously.
4. **Change data capture:** Stream changes from both partitions, join in a streaming pipeline.

## Rebalancing

When partitions become unbalanced (hot spots, data growth), rebalance:

| Strategy | Disruption | Complexity |
|----------|-----------|------------|
| **Fixed partitions** | Assign partitions to new nodes (data moves, partition count stays) | Low |
| **Dynamic splitting** | Split hot partitions when they exceed a threshold | Medium |
| **Consistent hashing** | Add nodes, only affected key ranges move | Low |
| **Manual rebalancing** | DBA moves partitions based on monitoring | Highest control, highest effort |

### Rebalancing Checklist

1. Monitor partition size and QPS per partition.
2. Alert when any partition exceeds 2x the average.
3. Plan rebalancing during low-traffic windows.
4. Use online rebalancing (dual-write during migration) to avoid downtime.
5. Verify data integrity after rebalancing (row counts, checksums).

## Anti-Patterns

- **Over-sharding:** Too many partitions for the data volume. Each partition adds operational overhead.
- **Under-sharding:** Too few partitions, requiring a painful re-shard later. Start with enough partitions for 3-5 years of growth.
- **Monotonic shard keys:** Auto-increment IDs or timestamps create a single hot partition.
- **Cross-shard transactions:** Two-phase commits across partitions are slow and fragile. Redesign to avoid them.
- **Ignoring data locality:** If two entities are always queried together, they should be in the same partition.
