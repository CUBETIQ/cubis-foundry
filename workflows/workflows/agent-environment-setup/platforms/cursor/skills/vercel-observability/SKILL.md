---
name: vercel-observability
description: "Vercel observability stack: logs, tracing (OTel), session tracing, speed insights, web analytics, alerts, custom events, log drains, audit logs, and structured monitoring."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, observability, runtime logs, tracing, opentelemetry, session tracing, speed insights, web analytics, alerts, log drain, audit log, custom events, monitoring
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: monitoring-expert, sre-engineer, vercel-functions, vercel-firewall
  consolidates: vercel-observability-overview, vercel-alerts-monitoring, vercel-runtime-logs, vercel-log-drain-reference, vercel-log-trace-correlation, vercel-session-tracing, vercel-tracing-otel, vercel-speed-insights, vercel-web-analytics, vercel-custom-events, vercel-audit-logs, vercel-drains-setup
---

# Vercel Observability

## Purpose

Instrument, collect, and act on observability signals from Vercel deployments: structured runtime logs, distributed traces, session tracing, performance metrics, analytics, and audit events.

## When To Use

- Setting up runtime log viewing and structured log queries.
- Configuring log drains to export to external systems (Datadog, Baselime, etc.).
- Implementing OpenTelemetry (OTel) tracing in Vercel functions.
- Correlating logs with traces and requests via trace IDs.
- Monitoring Core Web Vitals with Speed Insights.
- Collecting custom business events for product analytics.
- Tracking user sessions for debugging with Session Tracing.
- Reviewing audit logs for security and compliance.
- Setting up threshold alerts on function errors, p99 latency, etc.

## Domain Areas

### Runtime Logs

- View and filter logs in Vercel dashboard or CLI.
- Structure logs with consistent fields (level, traceId, userId).

### Log Drains

- Configure HTTP or HTTPS log drain endpoints.
- Filter by source (functions, edge, build) and log level.
- Validate drain delivery and handle backpressure.

### OpenTelemetry Tracing

- Instrument functions with `@vercel/otel` or standard OTel SDK.
- Export spans to Vercel or external OTLP endpoints.
- Correlate log entries with trace IDs for unified debugging.

### Session Tracing

- Enable session capture for replay-based debugging.
- Scope to error sessions or specific user segments.

### Speed Insights

- Install `@vercel/speed-insights` in Next.js or other frameworks.
- Monitor LCP, FID/INP, CLS per route.
- Set performance budgets and track regressions.

### Web Analytics

- Enable Vercel Web Analytics for privacy-first traffic data.
- Track page views, referrers, and custom events.

### Custom Events

- Emit custom events via `@vercel/analytics/react` or REST API.
- Use for funnel tracking, feature adoption, and error reporting.

### Alerts & Monitoring

- Configure threshold alerts on error rate, latency, and availability.
- Route alerts to Slack, PagerDuty, or webhooks.

### Audit Logs

- Review deployment, permission, and configuration changes.
- Export audit logs for compliance reporting.

## Operating Checklist

1. Enable runtime logs and configure structured log format.
2. Set up log drain to external system if needed.
3. Instrument functions with OTel and validate trace export.
4. Install Speed Insights and establish performance budgets.
5. Configure alerts with non-noisy thresholds and on-call routing.
6. Schedule audit log review cadence for security compliance.

## Output Contract

- Observability architecture diagram (logs → traces → metrics → alerts)
- Log structure schema and drain configuration
- OTel instrumentation code and exporter config
- Speed Insights dashboard and performance budget definition
- Alert policy with thresholds and escalation routing
