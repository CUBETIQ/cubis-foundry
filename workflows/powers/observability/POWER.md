````markdown
---
inclusion: manual
name: observability
description: "Use when designing or reviewing logging, monitoring, tracing, and alerting for production services. Covers structured logging, distributed tracing, metric collection, dashboard design, alert hygiene, SLO definition, and incident readiness across application and infrastructure layers."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Observability

## Purpose

Use when designing or reviewing logging, monitoring, tracing, and alerting for production services. Covers structured logging, distributed tracing, metric collection, dashboard design, alert hygiene, SLO definition, and incident readiness across application and infrastructure layers.

## When to Use

- Working on observability related tasks

## Instructions

1. **Define SLOs first** — decide what "healthy" means before instrumenting. SLOs drive alerting, not the other way around.
2. **Instrument the golden signals** — latency, traffic, errors, saturation. Every service must expose these four.
3. **Structured logging** — JSON to stdout. Include request ID, user context, operation name, and outcome. Never log secrets or PII.
4. **Distributed tracing** — propagate trace context across service boundaries. Instrument entry points, database calls, and external API calls.
5. **Alert on symptoms, not causes** — alert on SLO burn rate, not on CPU percentage. Alerts must be actionable.

### Three pillars

### Logs

- Write structured JSON logs to stdout/stderr. Let the platform handle collection.
- Include: timestamp (ISO 8601), level, service name, trace ID, span ID, message, and relevant context fields.
- Log levels: ERROR for failures requiring attention, WARN for degraded but functional, INFO for key business events, DEBUG for development only (disabled in production).
- Never log: passwords, tokens, credit card numbers, PII, or full request/response bodies in production.
- Correlation: every log line must include the request/trace ID for cross-referencing with traces and metrics.

### Metrics

- Use RED method for request-driven services: Rate, Errors, Duration.
- Use USE method for resources: Utilization, Saturation, Errors.
- Histogram for latency (not averages — p50/p95/p99 matter).
- Counter for request counts, error counts, and throughput.
- Gauge for current state (queue depth, active connections, cache size).
- Label cardinality: keep label values bounded. Never use user IDs or request IDs as metric labels.

### Traces

- Use OpenTelemetry SDK for instrumentation — vendor-neutral, industry standard.
- Auto-instrument HTTP clients, database drivers, and message consumers.
- Add custom spans for significant business operations.
- Propagate W3C Trace Context headers across all service boundaries.
- Sample appropriately: 100% for errors, tail-sampled for high-volume happy paths.

### SLO design

- Define SLIs (Service Level Indicators) from the user's perspective — e.g., "percentage of requests completing in under 200ms."
- Set SLOs at realistic targets — 99.9% is very different from 99.99%.
- Calculate error budget: `1 - SLO target`. When budget is consumed, prioritize reliability over features.
- Review SLOs quarterly. Adjust based on actual user impact data.

### Alerting hygiene

- Every alert must have: a clear title, expected impact, runbook link, and escalation path.
- Use multi-window burn rate alerts for SLO-based alerting.
- Suppress alerts during maintenance windows.
- Page only for user-facing impact. Use tickets for slow-burn degradation.
- Review alert fatigue monthly. If an alert fires more than weekly without action, fix or remove it.

### Dashboard design

- Start with a service overview dashboard: golden signals, SLO status, recent deployments.
- Use consistent time ranges and refresh intervals across dashboards.
- Top-to-bottom layout: high-level health → request flow → resource utilization → dependencies.
- Every graph must have: title, unit, and a brief description of what abnormal looks like.
- Avoid vanity dashboards — every panel must answer a question someone would ask during an incident.

### Constraints

- Avoid logging at DEBUG level in production — volume overwhelms analysis.
- Avoid high-cardinality metric labels (user ID, IP address, full URL path).
- Avoid alert on every error — alert on error rate exceeding SLO budget.
- Avoid dashboard sprawl — ten dashboards nobody checks are worse than two good ones.
- Avoid instrumenting everything with traces — sample and focus on critical paths.
- Avoid using averages instead of percentiles for latency metrics.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

| File                                       | Purpose                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `references/opentelemetry-setup-guide.md`  | OTel SDK setup, auto-instrumentation, exporter configuration, and sampling strategy.            |
| `references/alerting-and-slo-checklist.md` | SLO definition template, burn-rate alert formulas, runbook structure, and alert review process. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with observability best practices in this project"
- "Review my observability implementation for issues"
````
