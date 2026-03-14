# Regression Detection

## Overview

Regression detection answers one question: did the latest change make things worse? This reference covers baseline management, comparison algorithms, threshold configuration, drift detection, and alerting integration.

## Baseline Management

### What to Capture

A baseline snapshot must contain everything needed to reproduce the run and compare future runs against it.

```json
{
  "baseline_id": "baseline-2025-11-15-v2",
  "created_at": "2025-11-15T10:00:00Z",
  "prompt_version": "v2",
  "model": "claude-sonnet-4-20250514",
  "model_version": "20250514",
  "temperature": 0.3,
  "system_prompt_hash": "sha256:a1b2c3d4...",
  "eval_suite_hash": "sha256:e5f6g7h8...",
  "sample_size": 200,
  "aggregate_metrics": {
    "deterministic_pass_rate": 0.97,
    "mean_judge_score": 4.3,
    "judge_score_std": 0.6,
    "latency_p50_ms": 820,
    "latency_p95_ms": 1450,
    "mean_output_tokens": 85,
    "estimated_cost_usd": 0.38
  },
  "per_case_results": [
    {
      "case_name": "order-status-happy",
      "deterministic_pass": true,
      "judge_score": 4.5,
      "latency_ms": 780
    }
  ]
}
```

### Baseline Lifecycle

1. **Candidate baseline:** Created after every eval run. Not yet promoted.
2. **Active baseline:** The reference point for regression checks. Promoted manually or after N consecutive clean runs.
3. **Archived baseline:** Previous active baselines, kept for historical trend analysis.

### Storage

Store baselines as versioned JSON files alongside the eval suite:

```
evals/
  baselines/
    baseline-2025-09-01-v1.json
    baseline-2025-11-15-v2.json  <-- active
  test-cases.yaml
  evals.json
```

## Comparison Algorithms

### Point Estimate Comparison

The simplest approach: compute the delta between current and baseline metrics.

```python
def compare_metric(current: float, baseline: float) -> dict:
    delta = current - baseline
    delta_pct = (delta / baseline) * 100 if baseline != 0 else float('inf')
    return {"delta": delta, "delta_pct": delta_pct}
```

**Limitation:** Point estimates ignore variance. A 2% drop might be noise on small samples.

### Statistical Significance Testing

For judge scores and other continuous metrics, use a t-test or Mann-Whitney U test to determine if the difference is statistically significant.

```python
from scipy import stats

def compare_with_significance(
    current_scores: list[float],
    baseline_scores: list[float],
    alpha: float = 0.05
) -> dict:
    t_stat, p_value = stats.ttest_ind(current_scores, baseline_scores)
    mean_delta = statistics.mean(current_scores) - statistics.mean(baseline_scores)

    return {
        "mean_delta": mean_delta,
        "p_value": p_value,
        "significant": p_value < alpha,
        "direction": "regression" if mean_delta < 0 else "improvement"
    }
```

### Confidence Intervals

Report the confidence interval of the delta, not just the point estimate.

```python
def confidence_interval(scores: list[float], confidence: float = 0.95) -> tuple:
    n = len(scores)
    mean = statistics.mean(scores)
    se = statistics.stdev(scores) / (n ** 0.5)
    t_crit = stats.t.ppf((1 + confidence) / 2, n - 1)
    return (mean - t_crit * se, mean + t_crit * se)
```

A 95% CI of [4.1, 4.5] with a baseline of 4.3 means the current run is consistent with the baseline. A CI of [3.8, 4.1] with a baseline of 4.3 signals a likely regression.

## Threshold Configuration

### Per-Metric Thresholds

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| Deterministic pass rate | > 1% drop | Format violations are hard failures. Even 1% is notable. |
| Mean judge score | > 0.3 drop | On a 1-5 scale, 0.3 is the smallest perceptible quality difference. |
| Latency p95 | > 25% increase | User experience degrades noticeably above this. |
| Cost per run | > 50% increase | Cost is elastic but needs a cap. |
| Any single case score | > 1.5 drop | Catches targeted regressions hidden by aggregate means. |

### Severity Levels

- **Blocker:** Fails the CI pipeline. Must be resolved before merge.
- **Warning:** Passes CI but posts a visible alert. Must be reviewed.
- **Info:** Logged for trend analysis. No immediate action required.

### Dynamic Thresholds

For long-running projects, compute thresholds from historical variance rather than static values:

```python
def dynamic_threshold(historical_scores: list[float], sigma_multiplier: float = 2.0) -> float:
    mean = statistics.mean(historical_scores)
    std = statistics.stdev(historical_scores)
    return mean - sigma_multiplier * std
```

A score below `mean - 2*std` is an outlier with 95% confidence, indicating a real regression rather than normal variance.

## Drift Detection

Drift is gradual degradation that stays within per-run thresholds but accumulates over time.

### Moving Average

Track a rolling average of scores over the last N runs. A downward trend that persists for 5+ runs signals drift even if no single run breaches the threshold.

```python
def detect_drift(run_history: list[dict], window: int = 5) -> dict:
    if len(run_history) < window:
        return {"drift_detected": False, "reason": "insufficient history"}

    recent = [r["mean_judge_score"] for r in run_history[-window:]]
    older = [r["mean_judge_score"] for r in run_history[-2*window:-window]]

    recent_mean = statistics.mean(recent)
    older_mean = statistics.mean(older)

    drift = older_mean - recent_mean
    return {
        "drift_detected": drift > 0.15,
        "drift_magnitude": drift,
        "window": window,
        "recommendation": "Investigate prompt or data changes in last 5 runs" if drift > 0.15 else "No action"
    }
```

### CUSUM (Cumulative Sum)

A more sensitive drift detection algorithm that accumulates small deviations:

```python
def cusum(scores: list[float], target: float, threshold: float = 3.0, slack: float = 0.5) -> int:
    """Returns the index where drift is detected, or -1 if no drift."""
    cumsum_pos = 0
    cumsum_neg = 0
    for i, score in enumerate(scores):
        cumsum_pos = max(0, cumsum_pos + (target - score) - slack)
        cumsum_neg = max(0, cumsum_neg + (score - target) - slack)
        if cumsum_pos > threshold or cumsum_neg > threshold:
            return i
    return -1
```

## Alerting Integration

### CI Pipeline Gate

```yaml
# GitHub Actions example
- name: Run regression check
  run: |
    python eval/regression.py \
      --current results/current.json \
      --baseline evals/baselines/active.json \
      --thresholds evals/thresholds.yaml
  continue-on-error: false  # Blockers fail the job

- name: Post PR comment
  if: always()
  run: |
    python eval/post_comment.py \
      --report results/regression-report.md \
      --pr ${{ github.event.pull_request.number }}
```

### Slack Notification

```python
def send_slack_alert(report: dict, webhook_url: str):
    severity = "blocker" if report["verdict"] == "REGRESS" else "warning"
    color = "#FF0000" if severity == "blocker" else "#FFA500"

    payload = {
        "attachments": [{
            "color": color,
            "title": f"Eval Regression: {report['verdict']}",
            "text": format_report_summary(report),
            "fields": [
                {"title": "Run ID", "value": report["run_id"], "short": True},
                {"title": "Flags", "value": str(len(report["flags"])), "short": True}
            ]
        }]
    }
    requests.post(webhook_url, json=payload)
```

## Sample Workflow

1. Developer changes a prompt and opens a PR.
2. CI runs the eval suite against the changed prompt.
3. Regression checker loads the active baseline and compares.
4. If blocker: CI fails, PR comment explains the regression.
5. If warning: CI passes, PR comment flags the metric.
6. If clean: CI passes, candidate baseline is archived for potential promotion.
7. After merge, the next 3 clean production runs promote the candidate to active baseline.
