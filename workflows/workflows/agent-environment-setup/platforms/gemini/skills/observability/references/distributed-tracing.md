# Distributed Tracing Reference

## Core Concepts

### Trace

A trace represents the complete journey of a request through a distributed system. It is identified by a unique `trace_id` that propagates across all services involved.

### Span

A span represents a single operation within a trace. Spans have:

| Field | Description | Example |
|-------|-------------|---------|
| `trace_id` | Unique trace identifier | `4bf92f3577b34da6a3ce929d0e0e4736` |
| `span_id` | Unique span identifier | `00f067aa0ba902b7` |
| `parent_span_id` | Parent span (if not root) | `ab23cd45ef67gh89` |
| `name` | Operation name | `HTTP GET /api/orders` |
| `kind` | Span type | `SERVER`, `CLIENT`, `PRODUCER`, `CONSUMER` |
| `start_time` | When the operation started | `2024-01-15T10:23:45.123Z` |
| `duration` | How long it took | `45ms` |
| `status` | OK or ERROR | `ERROR: deadline exceeded` |
| `attributes` | Key-value metadata | `http.status_code=200` |
| `events` | Timestamped annotations | `cache_miss at T+5ms` |

### Trace Structure Example

```
[Trace abc123]
  |
  +-- [Span 1] HTTP GET /api/orders (frontend-gateway, 150ms)
       |
       +-- [Span 2] HTTP GET /orders (order-service, 120ms)
            |
            +-- [Span 3] SELECT * FROM orders (postgres, 45ms)
            |
            +-- [Span 4] GET orders:user:123 (redis, 2ms)
            |
            +-- [Span 5] HTTP GET /users/123 (user-service, 30ms)
                 |
                 +-- [Span 6] SELECT * FROM users (postgres, 15ms)
```

## Context Propagation

### W3C Trace Context (Standard)

The W3C Trace Context specification defines two HTTP headers:

```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             |  |                                |                  |
             v  trace-id (32 hex)                span-id (16 hex)  flags (sampled)
             version

tracestate: vendor1=value1,vendor2=value2
```

### Propagation Across Service Boundaries

**HTTP calls**: Headers are injected into outgoing requests and extracted from incoming requests.

```python
# Automatic: auto-instrumented HTTP clients propagate context
import httpx
response = httpx.get("http://user-service/users/123")
# traceparent header is automatically added

# Manual: inject context into a carrier
from opentelemetry.propagate import inject

headers = {}
inject(headers)
# headers now contains traceparent and tracestate
response = custom_http_client.get("http://service/api", headers=headers)
```

**Message queues**: Context is propagated via message attributes/headers.

```python
# Producer: inject context into message headers
from opentelemetry.propagate import inject

message_headers = {}
inject(message_headers)
producer.send(topic="orders", value=order_data, headers=message_headers)

# Consumer: extract context from message headers
from opentelemetry.propagate import extract

ctx = extract(message.headers)
with tracer.start_as_current_span("process_order", context=ctx):
    process(message)
```

### Common Propagation Gaps

| Gap | Cause | Fix |
|-----|-------|-----|
| Traces end at service boundary | No propagation in HTTP client | Add auto-instrumentation for HTTP client library |
| Async gaps (queue, cron) | Context lost across message broker | Inject/extract context via message headers |
| Thread pool gaps | Context not transferred to worker threads | Use context-aware executors or manually propagate |
| Third-party API calls | External service does not propagate | Span ends at your HTTP client; no fix needed |
| Lambda/serverless gaps | Cold start loses context | Extract from event headers in handler |

## Sampling Strategies

### Head-Based Sampling

Decision made at trace start. Simple but cannot consider downstream information.

```python
from opentelemetry.sdk.trace.sampling import TraceIdRatioBased, ParentBased

# Sample 10% of traces; respect parent's sampling decision
sampler = ParentBased(root=TraceIdRatioBased(0.1))

provider = TracerProvider(
    resource=resource,
    sampler=sampler,
)
```

### Tail-Based Sampling

Decision made at the collector after seeing the complete trace. Retains important traces.

```yaml
# OpenTelemetry Collector config
processors:
  tail_sampling:
    decision_wait: 10s          # Wait for all spans to arrive
    num_traces: 100000          # Max traces in memory
    policies:
      # Always keep error traces
      - name: errors
        type: status_code
        status_code:
          status_codes: [ERROR]

      # Always keep slow traces
      - name: slow-traces
        type: latency
        latency:
          threshold_ms: 2000

      # Keep 100% of specific operations
      - name: critical-operations
        type: string_attribute
        string_attribute:
          key: operation.critical
          values: ["true"]

      # Sample 10% of everything else
      - name: default
        type: probabilistic
        probabilistic:
          sampling_percentage: 10
```

### Sampling Comparison

| Strategy | Pros | Cons |
|----------|------|------|
| Always On (100%) | Complete data | High cost, high volume |
| Head-based ratio | Low overhead | Randomly drops error traces |
| Parent-based | Consistent decisions | Depends on head-based root |
| Tail-based | Keeps important traces | Requires collector memory, adds latency |

### Recommended Approach

1. **Development/staging**: Always On (100%).
2. **Production**: Tail-based sampling at the collector. Keep all errors and slow traces; sample 1-10% of successful, fast traces.

## Span Attributes (Semantic Conventions)

### HTTP Server Spans

| Attribute | Example | Purpose |
|-----------|---------|---------|
| `http.request.method` | `GET` | HTTP method |
| `url.path` | `/api/orders` | Request path |
| `http.response.status_code` | `200` | Response status |
| `http.route` | `/api/orders/:id` | Route template |
| `server.address` | `api.example.com` | Server hostname |
| `user_agent.original` | `Mozilla/5.0...` | Client identification |

### Database Client Spans

| Attribute | Example | Purpose |
|-----------|---------|---------|
| `db.system` | `postgresql` | Database type |
| `db.name` | `orders` | Database name |
| `db.operation` | `SELECT` | Operation type |
| `db.statement` | `SELECT * FROM...` | Query (sanitized) |

### Messaging Spans

| Attribute | Example | Purpose |
|-----------|---------|---------|
| `messaging.system` | `kafka` | Messaging system |
| `messaging.destination.name` | `orders-topic` | Topic/queue name |
| `messaging.operation` | `publish` | Operation type |
| `messaging.message.id` | `msg-123` | Message identifier |

## Debugging with Traces

### Finding Slow Requests

1. Open Jaeger/Tempo and search by `service=api` and `duration > 2s`.
2. Open the trace waterfall to see which span is the bottleneck.
3. Check span attributes for context (query, endpoint, parameters).
4. If the slow span is a database call, check `db.statement` for the query.

### Finding Error Root Causes

1. Search by `status=ERROR` for the time range of the incident.
2. Open the trace and find the first span with an error status.
3. Check `exception.type` and `exception.message` in span events.
4. Look at parent spans for context about what triggered the error.

### Trace-Log-Metric Correlation

```
Dashboard: latency spike at 14:23
    |
    +-- Click exemplar on histogram panel
    |
    +-- Opens trace in Jaeger showing slow DB query
    |
    +-- Copy trace_id, search logs in Loki
    |
    +-- Find log: "connection pool exhausted, waiting 2.3s"
    |
    +-- Root cause: connection pool too small for traffic spike
```

## Trace Visualization

### Waterfall (Timeline) View

Best for understanding the sequence and duration of operations:

```
|-- API Gateway  [============]  150ms
|   |-- Auth     [==]            20ms
|   |-- Order    [========]     120ms
|       |-- DB   [====]          45ms
|       |-- Redis[=]              2ms
|       |-- User [===]           30ms
|           |-- DB[==]           15ms
```

### Service Map View

Best for understanding service dependencies and traffic flow. Shows:
- Services as nodes
- Request rate and error rate on edges
- Latency distributions between services

### Trace Comparison

Compare a slow trace against a fast trace for the same endpoint to identify the difference:
- Same spans but different durations -> performance regression
- Extra spans in slow trace -> N+1 query or unnecessary calls
- Missing spans in slow trace -> timeout or circuit breaker
