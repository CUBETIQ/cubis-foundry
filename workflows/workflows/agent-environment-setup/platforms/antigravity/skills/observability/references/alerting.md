# Alerting Reference

## SLO Fundamentals

### Definitions

| Term | Definition | Example |
|------|-----------|---------|
| **SLI** | Service Level Indicator: a quantitative measure of service behavior | "99.2% of requests return non-5xx in the last 30 days" |
| **SLO** | Service Level Objective: a target value for an SLI | "99.9% availability over a 30-day rolling window" |
| **SLA** | Service Level Agreement: an SLO with business consequences | "If availability drops below 99.9%, credits are issued" |
| **Error Budget** | Allowable failure: `1 - SLO target` | 0.1% = 43.2 minutes/month |

### Choosing SLO Targets

| Availability | Downtime/Month | Downtime/Year | Typical Use |
|-------------|----------------|---------------|-------------|
| 99% | 7.2 hours | 3.65 days | Internal tools |
| 99.5% | 3.6 hours | 1.83 days | Business apps |
| 99.9% | 43.2 minutes | 8.77 hours | Customer-facing |
| 99.95% | 21.6 minutes | 4.38 hours | E-commerce |
| 99.99% | 4.32 minutes | 52.6 minutes | Payment systems |

### SLI Types

| SLI Type | Measurement | Example PromQL |
|----------|-------------|----------------|
| Availability | Good requests / Total requests | `sum(rate(http_requests_total{code!~"5.."}[30d])) / sum(rate(http_requests_total[30d]))` |
| Latency | Requests under threshold / Total | `sum(rate(http_duration_bucket{le="0.5"}[30d])) / sum(rate(http_duration_count[30d]))` |
| Throughput | Events processed / Events received | `sum(rate(events_processed_total[30d])) / sum(rate(events_received_total[30d]))` |
| Freshness | Data updated within threshold | `time() - data_last_updated_timestamp < 300` |
| Correctness | Correct responses / Total responses | Manual or synthetic validation |

## Burn-Rate Alerting

### Why Burn Rate

Static threshold alerts have a fundamental problem:

| Alert Type | Problem |
|-----------|---------|
| `error_rate > 1%` | Fires on transient spikes that do not impact the monthly budget |
| `error_rate > 0.1%` | Fires too late for fast outages; too early for minor blips |

Burn-rate alerts solve this by measuring how fast the error budget is being consumed.

### Burn Rate Formula

```
burn_rate = (observed error rate) / (SLO error rate)

Example: SLO = 99.9%, error rate = 0.1%
  If current error rate = 1.44%:
  burn_rate = 1.44% / 0.1% = 14.4x

  At 14.4x, the 30-day budget is consumed in ~2 hours.
```

### Multi-Window Alert Design

Use two windows to balance speed and noise:

| Alert | Short Window | Long Window | Burn Rate | Budget Consumed | Action |
|-------|-------------|-------------|-----------|-----------------|--------|
| Fast burn | 5 min | 1 hour | 14.4x | 2% in 1h | Page immediately |
| Medium burn | 30 min | 6 hours | 6x | 5% in 6h | Page |
| Slow burn | 6 hours | 3 days | 1x | 10% in 3d | Ticket |

### PromQL Alert Rules

```yaml
# For a 99.9% availability SLO (error budget = 0.001)

# Fast burn: 14.4x over 5m AND 1h
- alert: HighErrorBudgetBurnFast
  expr: |
    (
      1 - sum(rate(http_requests_total{code!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
    ) > (14.4 * 0.001)
    and
    (
      1 - sum(rate(http_requests_total{code!~"5.."}[1h])) / sum(rate(http_requests_total[1h]))
    ) > (14.4 * 0.001)
  for: 2m
  labels:
    severity: critical

# Slow burn: 6x over 30m AND 6h
- alert: HighErrorBudgetBurnSlow
  expr: |
    (
      1 - sum(rate(http_requests_total{code!~"5.."}[30m])) / sum(rate(http_requests_total[30m]))
    ) > (6 * 0.001)
    and
    (
      1 - sum(rate(http_requests_total{code!~"5.."}[6h])) / sum(rate(http_requests_total[6h]))
    ) > (6 * 0.001)
  for: 5m
  labels:
    severity: warning
```

## Alert Quality

### Alert Attributes

Every alert must include:

```yaml
labels:
  severity: critical|warning|info
  team: checkout                     # Owning team
  slo: checkout-availability         # Associated SLO

annotations:
  summary: "One-line description of what is happening"
  description: |
    Multi-line description including:
    - Current value of the metric
    - Expected normal range
    - Potential user impact
  runbook: "https://runbooks.example.com/checkout/availability"
  dashboard: "https://grafana.example.com/d/checkout-slo"
```

### Severity Levels

| Severity | Response | Notification | Example |
|----------|----------|-------------|---------|
| `critical` | Immediate page | PagerDuty/phone | Production outage |
| `warning` | Within 1 hour | Slack channel | Elevated error rate |
| `info` | Next business day | Ticket system | Approaching budget |

### Alert Hygiene Practices

| Practice | Implementation |
|----------|---------------|
| Review alert fatigue monthly | Track alerts/week that resulted in no action |
| Every alert has a runbook | No alert without `runbook` annotation |
| Suppress during maintenance | Alertmanager maintenance windows |
| Deduplicate | Group related alerts in Alertmanager |
| Escalation timeout | Auto-escalate if not acknowledged in 15 min |

## Runbook Template

```markdown
# [Alert Name]

## Alert Description
What this alert measures and why it matters.

## Severity
Critical / Warning / Info

## Impact
Who is affected and how badly.

## Symptoms
What the on-call engineer will observe:
- Dashboard: [link]
- Error in logs: [example]
- User reports: [example]

## Investigation Steps
1. Check the SLO dashboard: [link]
2. Identify when the issue started (correlate with deployments)
3. Check downstream dependency health:
   - Database: `kubectl top pods -l app=postgres`
   - Cache: `redis-cli ping`
4. Pull exemplar traces for failing requests
5. Check application logs: `{service="checkout"} |= "error"`

## Remediation
### If caused by a bad deployment:
```bash
kubectl rollout undo deployment/checkout -n production
```

### If caused by a dependency failure:
1. Enable circuit breaker: set `FEATURE_CIRCUIT_BREAKER=true`
2. Scale up replicas: `kubectl scale deployment/checkout --replicas=10`

### If cause is unknown:
1. Page the team lead
2. Start an incident channel
3. Begin timeline documentation

## Escalation
| Time | Action |
|------|--------|
| 0-15 min | On-call investigates |
| 15-30 min | Page team lead |
| 30-60 min | Start incident process |
| 60+ min | Page VP Engineering |
```

## Alertmanager Configuration

```yaml
route:
  receiver: default-slack
  group_by: [alertname, service]
  group_wait: 30s             # Wait for related alerts to group
  group_interval: 5m          # Wait between batches
  repeat_interval: 4h         # Re-notify after 4 hours

  routes:
    - matchers:
        - severity = critical
      receiver: pagerduty
      continue: true           # Also send to Slack

    - matchers:
        - severity = warning
      receiver: team-slack

    - matchers:
        - severity = info
      receiver: ticket-system

receivers:
  - name: pagerduty
    pagerduty_configs:
      - routing_key: <key>
        severity: '{{ .CommonLabels.severity }}'

  - name: team-slack
    slack_configs:
      - channel: '#{{ .CommonLabels.team }}-alerts'
        title: '{{ .CommonAnnotations.summary }}'
        text: '{{ .CommonAnnotations.description }}'

  - name: ticket-system
    webhook_configs:
      - url: https://jira.example.com/webhook/alerts

inhibit_rules:
  # Critical alert suppresses warning for the same service
  - source_matchers: [severity = critical]
    target_matchers: [severity = warning]
    equal: [service]
```

## Testing Alerts

### Synthetic Alert Testing

```bash
# Prometheus: evaluate alert rule against current data
promtool check rules alert-rules.yaml

# Promtool unit tests
promtool test rules alert-tests.yaml
```

```yaml
# alert-tests.yaml
rule_files:
  - alert-rules.yaml
tests:
  - interval: 1m
    input_series:
      - series: 'http_requests_total{code="500"}'
        values: '0+10x60'    # 10 errors per minute for 60 minutes
      - series: 'http_requests_total{code="200"}'
        values: '0+990x60'   # 990 successes per minute
    alert_rule_test:
      - eval_time: 10m
        alertname: HighErrorBudgetBurnFast
        exp_alerts:
          - exp_labels:
              severity: critical
```

### Chaos Engineering for Alerts

1. Inject a known failure (kill a pod, add latency).
2. Verify the alert fires within the expected timeframe.
3. Verify the runbook link works and steps are accurate.
4. Verify the notification reaches the correct channel.
5. Document the result and fix any gaps.
