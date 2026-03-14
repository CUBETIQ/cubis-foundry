# Observability

## Three Pillars

Observability in microservices requires three complementary signal types:

| Pillar | What it answers | Tool examples |
|--------|----------------|---------------|
| **Metrics** | "How is the system performing?" | Prometheus, Datadog, CloudWatch |
| **Traces** | "What happened during this request?" | Jaeger, Zipkin, Datadog APM, OpenTelemetry |
| **Logs** | "Why did this specific thing happen?" | ELK Stack, Loki, CloudWatch Logs |

None is sufficient alone. Metrics tell you something is wrong, traces show you where, and logs explain why.

## Distributed Tracing

### Trace Propagation

Every request entering the system gets a trace ID. This ID propagates through all downstream calls:

```
Client request
  │ trace_id: abc-123, span_id: span-1
  ▼
API Gateway
  │ trace_id: abc-123, span_id: span-2, parent: span-1
  ▼
Order Service
  │ trace_id: abc-123, span_id: span-3, parent: span-2
  ├──────────────────────────┐
  ▼                          ▼
Payment Service          Inventory Service
  trace_id: abc-123        trace_id: abc-123
  span_id: span-4          span_id: span-5
  parent: span-3           parent: span-3
```

### Propagation Headers

| Standard | Header | Used by |
|----------|--------|---------|
| W3C Trace Context | `traceparent`, `tracestate` | OpenTelemetry, modern systems |
| B3 (Zipkin) | `X-B3-TraceId`, `X-B3-SpanId`, `X-B3-ParentSpanId` | Zipkin, older systems |
| Jaeger | `uber-trace-id` | Jaeger native |

Recommendation: Use W3C Trace Context (`traceparent`) for new systems. It is the standard.

### Span Attributes

Every span should include:

```
Required attributes:
  service.name:        "order-service"
  span.kind:           "server" | "client" | "producer" | "consumer"
  http.method:         "POST"
  http.status_code:    201
  http.url:            "/v1/orders"

Recommended attributes:
  user.id:             "user_123"
  order.id:            "order_456"
  db.system:           "postgresql"
  db.statement:        "SELECT * FROM orders WHERE id = $1"
  messaging.system:    "kafka"
  messaging.destination: "orders"
  error:               true (if the span represents a failure)
  error.message:       "Connection refused"
```

### Sampling Strategies

Tracing every request generates enormous data. Use sampling:

| Strategy | How | Use when |
|----------|-----|----------|
| **Head-based sampling** | Decide at ingress (sample 10% of traces) | High traffic, cost-sensitive |
| **Tail-based sampling** | Collect all spans, decide after trace completes | Need all error traces and slow traces |
| **Priority sampling** | Always trace errors and slow requests, sample normal | Best balance of cost and visibility |
| **Rate limiting** | Cap at N traces/sec regardless of traffic | Hard budget constraint |

Recommendation: Tail-based sampling with priority. Capture 100% of errors and p99+ latency traces. Sample 1-10% of normal traffic.

## Metrics

### The Four Golden Signals (Google SRE)

| Signal | What it measures | Example metric |
|--------|-----------------|----------------|
| **Latency** | Time to service a request | `http_request_duration_seconds` histogram |
| **Traffic** | Demand on the system | `http_requests_total` counter |
| **Errors** | Rate of failed requests | `http_requests_total{status=~"5.."}` counter |
| **Saturation** | How full the system is | CPU usage, memory usage, queue depth |

### RED Method (for Request-Driven Services)

- **Rate:** Requests per second
- **Errors:** Error rate (errors per second or error percentage)
- **Duration:** Latency distribution (histogram with p50, p90, p95, p99)

### USE Method (for Resources)

- **Utilization:** Percentage of resource in use (CPU %, memory %, disk %)
- **Saturation:** Queue depth or wait time for the resource
- **Errors:** Resource-level errors (disk errors, network packet drops)

### Metric Naming Convention

```
{namespace}_{subsystem}_{metric_name}_{unit}

Examples:
  order_service_http_request_duration_seconds
  order_service_db_query_duration_seconds
  order_service_kafka_consumer_lag_messages
  order_service_circuit_breaker_state (gauge: 0=closed, 1=open, 0.5=half-open)
```

### Histogram Buckets

Configure histogram buckets based on your SLO:

```
# For API latency (SLO: p99 < 500ms)
buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

# For database queries (SLO: p99 < 100ms)
buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]

# For background jobs (SLO: p99 < 30s)
buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 120, 300]
```

## Structured Logging

### Log Format

Use structured JSON logs:

```json
{
  "timestamp": "2025-03-14T10:30:00.123Z",
  "level": "error",
  "service": "order-service",
  "trace_id": "abc-123",
  "span_id": "span-3",
  "message": "Failed to charge payment",
  "error": "Connection refused",
  "order_id": "order_456",
  "amount": 49.99,
  "payment_method": "card",
  "duration_ms": 5023
}
```

### Log Levels

| Level | Use for | Example |
|-------|---------|---------|
| ERROR | Failures requiring attention | Payment gateway timeout, database connection failure |
| WARN | Unusual conditions that may become errors | Retry attempt, approaching rate limit, slow query |
| INFO | Normal business events | Order placed, payment charged, shipment created |
| DEBUG | Detailed diagnostic information | Request/response payloads, cache hit/miss, SQL queries |

### Correlation

Every log entry must include:
- `trace_id`: Links to the distributed trace
- `span_id`: Links to the specific span
- `service`: Identifies which service emitted the log
- `request_id`: Unique per-request identifier (may differ from trace_id)

This enables searching all logs for a single request across all services:
```
query: trace_id="abc-123" | sort timestamp asc
```

## Alerting

### Alert Design Principles

1. **Alert on symptoms, not causes.** Alert on "error rate > 1%" not "database CPU > 80%." Users feel symptoms, not causes.
2. **Every alert must be actionable.** If there is nothing the on-call can do at 3 AM, it is not an alert — it is a dashboard metric.
3. **Use error budgets.** Alert when error budget burn rate exceeds threshold, not on absolute values.
4. **Reduce noise.** An alert that fires constantly and gets ignored is worse than no alert.

### Alert Tiers

| Tier | Severity | Response time | Channel | Example |
|------|---------|---------------|---------|---------|
| P1 | Critical | < 5 min | PagerDuty, phone call | Service down, data loss risk |
| P2 | High | < 30 min | PagerDuty, Slack | Error rate elevated, SLO at risk |
| P3 | Medium | Next business day | Slack, email | Disk space warning, certificate expiry |
| P4 | Low | Next sprint | Ticket | Performance degradation, tech debt |

### SLO-Based Alerts

```
SLO: 99.9% availability (error budget: 0.1%)
  → Alert P2 if 5% of monthly error budget consumed in 1 hour
  → Alert P1 if 10% of monthly error budget consumed in 1 hour

SLO: p99 latency < 500ms
  → Alert P2 if p99 > 500ms for 5 minutes
  → Alert P1 if p99 > 2s for 5 minutes
```

## Health Checks

Every service exposes three endpoints:

```
GET /health (liveness)
  Returns 200 if the process is alive.
  Does NOT check dependencies.
  Used by: Kubernetes liveness probe → restarts on failure.

GET /ready (readiness)
  Returns 200 if the service can handle requests.
  Checks: database connection, cache connection, required configs loaded.
  Used by: Kubernetes readiness probe → removes from load balancer on failure.

GET /startup (startup)
  Returns 200 after initialization is complete.
  Checks: migrations applied, caches warmed, feature flags loaded.
  Used by: Kubernetes startup probe → prevents liveness checks during boot.
```

### Health Check Anti-Patterns

- **Checking too many dependencies in liveness:** If the database is down, the process is still alive. Use readiness, not liveness.
- **No timeout on dependency checks:** A health check that hangs on a slow DB query makes the probe timeout, triggering unnecessary restarts.
- **Sharing credentials in health responses:** Never expose connection strings, versions, or internal state in health check responses.

## Dashboard Design

### Service Dashboard (per service)

| Panel | Metric | Visualization |
|-------|--------|---------------|
| Request rate | `http_requests_total` rate | Line chart (QPS) |
| Error rate | `http_requests_total{status=~"5.."}` / total | Line chart (percentage) |
| Latency | `http_request_duration_seconds` | Heatmap (p50, p90, p99) |
| Saturation | CPU, memory, goroutines/threads | Gauge + line chart |
| Dependencies | Downstream call latency and error rate | Multi-line chart per dependency |
| Business metrics | Orders/sec, payments/sec | Counter rate |

### System Dashboard (cross-service)

| Panel | What it shows |
|-------|--------------|
| Service map | Topology with request rates and error rates on edges |
| SLO burn rate | Error budget consumption per service |
| Top errors | Most frequent error messages across all services |
| Trace search | Search by trace ID, service, duration, error |
| Consumer lag | Kafka consumer group lag per topic |
| Deployment markers | Vertical lines on charts showing deployment timestamps |
