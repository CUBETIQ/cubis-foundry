# Metrics Design Reference

## Metric Types

### Counter

A monotonically increasing value. Only goes up (or resets to zero on restart).

```
http_requests_total{method="GET", path="/api/orders", status="200"} 15234
```

**Use for:** Request counts, error counts, bytes sent, messages processed.

**Query patterns:**

```promql
# Rate of requests per second over 5 minutes
rate(http_requests_total[5m])

# Increase in errors over the last hour
increase(http_requests_total{status=~"5.."}[1h])
```

### Histogram

Distributes observed values into configurable buckets. Essential for latency measurement.

```
http_request_duration_seconds_bucket{le="0.01"} 1000
http_request_duration_seconds_bucket{le="0.05"} 3500
http_request_duration_seconds_bucket{le="0.1"}  5200
http_request_duration_seconds_bucket{le="0.5"}  9800
http_request_duration_seconds_bucket{le="1.0"}  9950
http_request_duration_seconds_bucket{le="+Inf"} 10000
http_request_duration_seconds_sum 2345.67
http_request_duration_seconds_count 10000
```

**Use for:** Request latency, response sizes, queue wait times.

**Query patterns:**

```promql
# p99 latency
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# p50 (median) latency
histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Average latency
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

### Gauge

A value that can go up or down. Represents a current state.

```
db_connections_active{pool="primary"} 42
queue_messages_pending{queue="orders"} 156
```

**Use for:** Active connections, queue depth, cache size, temperature, in-progress requests.

### Summary

Pre-calculated percentiles on the client. Avoid unless histograms are not feasible.

**When to use summaries instead of histograms:** When you need precise percentiles for a single instance and cannot aggregate across instances.

## Bucket Design for Histograms

### Default Buckets (Often Wrong)

```
[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
```

### Better: Application-Specific Buckets

```python
# For a web API targeting sub-200ms responses
buckets = [0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1.0, 2.5, 5.0, 10.0]

# For a batch processing system (seconds to minutes)
buckets = [1, 5, 10, 30, 60, 120, 300, 600, 1800]

# For a database query tracker
buckets = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
```

### Bucket Selection Rules

1. Place dense buckets around your SLO threshold (e.g., many buckets near 200ms for a 200ms SLO).
2. Include at least one bucket below your best expected performance.
3. Include at least one bucket above your worst acceptable performance.
4. Use 8-15 buckets. More buckets increase storage and query cost.

## Label Design

### Good Labels (Bounded Cardinality)

| Label | Values | Cardinality |
|-------|--------|-------------|
| `method` | GET, POST, PUT, DELETE | 4 |
| `status` | 2xx, 3xx, 4xx, 5xx | 4 |
| `service` | api, web, worker | 3 |
| `environment` | dev, staging, production | 3 |
| `region` | us-east-1, eu-west-1 | ~5 |

### Bad Labels (Unbounded Cardinality)

| Label | Problem | Fix |
|-------|---------|-----|
| `user_id` | Millions of values | Log it; do not label it |
| `request_id` | Unique per request | Use traces instead |
| `url_path` | `/users/123` has infinite paths | Normalize: `/users/:id` |
| `ip_address` | Millions of values | Aggregate by subnet or region |
| `query` | Every SQL query is unique | Normalize or hash |

### Cardinality Budget

```
Total time series = metric_count * label_combination_count

Example:
  http_request_duration_seconds with:
    - 4 methods * 4 status groups * 3 services * 15 buckets
    = 720 time series per metric

Budget: Keep total time series under 100,000 per service.
```

## Naming Conventions

### OpenTelemetry Semantic Conventions

```
http.server.request.duration        (histogram, seconds)
http.server.active_requests         (gauge)
http.client.request.duration        (histogram, seconds)
db.client.operation.duration        (histogram, seconds)
messaging.receive.duration          (histogram, seconds)
```

### Prometheus Conventions

```
http_requests_total                 (counter, with method/status labels)
http_request_duration_seconds       (histogram)
db_connections_active               (gauge)
process_cpu_seconds_total           (counter)
```

### Naming Rules

| Rule | Example |
|------|---------|
| Use snake_case | `http_request_duration_seconds` |
| Include unit as suffix | `_seconds`, `_bytes`, `_total` |
| Use `_total` for counters | `http_requests_total` |
| Use base units | Seconds (not ms), bytes (not KB) |
| Be specific | `order_payment_failures_total` not `errors_total` |

## RED and USE Methods

### RED Method (Request-Driven Services)

| Signal | Metric Type | Example |
|--------|-------------|---------|
| **R**ate | Counter | `http_requests_total` -> `rate(http_requests_total[5m])` |
| **E**rrors | Counter | `http_requests_total{status=~"5.."}` |
| **D**uration | Histogram | `http_request_duration_seconds` |

### USE Method (Resources)

| Signal | Metric Type | Example |
|--------|-------------|---------|
| **U**tilization | Gauge | `node_cpu_seconds_total` (% of time busy) |
| **S**aturation | Gauge | `node_disk_io_time_weighted_seconds_total` |
| **E**rrors | Counter | `node_disk_io_errors_total` |

## Recording Rules

Pre-compute expensive queries to speed up dashboard loading:

```yaml
groups:
  - name: http_recording_rules
    interval: 15s
    rules:
      # Pre-compute error rate
      - record: http:error_rate:5m
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
          / sum(rate(http_requests_total[5m])) by (service)

      # Pre-compute p99 latency
      - record: http:latency_p99:5m
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
          )

      # Pre-compute request rate
      - record: http:request_rate:5m
        expr: sum(rate(http_requests_total[5m])) by (service)
```

## Exemplars

Link metric data points to specific trace IDs for drill-down from dashboards to traces.

```python
# Python: record exemplar with histogram observation
from opentelemetry import trace

span = trace.get_current_span()
trace_id = format(span.get_span_context().trace_id, "032x")

histogram.record(duration, {"trace_id": trace_id})
```

```promql
# Query with exemplars in Grafana
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
# Toggle "Exemplars" in Grafana panel to see linked traces
```
