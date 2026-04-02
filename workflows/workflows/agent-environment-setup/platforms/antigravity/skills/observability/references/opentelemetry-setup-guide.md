# OpenTelemetry Setup Guide

## SDK initialization (Node.js)

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: "my-service",
    [ATTR_SERVICE_VERSION]: "1.0.0",
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + "/v1/traces",
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + "/v1/metrics",
    }),
    exportIntervalMillis: 60_000,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
process.on("SIGTERM", () => sdk.shutdown());
```

- Initialize the SDK before any other imports that need instrumentation.
- Use environment variables for endpoint configuration — do not hardcode.

## SDK initialization (Python)

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

resource = Resource.create({"service.name": "my-service", "service.version": "1.0.0"})
provider = TracerProvider(resource=resource)
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
trace.set_tracer_provider(provider)

FlaskInstrumentor().instrument()
RequestsInstrumentor().instrument()
```

## Auto-instrumentation coverage

| Library                              | What it captures                                             |
| ------------------------------------ | ------------------------------------------------------------ |
| HTTP server (Express, Flask, etc.)   | Inbound request spans with method, route, status             |
| HTTP client (fetch, axios, requests) | Outbound request spans with URL, status, duration            |
| Database (pg, mysql2, pymongo)       | Query spans with statement, parameters (sanitized), duration |
| Message queues (amqplib, kafkajs)    | Produce/consume spans with topic, partition, offset          |
| gRPC                                 | Client and server call spans with method, status             |

## Custom span creation

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-service");

async function processOrder(orderId: string) {
  return tracer.startActiveSpan("process-order", async (span) => {
    span.setAttribute("order.id", orderId);
    try {
      const result = await chargePayment(orderId);
      span.setAttribute("order.status", "completed");
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Sampling strategy

- **Development**: 100% sampling — capture everything.
- **Staging**: 100% sampling — reproduce production-like trace volume.
- **Production**:
  - Always sample errors and slow requests (tail-based sampling).
  - Sample 1-10% of successful requests depending on volume.
  - Use parent-based sampling to preserve complete traces.

## Exporter configuration

| Backend       | Protocol  | Endpoint pattern               |
| ------------- | --------- | ------------------------------ |
| Jaeger        | OTLP/gRPC | `http://jaeger:4317`           |
| Grafana Tempo | OTLP/HTTP | `http://tempo:4318/v1/traces`  |
| Datadog       | OTLP/gRPC | `http://datadog-agent:4317`    |
| Honeycomb     | OTLP/gRPC | `https://api.honeycomb.io:443` |

Set via `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable for portability.

## Context propagation

- Use W3C Trace Context (`traceparent`, `tracestate` headers) — this is the default in OTel.
- Ensure all HTTP clients and servers propagate context headers.
- For message queues, inject trace context into message headers/attributes.
- For background jobs, pass trace parent as a job metadata field.
