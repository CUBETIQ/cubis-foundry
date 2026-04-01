# Example: OpenTelemetry Instrumentation for FastAPI

## Prompt

> Instrument a Python FastAPI payment service with OpenTelemetry. I need auto-instrumentation for HTTP and database spans, a custom span for payment processing with business attributes, W3C trace propagation, and a collector config with tail-based sampling that keeps all errors and 10% of successes. Export to Jaeger and Prometheus.

## Response

### `app/telemetry.py`

```python
"""OpenTelemetry SDK initialization for the payment service."""

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.propagate import set_global_textmap
from opentelemetry.propagators.composite import CompositeTextMapPropagator
from opentelemetry.propagators.b3 import B3MultiFormat
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.semconv.resource import ResourceAttributes
from opentelemetry.trace.propagation import TraceContextTextMapPropagator

import os


def init_telemetry(app, db_engine=None):
    """Initialize OpenTelemetry with auto-instrumentation and OTLP export.

    Call this once at application startup before handling any requests.
    """

    # Resource attributes identify this service in multi-service traces
    resource = Resource.create({
        ResourceAttributes.SERVICE_NAME: "payment-service",
        ResourceAttributes.SERVICE_VERSION: os.getenv("APP_VERSION", "0.0.0"),
        ResourceAttributes.DEPLOYMENT_ENVIRONMENT: os.getenv("DEPLOY_ENV", "development"),
        "service.team": "payments",
    })

    # Configure the tracer provider with OTLP export to the collector
    provider = TracerProvider(resource=resource)
    otlp_exporter = OTLPSpanExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317"),
        insecure=True,
    )
    provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
    trace.set_tracer_provider(provider)

    # W3C Trace Context propagation (with B3 fallback for legacy services)
    set_global_textmap(CompositeTextMapPropagator([
        TraceContextTextMapPropagator(),
        B3MultiFormat(),
    ]))

    # Auto-instrumentation: captures HTTP spans for every FastAPI endpoint
    FastAPIInstrumentor.instrument_app(app)

    # Auto-instrumentation: captures database query spans
    if db_engine:
        SQLAlchemyInstrumentor().instrument(engine=db_engine)

    # Auto-instrumentation: captures outgoing HTTP client spans
    HTTPXClientInstrumentor().instrument()

    return provider
```

### `app/services/payment.py`

```python
"""Payment processing with custom OpenTelemetry spans."""

from opentelemetry import trace
from opentelemetry.trace import StatusCode

tracer = trace.get_tracer("payment-service.payment")


async def process_payment(order_id: str, amount: float, currency: str, method: str):
    """Process a payment with full trace instrumentation.

    The custom span captures business-relevant attributes that enable
    filtering traces by payment amount, status, and method during
    incident investigation.
    """
    with tracer.start_as_current_span("process_payment") as span:
        # Record business attributes for trace filtering and debugging
        span.set_attribute("payment.order_id", order_id)
        span.set_attribute("payment.amount", amount)
        span.set_attribute("payment.currency", currency)
        span.set_attribute("payment.method", method)

        try:
            # Validate payment details
            with tracer.start_as_current_span("validate_payment"):
                _validate_payment(amount, currency, method)

            # Call the payment gateway (outgoing HTTP is auto-instrumented)
            with tracer.start_as_current_span("charge_gateway") as gateway_span:
                gateway_span.set_attribute("gateway.provider", "stripe")
                result = await _charge_gateway(order_id, amount, currency, method)

            # Record the outcome
            span.set_attribute("payment.status", "success")
            span.set_attribute("payment.transaction_id", result.transaction_id)
            return result

        except PaymentDeclinedError as e:
            span.set_attribute("payment.status", "declined")
            span.set_attribute("payment.decline_reason", str(e))
            span.set_status(StatusCode.ERROR, f"Payment declined: {e}")
            span.record_exception(e)
            raise

        except Exception as e:
            span.set_attribute("payment.status", "error")
            span.set_status(StatusCode.ERROR, f"Payment failed: {e}")
            span.record_exception(e)
            raise
```

### `app/main.py`

```python
"""FastAPI application entry point with telemetry initialization."""

from fastapi import FastAPI
from app.telemetry import init_telemetry
from app.database import engine
from app.routers import payments, health

app = FastAPI(title="Payment Service")

# Initialize OpenTelemetry before any routes are handled
provider = init_telemetry(app, db_engine=engine)

app.include_router(payments.router)
app.include_router(health.router)


@app.on_event("shutdown")
async def shutdown():
    provider.shutdown()
```

### `otel-collector-config.yaml`

```yaml
# OpenTelemetry Collector configuration
# Receives OTLP from application SDKs, applies tail-based sampling,
# and exports to Jaeger (traces) and Prometheus (metrics).

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  # Batch spans to reduce export overhead
  batch:
    timeout: 5s
    send_batch_size: 1024

  # Tail-based sampling: retain 100% of error traces, 10% of successes
  tail_sampling:
    decision_wait: 10s
    num_traces: 100000
    expected_new_traces_per_sec: 1000
    policies:
      # Policy 1: Always keep traces with errors
      - name: errors-always
        type: status_code
        status_code:
          status_codes:
            - ERROR
      # Policy 2: Always keep slow traces (> 2 seconds)
        name: slow-traces
        type: latency
        latency:
          threshold_ms: 2000
      # Policy 3: Sample 10% of remaining (successful, fast) traces
      - name: success-sampling
        type: probabilistic
        probabilistic:
          sampling_percentage: 10

  # Add resource attributes for all telemetry
  resource:
    attributes:
      - key: deployment.cluster
        value: "us-east-1-prod"
        action: upsert

exporters:
  # Jaeger for trace visualization and search
  otlp/jaeger:
    endpoint: jaeger-collector:4317
    tls:
      insecure: true

  # Prometheus for metrics (using the spanmetrics connector)
  prometheus:
    endpoint: 0.0.0.0:8889
    resource_to_telemetry_conversion:
      enabled: true

  # Debug exporter for local development
  debug:
    verbosity: basic

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [tail_sampling, batch, resource]
      exporters: [otlp/jaeger]
    metrics:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [prometheus]
```

### Key decisions

1. **`FastAPIInstrumentor.instrument_app(app)`** auto-creates spans for every HTTP endpoint, providing baseline visibility without touching route handlers.
2. **Custom `process_payment` span with `set_attribute`** records business dimensions (amount, currency, status) that enable filtering traces by "payments over $1000 that failed" during incidents.
3. **`tail_sampling` in the collector** makes sampling decisions after seeing the complete trace, guaranteeing that all error and slow traces are retained while sampling 10% of routine successes.
4. **`service.name` resource attribute** is the primary key for filtering telemetry in multi-service environments -- without it, traces from different services are indistinguishable.
5. **OTLP export to collector** (not directly to Jaeger) maintains vendor neutrality. Switching backends requires only a collector config change, not an application redeployment.
