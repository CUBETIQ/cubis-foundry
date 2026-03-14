# Observability Eval Assertions

## Eval 1: OpenTelemetry Instrumentation

This eval tests the core instrumentation skill: configuring OpenTelemetry auto-instrumentation, adding custom spans, setting up trace propagation, and designing a collector pipeline with tail-based sampling.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `FastAPIInstrumentor` — Auto-instrumentation    | Auto-instrumentation provides baseline HTTP span visibility without manual code changes. Missing it means every endpoint requires hand-written span creation. |
| 2 | contains | `set_attribute` — Custom span attributes        | Business-relevant attributes (payment amount, status) on custom spans enable filtering and grouping traces by domain-specific dimensions during incident investigation. |
| 3 | contains | `tail_sampling` — Tail-based sampling processor | Tail-based sampling in the collector retains 100% of error traces while sampling successful traces. Head-based sampling randomly discards the error traces you need most. |
| 4 | contains | `service.name` — Resource attribute             | `service.name` is the primary resource attribute for filtering telemetry in multi-service environments. Without it, traces from different services are indistinguishable. |
| 5 | contains | `OTLPSpanExporter` — OTLP export protocol       | The OTLP exporter sends traces to the OpenTelemetry Collector using the standard protocol, maintaining vendor neutrality and enabling backend switching without code changes. |

### What a passing response looks like

- Python SDK setup with `TracerProvider`, `OTLPSpanExporter`, and `BatchSpanProcessor`.
- Resource attributes: `service.name=payment-service`, `service.version=1.2.0`, `deployment.environment=production`.
- `FastAPIInstrumentor().instrument()` for auto-instrumentation of all HTTP endpoints.
- A custom `process_payment` function wrapped with `tracer.start_as_current_span("process_payment")` and `span.set_attribute("payment.amount", amount)`.
- W3C Trace Context propagation configured via `set_global_textmap(TraceContextTextMapPropagator())`.
- OpenTelemetry Collector config with OTLP receiver, `tail_sampling` processor (sampling 100% of error traces, 10% of success), and exporters to Jaeger and Prometheus.

---

## Eval 2: SLO-Based Alerting

This eval tests the SLO design skill: defining SLIs in PromQL, calculating error budgets, configuring multi-window burn-rate alerts, and creating runbooks.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `burn_rate` — Burn-rate alert calculation        | Multi-window burn-rate alerts detect both fast burns (outage) and slow burns (gradual degradation) with appropriate urgency, unlike static threshold alerts that have a single sensitivity. |
| 2 | contains | `error_budget` — Error budget calculation        | Explicit error budget math (e.g., 0.1% = 43.2 minutes/month for 99.9% SLO) makes the cost of unreliability concrete and drives prioritization decisions between features and reliability work. |
| 3 | contains | `histogram_quantile` — PromQL percentile query   | Latency SLIs must use `histogram_quantile` to compute percentiles from histogram buckets. Using `rate()` on a counter gives average latency, which hides the tail that users actually experience. |
| 4 | contains | `runbook` — Runbook reference in alerts          | Every alert annotation must include a runbook URL. Without runbooks, on-call engineers waste incident time reverse-engineering what the alert means and what to investigate first. |
| 5 | contains | `30d` — Rolling window specification             | A 30-day rolling window provides a stable baseline for error budget calculations. Shorter windows create noisy budgets; longer windows delay detection of sustained degradation. |

### What a passing response looks like

- Availability SLI: `sum(rate(http_requests_total{service="checkout",code!~"5.."}[30d])) / sum(rate(http_requests_total{service="checkout"}[30d]))`.
- Latency SLI: `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service="checkout"}[30d])) by (le))`.
- Error budget: 99.9% availability = 0.1% budget = 43.2 minutes of total downtime per 30 days.
- Fast-burn alert: burn rate > 14.4x over 5m AND > 14.4x over 1h (pages immediately).
- Slow-burn alert: burn rate > 6x over 30m AND > 6x over 6h (creates ticket).
- Alert annotations with `runbook_url`, `summary`, and `description` fields.
- Runbook template with sections: Symptoms, Impact Assessment, Investigation Steps, Remediation, Escalation Path.
