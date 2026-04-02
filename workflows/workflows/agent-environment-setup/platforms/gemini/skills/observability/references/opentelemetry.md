# OpenTelemetry Reference

## Architecture Overview

```
Application (SDK)  -->  OTel Collector  -->  Backend (Jaeger, Prometheus, etc.)
  |                      |
  |-- Auto-instrumentation   |-- Receivers (OTLP, Jaeger, Zipkin)
  |-- Manual spans           |-- Processors (batch, sampling, attributes)
  |-- Metrics                |-- Exporters (OTLP, Prometheus, Jaeger)
  |-- Logs
```

## SDK Setup by Language

### Python

```python
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.semconv.resource import ResourceAttributes

resource = Resource.create({
    ResourceAttributes.SERVICE_NAME: "my-service",
    ResourceAttributes.SERVICE_VERSION: "1.0.0",
    ResourceAttributes.DEPLOYMENT_ENVIRONMENT: "production",
})

provider = TracerProvider(resource=resource)
exporter = OTLPSpanExporter(endpoint="http://otel-collector:4317", insecure=True)
provider.add_span_processor(BatchSpanProcessor(exporter))
trace.set_tracer_provider(provider)
```

### Node.js

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'my-service',
    'service.version': '1.0.0',
    'deployment.environment': 'production',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4317',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### Go

```go
package main

import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

func initTracer() (*sdktrace.TracerProvider, error) {
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("otel-collector:4317"),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }

    res := resource.NewWithAttributes(
        semconv.SchemaURL,
        semconv.ServiceName("my-service"),
        semconv.ServiceVersion("1.0.0"),
        semconv.DeploymentEnvironment("production"),
    )

    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(res),
    )
    otel.SetTracerProvider(tp)
    return tp, nil
}
```

## Auto-Instrumentation Libraries

### Python

```bash
pip install opentelemetry-instrumentation-fastapi
pip install opentelemetry-instrumentation-sqlalchemy
pip install opentelemetry-instrumentation-httpx
pip install opentelemetry-instrumentation-redis
pip install opentelemetry-instrumentation-celery
```

```python
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

FastAPIInstrumentor.instrument_app(app)
SQLAlchemyInstrumentor().instrument(engine=engine)
```

### Node.js

```bash
npm install @opentelemetry/auto-instrumentations-node
```

Covers: Express, Fastify, HTTP, pg, mysql, redis, ioredis, AWS SDK, gRPC.

### Go

```bash
go get go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp
go get go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc
```

## Manual Instrumentation

### Creating Custom Spans

```python
tracer = trace.get_tracer("my-service.module-name")

def process_order(order_id: str, total: float):
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order_id)
        span.set_attribute("order.total", total)

        try:
            result = charge_payment(order_id, total)
            span.set_attribute("order.status", "completed")
            return result
        except Exception as e:
            span.set_status(StatusCode.ERROR, str(e))
            span.record_exception(e)
            raise
```

### Span Events

```python
span.add_event("cache_miss", {"key": cache_key})
span.add_event("retry_attempt", {"attempt": 3, "reason": "timeout"})
```

### Span Links

Connect related but non-parent-child traces:

```python
# Link a consumer span to the producer span
link = trace.Link(producer_span_context)
with tracer.start_as_current_span("process_message", links=[link]):
    process(message)
```

## Context Propagation

### W3C Trace Context (Standard)

```python
from opentelemetry.propagate import set_global_textmap
from opentelemetry.trace.propagation import TraceContextTextMapPropagator

set_global_textmap(TraceContextTextMapPropagator())
```

Headers:
```
traceparent: 00-<trace-id>-<span-id>-<flags>
tracestate: <vendor-specific>
```

### Composite Propagator (Multi-Format)

```python
from opentelemetry.propagators.composite import CompositeTextMapPropagator
from opentelemetry.propagators.b3 import B3MultiFormat

set_global_textmap(CompositeTextMapPropagator([
    TraceContextTextMapPropagator(),  # W3C (primary)
    B3MultiFormat(),                   # B3 (legacy compatibility)
]))
```

## OpenTelemetry Collector

### Configuration Structure

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    send_batch_size: 1024

  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128

  resource:
    attributes:
      - key: environment
        value: production
        action: upsert

exporters:
  otlp/jaeger:
    endpoint: jaeger:4317
    tls:
      insecure: true

  prometheus:
    endpoint: 0.0.0.0:8889

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

service:
  extensions: [health_check]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [otlp/jaeger]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus]
```

### Deployment Models

| Model | Use Case | Pros | Cons |
|-------|----------|------|------|
| Sidecar | Per-pod collector | Isolation, per-service config | Resource overhead per pod |
| DaemonSet | Per-node collector | Efficient, shared resources | Node-level config only |
| Deployment | Central collector | Simple, centralized config | Single point of failure |
| Gateway | Edge collector | Load balancing, protocol translation | Additional hop |

### Collector Health Check

```yaml
extensions:
  health_check:
    endpoint: 0.0.0.0:13133
    path: /health

# Kubernetes readiness probe
readinessProbe:
  httpGet:
    path: /health
    port: 13133
```

## Resource Attributes

Standard resource attributes that should be set on all telemetry:

| Attribute | Example | Purpose |
|-----------|---------|---------|
| `service.name` | "payment-service" | Primary service identifier |
| `service.version` | "1.2.3" | Correlate behavior with versions |
| `service.namespace` | "commerce" | Group related services |
| `deployment.environment` | "production" | Filter by environment |
| `host.name` | "pod-abc-123" | Identify specific instance |
| `cloud.provider` | "aws" | Infrastructure context |
| `cloud.region` | "us-east-1" | Regional performance analysis |

## Environment Variable Configuration

The OpenTelemetry SDK supports configuration via environment variables:

```bash
OTEL_SERVICE_NAME=my-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1          # 10% sampling
OTEL_RESOURCE_ATTRIBUTES=service.version=1.0.0,deployment.environment=production
OTEL_LOG_LEVEL=info
```
