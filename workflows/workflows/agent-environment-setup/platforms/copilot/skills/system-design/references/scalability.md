# Scalability

## Scaling Dimensions

Every system has three independent scaling axes. Identify which axis is under pressure before choosing a strategy:

| Axis | Measure | Scaling technique |
|------|---------|------------------|
| **Request throughput** | QPS, concurrent connections | Horizontal scaling, load balancing, caching |
| **Data volume** | Storage size, row count | Sharding, archival, compression, tiered storage |
| **Compute intensity** | CPU time per request, memory per operation | Vertical scaling, algorithm optimization, offloading to async workers |

## Horizontal vs. Vertical Scaling

| Property | Horizontal (scale out) | Vertical (scale up) |
|----------|----------------------|---------------------|
| Mechanism | Add more machines | Add CPU/RAM/disk to existing machine |
| Ceiling | Effectively unlimited | Hardware limits (~128 cores, ~12TB RAM) |
| Complexity | Distributed systems challenges | Simple (single machine) |
| Failure domain | One node fails, others continue | Single point of failure |
| Cost curve | Linear | Exponential at high end |
| When to use | > 10K QPS, > 1TB data, need high availability | < 5K QPS, < 500GB, acceptable downtime |

Rule: Start vertical. Switch to horizontal when you hit a concrete limit, not when you imagine one.

## Capacity Planning

### Back-of-Envelope Estimation Framework

1. **Identify the bottleneck resource** (CPU, memory, disk I/O, network)
2. **Estimate per-request consumption** of that resource
3. **Calculate peak load** (not average — use peak-to-average ratio, typically 3-10x)
4. **Add headroom** (2x for growth, 1.5x for traffic spikes)

### Example: Image Storage Service

```
Users:           10M monthly active
Upload rate:     5% of users upload per day = 500K uploads/day
Average size:    2MB per image
Daily storage:   500K × 2MB = 1TB/day
Annual storage:  365TB/year
5-year storage:  ~1.8PB

Read QPS:
  Average: 10M × 10 views/day / 86400s = ~1,150 QPS
  Peak (3x): ~3,500 QPS

Bandwidth:
  Read: 3,500 QPS × 200KB (thumbnail) = 700MB/s
  Write: 500K/day × 2MB / 86400s = ~12MB/s
```

### Rules of Thumb

| Resource | Capacity per server (commodity) |
|----------|-------------------------------|
| QPS (web server) | 1,000-10,000 depending on compute per request |
| QPS (database reads) | 10,000-50,000 with indexes |
| QPS (database writes) | 1,000-5,000 with WAL |
| QPS (cache reads) | 100,000-500,000 (Redis single node) |
| Network throughput | 1-10 Gbps |
| Disk throughput (SSD) | 500MB/s sequential, 100K IOPS random |
| Memory | 64-256GB per server |

## Load Balancing

### Layers

| Layer | Operates at | Algorithms | Use for |
|-------|------------|------------|---------|
| DNS | Domain resolution | Round-robin, geo-routing, weighted | Global traffic distribution |
| L4 (TCP) | Connection level | Least connections, round-robin, hash | High throughput, TLS termination offload |
| L7 (HTTP) | Request level | Path-based, header-based, cookie affinity | Content-aware routing, A/B testing, canary |

### Algorithm Selection

| Algorithm | Best for | Drawback |
|-----------|---------|----------|
| Round-robin | Uniform request cost, stateless services | Ignores server load |
| Least connections | Variable request duration | Slow reaction to new connections |
| Weighted round-robin | Heterogeneous server capacities | Requires manual weight tuning |
| IP hash | Session affinity without cookies | Uneven distribution with skewed IPs |
| Consistent hash | Cache layer, stateful services | Complexity, cold start on new nodes |

### Health Checks

```
Health check types:
  /health (liveness):   "Am I alive?" → Check process is running
  /ready (readiness):   "Can I serve?" → Check DB connection, cache, dependencies
  /startup (startup):   "Am I initialized?" → Check migrations, warm caches

Health check config:
  Interval: 10s
  Timeout: 5s
  Healthy threshold: 2 consecutive passes
  Unhealthy threshold: 3 consecutive failures
```

## Database Scaling Patterns

### Read Replicas

```
         ┌─────────┐
Writes ──►│ Primary │
         └────┬────┘
              │ Replication (async)
    ┌─────────┼─────────┐
    ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐
│Replica│ │Replica│ │Replica│
│  (R)  │ │  (R)  │ │  (R)  │
└───────┘ └───────┘ └───────┘
    ▲         ▲         ▲
    └─────────┼─────────┘
              │
         Reads (load balanced)
```

Replication lag implications:
- Read-after-write: user writes and immediately reads. Route to primary for N seconds after write.
- Monotonic reads: user sees older data on retry. Pin user to a specific replica per session.
- Cross-replica consistency: aggregate queries may see inconsistent state. Use primary for reports.

### Connection Pooling

Database connections are expensive (TCP handshake, authentication, memory allocation). Always pool:

| Setting | Recommendation |
|---------|---------------|
| Pool size per instance | 10-20 connections (not hundreds) |
| Max total connections | `pool_size × app_instances < max_connections` |
| Idle timeout | 300s (return idle connections to pool) |
| Connection lifetime | 1800s (rotate connections to pick up DNS changes) |
| Wait timeout | 5s (fail fast if pool is exhausted) |

## Async Processing

Move non-critical work off the request path:

| Pattern | Use when | Implementation |
|---------|---------|---------------|
| Message queue | Work can be processed later | Kafka, SQS, RabbitMQ |
| Background job | Scheduled or triggered work | Sidekiq, Celery, Bull |
| Event stream | Multiple consumers need the data | Kafka, Kinesis |
| Cron job | Time-based recurring work | Kubernetes CronJob, CloudWatch Events |

Rule: If the user does not need to see the result immediately, process it asynchronously.

## Anti-Patterns

- **Premature optimization:** Scaling before measuring. Profile first, then scale the bottleneck.
- **Shared-everything database:** Multiple services writing to one database prevents independent scaling.
- **Synchronous chains:** Service A calls B calls C calls D synchronously. Latency is additive, availability is multiplicative.
- **Ignoring cold start:** Cache empty after deployment, all traffic hits database. Warm caches before routing traffic.
- **Over-sharding:** More shards than needed. Each shard adds operational overhead (backups, monitoring, schema changes).
