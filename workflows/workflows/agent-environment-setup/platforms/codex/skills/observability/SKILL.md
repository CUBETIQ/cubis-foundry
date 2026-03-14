---
name: observability
description: "Use when implementing observability and monitoring: OpenTelemetry instrumentation, structured logging, metrics design, distributed tracing, alerting strategies, SLO/SLI definitions, dashboards, and incident response runbooks."
---
# Observability and Monitoring

## Purpose

Guide the design and implementation of production-grade observability systems that provide actionable insight into application behavior, performance, and reliability. Every instruction prioritizes the three pillars of observability (logs, metrics, traces), correlation across signals, alert quality over quantity, and SLO-driven operational practices that reduce mean time to detection and resolution.

## When to Use

- Instrumenting an application with OpenTelemetry for traces, metrics, and logs.
- Designing structured logging schemas for consistent, queryable log output.
- Defining SLOs, SLIs, and error budgets for a service or user journey.
- Configuring alerting rules that minimize false positives and alert fatigue.
- Building dashboards that surface actionable information for on-call engineers.
- Debugging production incidents using distributed traces and correlated telemetry.

## Instructions

1. **Instrument with OpenTelemetry SDK using auto-instrumentation as the baseline** because auto-instrumentation captures HTTP, database, and RPC spans without code changes, providing immediate visibility, and manual instrumentation should only be added for business-critical code paths that auto-instrumentation does not cover.

2. **Propagate trace context across all service boundaries using W3C Trace Context headers** so that distributed traces are complete end-to-end, and a single trace ID connects the user's request through every service, queue, and database call it touches.

3. **Design structured log schemas with mandatory fields (trace_id, span_id, service, level, timestamp)** because unstructured log messages cannot be correlated with traces or aggregated into metrics, and inconsistent schemas make cross-service log queries unreliable.

4. **Use semantic conventions from the OpenTelemetry specification for span and metric names** because ad-hoc naming creates fragmented dashboards that cannot be compared across services, while semantic conventions enable standard dashboards and cross-team interoperability.

5. **Define SLIs as ratios of good events to total events measured at the user-facing boundary** because internal metrics (CPU, memory) do not reflect user experience, and ratio-based SLIs produce meaningful error budgets that drive prioritization decisions.

6. **Set SLO targets based on business requirements and historical performance, not aspirational perfection** because a 99.99% SLO on a service that historically achieves 99.5% creates perpetual alert fatigue, while a realistic SLO with a meaningful error budget enables sustainable on-call practices.

7. **Configure multi-window, multi-burn-rate alerts on SLO error budget consumption** because static threshold alerts (e.g., "error rate > 1%") fire too early for slow burns and too late for fast burns, while burn-rate alerts adapt sensitivity to the speed of error budget depletion.

8. **Separate informational dashboards from on-call dashboards** so that the on-call dashboard shows only actionable signals (SLO burn, error spikes, latency degradation) without noise from capacity planning metrics or business analytics, enabling faster triage during incidents.

9. **Record custom metrics using histograms for latency and counters for throughput** because averages hide tail latency, gauges lose data between scrapes, and histograms with appropriate bucket boundaries enable accurate percentile calculations (p50, p95, p99) without client-side aggregation.

10. **Implement exemplars that link metric data points to specific trace IDs** so that when a latency spike appears on a dashboard, the engineer can click through to the exact slow trace without manually searching by time range, reducing investigation time from minutes to seconds.

11. **Export telemetry to a vendor-neutral collector (OpenTelemetry Collector) before backend ingestion** because coupling application code to a specific backend (Datadog, Grafana Cloud, New Relic) creates vendor lock-in, and a collector pipeline enables routing, sampling, and transformation without redeploying applications.

12. **Apply tail-based sampling in the collector to retain interesting traces and drop routine ones** because head-based sampling discards slow or errored traces by random chance, while tail-based sampling makes retention decisions after seeing the complete trace, preserving the traces that matter most for debugging.

13. **Add resource attributes (service.name, service.version, deployment.environment) to all telemetry** so that metrics, logs, and traces can be filtered by deployment version and environment, enabling precise comparison between canary and stable releases during rollouts.

14. **Create runbooks linked from every alert that describe symptoms, investigation steps, and remediation** because alert notifications without context require the on-call engineer to reverse-engineer the alert's meaning under time pressure, and runbooks encode institutional knowledge that survives team rotation.

15. **Implement log-based metrics for signals that are not worth full metric instrumentation** because extracting metrics from structured logs (e.g., counting specific error codes) avoids adding new metric instrumentation to the application code while still providing alertable signals.

16. **Test alerting rules with synthetic scenarios before relying on them for production coverage** because an untested alert that fails to fire during an incident is worse than no alert at all, and synthetic tests verify that the alert expression, routing, and notification channel all work end-to-end.

17. **Set cardinality budgets for labels on metrics** because unbounded label values (user IDs, request paths with parameters) cause metric storage explosion and query timeout, and cardinality budgets enforce discipline at instrumentation time rather than discovering the problem when the monitoring backend degrades.

18. **Correlate logs, metrics, and traces using shared identifiers (trace_id, span_id)** so that an engineer investigating a latency spike on a dashboard can pivot to the relevant traces and then to the specific log lines within those traces, creating a seamless investigation workflow across all three pillars.

## Output Format

Provide complete instrumentation code, configuration files, and alert rule definitions with inline comments explaining non-obvious decisions. Include the programming language and framework context. When showing OpenTelemetry configuration, include both the SDK setup and the collector pipeline configuration. For SLO definitions, include the SLI specification, target percentage, measurement window, and corresponding alert rules.

## References

| File                                     | Load when                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `references/opentelemetry.md`            | Instrumenting applications with OpenTelemetry SDK, configuring collectors, or setting up exporters.    |
| `references/structured-logging.md`       | Designing log schemas, configuring log pipelines, or correlating logs with traces.                      |
| `references/metrics-design.md`           | Choosing metric types, designing label schemas, managing cardinality, or configuring recording rules.   |
| `references/distributed-tracing.md`      | Implementing trace propagation, sampling strategies, or debugging trace gaps across services.            |
| `references/alerting.md`                 | Defining SLOs/SLIs, configuring burn-rate alerts, writing runbooks, or reducing alert fatigue.          |

## Codex Platform Notes

- Specialists are internal reasoning postures, not spawned subagent processes.
- Reference the repo-root AGENTS instructions for posture definitions and switching contracts.
- Codex operates under network restrictions — skills should not assume outbound HTTP access.
- Use `$ARGUMENTS` to access user-provided arguments when the skill is invoked.
- All skill guidance executes within the sandbox; file I/O is confined to the workspace.
