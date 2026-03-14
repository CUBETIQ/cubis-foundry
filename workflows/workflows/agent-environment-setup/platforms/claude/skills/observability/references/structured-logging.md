# Structured Logging Reference

## Why Structured Logging

Structured logs (JSON) enable machine parsing, filtering, aggregation, and correlation that is impossible with free-text log messages.

### Unstructured (Bad)

```
2024-01-15 10:23:45 INFO Processing order #12345 for user john@example.com - total: $99.99
```

### Structured (Good)

```json
{
  "timestamp": "2024-01-15T10:23:45.123Z",
  "level": "info",
  "service": "order-service",
  "message": "Processing order",
  "trace_id": "abc123def456",
  "span_id": "789xyz",
  "order_id": "12345",
  "user_id": "usr_abc",
  "total": 99.99,
  "currency": "USD"
}
```

## Log Schema

### Mandatory Fields

Every log line must include these fields for correlation and filtering:

| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| `timestamp` | ISO 8601 | `2024-01-15T10:23:45.123Z` | Event ordering |
| `level` | string | `info`, `warn`, `error` | Severity filtering |
| `service` | string | `order-service` | Service identification |
| `message` | string | `Processing order` | Human-readable summary |
| `trace_id` | string | `abc123def456` | Trace correlation |
| `span_id` | string | `789xyz` | Span correlation |

### Recommended Fields

| Field | Type | When to Include |
|-------|------|----------------|
| `request_id` | string | Every HTTP request |
| `user_id` | string | When user context is available |
| `method` | string | HTTP handler logs |
| `path` | string | HTTP handler logs |
| `status_code` | int | HTTP response logs |
| `duration_ms` | float | Performance-sensitive operations |
| `error.type` | string | Error logs |
| `error.message` | string | Error logs |
| `error.stack` | string | Error logs (not in production for PII safety) |

## Log Levels

| Level | Use For | Production Enabled | Example |
|-------|---------|-------------------|---------|
| `error` | Failures requiring attention | Yes | Database connection failed |
| `warn` | Degraded but functional | Yes | Cache miss, fallback used |
| `info` | Key business events | Yes | Order placed, user signed in |
| `debug` | Development diagnostics | No | SQL queries, cache contents |
| `trace` | Fine-grained debugging | No | Function entry/exit |

### Level Selection Rules

1. If a human needs to investigate, use `error`.
2. If the system recovered automatically, use `warn`.
3. If it is a normal business event, use `info`.
4. If it is only useful during development, use `debug`.

## Implementation by Language

### Python (structlog)

```python
import structlog

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)

logger = structlog.get_logger()

# Bind context that persists across log calls
logger = logger.bind(service="order-service", version="1.2.0")

# Log with additional context
logger.info("order.processed", order_id="12345", total=99.99, currency="USD")
```

### Node.js (pino)

```javascript
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'order-service',
    version: '1.2.0',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Log with context
logger.info({ orderId: '12345', total: 99.99 }, 'order.processed');
```

### Go (slog)

```go
import (
    "log/slog"
    "os"
)

logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
}))
slog.SetDefault(logger)

slog.Info("order.processed",
    slog.String("order_id", "12345"),
    slog.Float64("total", 99.99),
    slog.String("currency", "USD"),
)
```

## Trace-Log Correlation

### Injecting Trace Context into Logs

```python
# Python with structlog + OpenTelemetry
from opentelemetry import trace

def add_trace_context(logger, method_name, event_dict):
    span = trace.get_current_span()
    if span.is_recording():
        ctx = span.get_span_context()
        event_dict["trace_id"] = format(ctx.trace_id, "032x")
        event_dict["span_id"] = format(ctx.span_id, "016x")
    return event_dict

structlog.configure(
    processors=[
        add_trace_context,
        # ... other processors
    ],
)
```

### Querying Correlated Logs

In your log aggregator (Grafana Loki, Elasticsearch, Datadog):

```
# Find all logs for a specific trace
trace_id="abc123def456"

# Find all error logs for the order service in the last hour
service="order-service" level="error" | json | line_format "{{.message}}"
```

## PII and Security

### Never Log

| Data Type | Example | Risk |
|-----------|---------|------|
| Passwords | `password: "secret123"` | Credential theft |
| API tokens | `token: "sk_live_..."` | Account takeover |
| Credit cards | `card: "4242..."` | PCI DSS violation |
| SSN/Tax IDs | `ssn: "123-45-6789"` | Identity theft |
| Full email | `email: "john@..."` | GDPR violation |
| Request bodies | `body: {...}` | May contain any of the above |

### Redaction Patterns

```python
# Python: redact sensitive fields before logging
import re

REDACT_PATTERNS = {
    "password": "***REDACTED***",
    "token": "***REDACTED***",
    "authorization": "***REDACTED***",
}

def redact_processor(logger, method_name, event_dict):
    for key in list(event_dict.keys()):
        if key.lower() in REDACT_PATTERNS:
            event_dict[key] = REDACT_PATTERNS[key.lower()]
    return event_dict
```

## Log Pipeline Architecture

```
Application (JSON to stdout)
    |
    v
Log Collector (Fluent Bit / Fluentd / Vector)
    |-- Parse JSON
    |-- Enrich with Kubernetes metadata
    |-- Redact PII
    |-- Route by level/service
    |
    v
Log Aggregator (Loki / Elasticsearch / Datadog)
    |
    v
Dashboard (Grafana / Kibana)
```

### Fluent Bit Configuration (Kubernetes)

```yaml
[INPUT]
    Name              tail
    Path              /var/log/containers/*.log
    Parser            cri
    Tag               kube.*
    Mem_Buf_Limit     5MB
    Skip_Long_Lines   On

[FILTER]
    Name              kubernetes
    Match             kube.*
    Merge_Log         On
    Keep_Log          Off
    Annotations       On
    Labels            On

[OUTPUT]
    Name              loki
    Match             kube.*
    Host              loki.monitoring.svc.cluster.local
    Port              3100
    Labels            job=fluent-bit, namespace=$kubernetes['namespace_name']
```

## Log-Based Metrics

Extract metrics from logs without adding instrumentation to the application:

```yaml
# Grafana Loki: recording rule
groups:
  - name: log-metrics
    rules:
      - record: log:error_count:5m
        expr: |
          sum by (service) (
            count_over_time({level="error"}[5m])
          )
```

## Retention and Cost Management

| Log Level | Retention | Rationale |
|-----------|-----------|-----------|
| `error` | 90 days | Incident investigation, trend analysis |
| `warn` | 30 days | Short-term debugging |
| `info` | 14 days | Operational insight |
| `debug` | 1 day (if enabled) | Active debugging only |

### Cost Reduction Strategies

1. **Drop debug logs in production** at the application level, not the collector.
2. **Sample high-volume info logs** (keep 10% of health check logs).
3. **Extract metrics from logs** instead of retaining raw logs for counting.
4. **Compress and tier storage** (hot: 7 days, warm: 30 days, cold: 90 days).
