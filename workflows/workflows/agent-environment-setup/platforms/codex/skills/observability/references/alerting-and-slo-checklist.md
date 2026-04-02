# Alerting and SLO Checklist

## SLO definition template

```yaml
slo:
  name: "API request success rate"
  service: my-service
  sli:
    type: availability
    metric: "http_requests_total{status!~'5..'} / http_requests_total"
  target: 99.9%
  window: 30d
  error_budget: 0.1% # ~43 minutes of downtime per 30 days
  owner: platform-team
  review_cadence: quarterly
```

## SLI types

| Type         | Definition                              | Example metric                              |
| ------------ | --------------------------------------- | ------------------------------------------- |
| Availability | Proportion of successful requests       | `successful_requests / total_requests`      |
| Latency      | Proportion of requests within threshold | `requests_under_200ms / total_requests`     |
| Correctness  | Proportion of correct results           | `valid_responses / total_responses`         |
| Freshness    | Proportion of data within age threshold | `records_updated_within_1h / total_records` |

## Multi-window burn rate alerts

Use burn rate to detect SLO violations early without false positives.

| Alert severity             | Burn rate | Short window | Long window | Response              |
| -------------------------- | --------- | ------------ | ----------- | --------------------- |
| Page (immediate)           | 14.4x     | 5 min        | 1 hour      | Wake someone up       |
| Page (urgent)              | 6x        | 30 min       | 6 hours     | Respond within 30 min |
| Ticket (next business day) | 3x        | 2 hours      | 1 day       | Fix during work hours |
| Ticket (low priority)      | 1x        | 6 hours      | 3 days      | Schedule in sprint    |

Formula: `burn_rate = error_rate_in_window / (1 - slo_target)`

Both short and long windows must exceed the burn rate threshold to fire.

## Alert specification template

```yaml
alert:
  name: "High error rate - API"
  severity: page
  condition: "burn rate > 14.4x for 5m AND burn rate > 14.4x for 1h"
  impact: "Users experiencing API failures above SLO budget"
  runbook: "https://wiki.internal/runbooks/api-high-error-rate"
  escalation:
    - primary: on-call-engineer
    - secondary: team-lead (after 15 min)
    - tertiary: engineering-manager (after 30 min)
  silence_during:
    - maintenance windows
    - planned deployments
```

## Alert review process (monthly)

- [ ] List all alerts that fired in the past 30 days
- [ ] For each alert: was it actionable? Did someone respond?
- [ ] Identify noisy alerts (fired >5 times without requiring action) — fix or remove
- [ ] Identify missing alerts (incidents not caught by alerts) — add coverage
- [ ] Verify all alerts have current runbook links
- [ ] Verify escalation paths are up to date
- [ ] Check that alert thresholds still match current SLO targets

## Runbook structure

Every alert must link to a runbook with:

1. **What is this alert?** — one-sentence description
2. **Why does it matter?** — user impact
3. **First response** — immediate triage steps (check dashboards, recent deploys, dependencies)
4. **Common causes** — ranked by frequency with fix instructions
5. **Escalation** — when and who to escalate to
6. **Post-incident** — link to post-mortem template

## Error budget policy

- **Budget remaining > 50%**: normal feature velocity
- **Budget remaining 25-50%**: reduce risky changes, add reliability work to sprint
- **Budget remaining < 25%**: freeze non-critical deploys, prioritize reliability
- **Budget exhausted**: stop feature work, all hands on reliability until budget recovers
