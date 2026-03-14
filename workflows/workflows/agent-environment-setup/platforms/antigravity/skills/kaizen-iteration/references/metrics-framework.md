# Metrics Framework Reference

Load this when establishing baselines, selecting metrics, or interpreting improvement data.

---

## The DORA Metrics

The four key metrics from the DevOps Research and Assessment (DORA) framework:

| Metric | Measures | Good | Elite |
|--------|---------|------|-------|
| **Deployment Frequency** | How often code ships to production | 1/week - 1/month | On demand (multiple/day) |
| **Lead Time for Changes** | Time from commit to production | 1 week - 1 month | Less than 1 day |
| **Change Failure Rate** | % of deployments causing failures | 0-15% | 0-5% |
| **Mean Time to Recovery** | Time from failure to recovery | Less than 1 day | Less than 1 hour |

### Why These Four?

- **Deployment Frequency** and **Lead Time** measure throughput (speed of delivery).
- **Change Failure Rate** and **MTTR** measure stability (quality of delivery).
- High-performing teams optimize BOTH throughput and stability simultaneously. Sacrificing one for the other is a false trade-off.

---

## Selecting Improvement Metrics

### The GQM Method (Goal-Question-Metric)

1. **Goal:** What do you want to improve?
2. **Question:** How do you know if it improved?
3. **Metric:** What number answers that question?

**Example:**
- Goal: Reduce time customers wait for bug fixes.
- Question: How long does it take from bug report to fix in production?
- Metric: Bug fix lead time (median, P95).

### Leading vs. Lagging Metrics

| Type | Definition | Example |
|------|-----------|---------|
| **Leading** | Predicts future performance | PR review time, test coverage on new code |
| **Lagging** | Confirms past performance | Change failure rate, customer-reported bugs |

**Key insight:** Improve leading metrics to move lagging metrics. If you only track lagging metrics, you see problems after they happen.

---

## Establishing Baselines

### Step 1: Collect at Least 4 Weeks of Data

One week is noise. Four weeks reveals patterns. Metrics with less than 4 data points are unreliable baselines.

### Step 2: Use Medians, Not Averages

A single outlier (e.g., a 48-hour deployment) can distort an average. Medians are robust to outliers.

### Step 3: Record Variance

A team with a median lead time of 5 days but a P95 of 25 days has a consistency problem, not a speed problem.

| Metric | Median | P75 | P95 | Interpretation |
|--------|--------|-----|-----|----------------|
| Lead time | 5 days | 8 days | 25 days | High variance. Investigate the P95 outliers. |
| MTTR | 2 hours | 4 hours | 3 hours | Low variance. Consistent recovery process. |

---

## Interpreting Metric Changes

### Signal vs. Noise

A metric change is meaningful when:

1. It persists for at least 2 measurement periods.
2. The magnitude exceeds normal variance.
3. It correlates with a known intervention (experiment).

A one-week dip in lead time during a holiday week is noise. A 4-week sustained reduction after CI optimization is signal.

### Correlation vs. Causation

If you run two experiments simultaneously and both metrics improve, you cannot attribute the improvement to either experiment. This is why kaizen limits WIP to 1-2 experiments per cycle.

---

## Metric Dashboards

### Minimal Dashboard

Track these 6 metrics to cover throughput, stability, and team health:

```
Throughput:     Deployment frequency  |  Lead time for changes
Stability:      Change failure rate   |  MTTR
Team Health:    PR review time        |  Planned vs. delivered work
```

### Visualization Rules

1. **Show trends, not snapshots.** A single number is meaningless without context. Show the last 8-12 data points.
2. **Include baselines and targets.** A horizontal line showing the baseline and another showing the target gives instant visual feedback.
3. **Flag experiment periods.** Mark when experiments start and end so the team can see cause and effect.

---

## Common Metric Pitfalls

### Goodhart's Law

"When a measure becomes a target, it ceases to be a good measure."

If you reward teams for deployment frequency, they will deploy smaller changes more often -- which may or may not improve delivery. Always pair throughput metrics with stability metrics.

### Vanity Metrics

Metrics that look good but don't drive decisions:

| Vanity Metric | Why It Fails | Better Alternative |
|--------------|-------------|-------------------|
| Lines of code written | More code is not better | Features delivered per sprint |
| Test count | More tests without coverage is waste | Spec coverage percentage |
| Story points completed | Points are relative and inflation-prone | Cycle time per work item |

### Metric Fatigue

Tracking too many metrics overwhelms the team. Rule of thumb: track 4-6 metrics. If you cannot explain why a metric matters in one sentence, drop it.
