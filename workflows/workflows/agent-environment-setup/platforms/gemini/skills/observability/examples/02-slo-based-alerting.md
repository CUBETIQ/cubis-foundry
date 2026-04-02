# Example: SLO-Based Alerting for E-Commerce Checkout

## Prompt

> Define SLOs for our checkout API: 99.9% availability and 99% latency under 500ms over 30 days. Write PromQL SLI queries, calculate error budgets, configure multi-window burn-rate alerts, and create a runbook template.

## Response

### SLO Definitions

#### SLO 1: Checkout Availability

| Field               | Value                                                                |
|---------------------|----------------------------------------------------------------------|
| **SLI**             | Ratio of non-5xx checkout responses to total checkout responses     |
| **SLO Target**      | 99.9% over a 30d rolling window                                    |
| **Error Budget**    | 0.1% = 43.2 minutes of downtime per 30 days                        |
| **Measurement**     | Server-side HTTP response codes at the load balancer                |

**SLI PromQL:**

```promql
# Availability SLI: ratio of good (non-5xx) requests to total requests
sum(rate(http_requests_total{service="checkout", code!~"5.."}[30d]))
/
sum(rate(http_requests_total{service="checkout"}[30d]))
```

#### SLO 2: Checkout Latency

| Field               | Value                                                                |
|---------------------|----------------------------------------------------------------------|
| **SLI**             | Fraction of checkout requests completing within 500ms               |
| **SLO Target**      | 99% over a 30d rolling window                                      |
| **Error Budget**    | 1% = 432 minutes (7.2 hours) of slow responses per 30 days         |
| **Measurement**     | Server-side request duration histogram at the application level     |

**SLI PromQL:**

```promql
# Latency SLI: fraction of requests under 500ms
# Uses the histogram bucket at the 500ms boundary
sum(rate(http_request_duration_seconds_bucket{service="checkout", le="0.5"}[30d]))
/
sum(rate(http_request_duration_seconds_count{service="checkout"}[30d]))

# For percentile reporting (p99 should be under 500ms):
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket{service="checkout"}[30d])) by (le)
)
```

### Error Budget Calculations

```
Availability error_budget:
  Budget = 1 - 0.999 = 0.001 (0.1%)
  30 days = 43,200 minutes
  Allowed downtime = 43,200 * 0.001 = 43.2 minutes/month
  Per day = 43.2 / 30 = 1.44 minutes/day

Latency error_budget:
  Budget = 1 - 0.99 = 0.01 (1%)
  At 10,000 requests/day: 100 slow requests allowed per day
  At 100,000 requests/day: 1,000 slow requests allowed per day
```

### Alerting Rules (`alerts/checkout-slo.yaml`)

```yaml
groups:
  - name: checkout-slo-availability
    rules:
      # ============================================
      # Fast burn: pages immediately
      # Consumes 2% of 30d budget in 1 hour
      # burn_rate = (1 - SLO) * budget_fraction / window
      # 14.4 = 0.001 * 30d / (1h * 0.001) ... simplified: 14.4x burn
      # ============================================
      - alert: CheckoutAvailabilityFastBurn
        expr: |
          (
            1 - (sum(rate(http_requests_total{service="checkout", code!~"5.."}[5m]))
                 / sum(rate(http_requests_total{service="checkout"}[5m])))
          ) > (14.4 * 0.001)
          and
          (
            1 - (sum(rate(http_requests_total{service="checkout", code!~"5.."}[1h]))
                 / sum(rate(http_requests_total{service="checkout"}[1h])))
          ) > (14.4 * 0.001)
        for: 2m
        labels:
          severity: critical
          slo: checkout-availability
          team: checkout
        annotations:
          summary: "Checkout availability SLO fast burn: error rate consuming budget at 14.4x"
          description: |
            The checkout API error rate is consuming the 30d error budget at 14.4x the
            sustainable rate. At this pace, the entire monthly budget will be exhausted
            in ~2 hours. Immediate investigation required.
          runbook: "https://runbooks.example.com/checkout/availability-fast-burn"
          dashboard: "https://grafana.example.com/d/checkout-slo"

      # ============================================
      # Slow burn: creates ticket
      # Consumes 5% of 30d budget in 6 hours
      # ============================================
      - alert: CheckoutAvailabilitySlowBurn
        expr: |
          (
            1 - (sum(rate(http_requests_total{service="checkout", code!~"5.."}[30m]))
                 / sum(rate(http_requests_total{service="checkout"}[30m])))
          ) > (6 * 0.001)
          and
          (
            1 - (sum(rate(http_requests_total{service="checkout", code!~"5.."}[6h]))
                 / sum(rate(http_requests_total{service="checkout"}[6h])))
          ) > (6 * 0.001)
        for: 5m
        labels:
          severity: warning
          slo: checkout-availability
          team: checkout
        annotations:
          summary: "Checkout availability SLO slow burn: sustained elevated error rate"
          description: |
            The checkout API has a sustained elevated error rate consuming the 30d budget
            at 6x the sustainable rate. This is not an immediate outage but will exhaust
            the budget within ~5 days if uncorrected.
          runbook: "https://runbooks.example.com/checkout/availability-slow-burn"

  - name: checkout-slo-latency
    rules:
      # ============================================
      # Fast burn: p99 latency spike
      # ============================================
      - alert: CheckoutLatencyFastBurn
        expr: |
          (
            1 - (sum(rate(http_request_duration_seconds_bucket{service="checkout", le="0.5"}[5m]))
                 / sum(rate(http_request_duration_seconds_count{service="checkout"}[5m])))
          ) > (14.4 * 0.01)
          and
          (
            1 - (sum(rate(http_request_duration_seconds_bucket{service="checkout", le="0.5"}[1h]))
                 / sum(rate(http_request_duration_seconds_count{service="checkout"}[1h])))
          ) > (14.4 * 0.01)
        for: 2m
        labels:
          severity: critical
          slo: checkout-latency
          team: checkout
        annotations:
          summary: "Checkout latency SLO fast burn: p99 latency exceeding 500ms"
          description: |
            More than 14.4% of checkout requests are exceeding the 500ms latency threshold.
            At this burn rate, the 30d latency error budget will be exhausted in ~2 hours.
          runbook: "https://runbooks.example.com/checkout/latency-fast-burn"

      # ============================================
      # Slow burn: gradual latency degradation
      # ============================================
      - alert: CheckoutLatencySlowBurn
        expr: |
          (
            1 - (sum(rate(http_request_duration_seconds_bucket{service="checkout", le="0.5"}[30m]))
                 / sum(rate(http_request_duration_seconds_count{service="checkout"}[30m])))
          ) > (6 * 0.01)
          and
          (
            1 - (sum(rate(http_request_duration_seconds_bucket{service="checkout", le="0.5"}[6h]))
                 / sum(rate(http_request_duration_seconds_count{service="checkout"}[6h])))
          ) > (6 * 0.01)
        for: 5m
        labels:
          severity: warning
          slo: checkout-latency
          team: checkout
        annotations:
          summary: "Checkout latency SLO slow burn: sustained elevated latency"
          runbook: "https://runbooks.example.com/checkout/latency-slow-burn"

  - name: checkout-error-budget
    rules:
      # ============================================
      # Error budget exhaustion tracking
      # ============================================
      - alert: CheckoutAvailabilityBudgetExhausted
        expr: |
          1 - (
            sum(rate(http_requests_total{service="checkout", code!~"5.."}[30d]))
            / sum(rate(http_requests_total{service="checkout"}[30d]))
          ) > 0.001
        for: 5m
        labels:
          severity: critical
          slo: checkout-availability
        annotations:
          summary: "Checkout availability error budget exhausted for the 30d window"
          runbook: "https://runbooks.example.com/checkout/budget-exhausted"
```

### Runbook Template (`runbooks/checkout-availability-fast-burn.md`)

```markdown
# Checkout Availability Fast Burn

## Alert
CheckoutAvailabilityFastBurn — critical severity

## Symptoms
- Checkout API returning 5xx errors at >14.4x the sustainable burn rate
- Customer-facing impact: checkout failures, abandoned carts

## Impact Assessment
1. Check current error rate: [Dashboard link]
2. Estimate affected users: error_rate * requests_per_minute
3. Check if payment provider is also affected (partial vs. total outage)

## Investigation Steps
1. Open the checkout SLO dashboard and identify when the error spike started
2. Correlate with recent deployments: did a release ship in the last 30 minutes?
3. Check downstream dependencies:
   - Payment gateway health: [Status page link]
   - Database connection pool: `checkout_db_pool_active / checkout_db_pool_max`
   - Redis cache hit rate: `checkout_cache_hit_rate`
4. Pull exemplar traces from the error spike to identify the failing code path
5. Check for resource exhaustion: CPU throttling, OOM kills, connection limits

## Remediation
- **Bad deploy**: Roll back to previous version via `kubectl rollout undo`
- **Downstream outage**: Enable circuit breaker fallback mode
- **Resource exhaustion**: Scale up replicas, increase connection pool, or add memory
- **Unknown**: Page the checkout team lead for escalation

## Escalation Path
1. On-call engineer (you) — investigate and mitigate within 15 minutes
2. Checkout team lead — if root cause is unclear after 15 minutes
3. VP Engineering — if customer impact exceeds 1,000 affected checkouts
```

### Key decisions

1. **`burn_rate` multipliers (14.4x, 6x)** are derived from Google's SRE workbook. 14.4x fast burn consumes 2% of budget in 1 hour; 6x slow burn consumes 5% in 6 hours.
2. **Multi-window AND clause** (5m AND 1h for fast burn) prevents alert flapping from momentary spikes while still catching sustained errors quickly.
3. **`histogram_quantile`** is used for latency SLI reporting, while bucket-ratio math is used for the actual SLO calculation, because the SLO is defined as "fraction under 500ms" not "p99 under 500ms."
4. **Separate `error_budget` exhaustion alert** fires when the entire 30d budget is consumed, signaling that feature work should stop in favor of reliability.
5. **Runbook template** follows the symptoms-investigation-remediation pattern so on-call engineers do not waste incident time figuring out what to check first.
