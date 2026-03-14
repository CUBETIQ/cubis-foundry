# Example: Regression Detection for Summarization Prompt Upgrade

## Context

A content platform uses an LLM to summarize news articles into 2-3 sentence briefs. The summarization prompt is being upgraded from v2 (in production 4 months) to v3 (adds instruction to include the article's publication date and source). The team needs to ensure v3 does not regress on quality, latency, or cost.

## Baseline Snapshot (v2)

```json
{
  "version": "v2",
  "model": "claude-sonnet-4-20250514",
  "temperature": 0.3,
  "run_date": "2025-11-15T10:00:00Z",
  "sample_size": 200,
  "metrics": {
    "deterministic_pass_rate": 0.97,
    "mean_judge_score": 4.3,
    "judge_score_std": 0.6,
    "latency_p50_ms": 820,
    "latency_p95_ms": 1450,
    "latency_p99_ms": 2100,
    "mean_output_tokens": 85,
    "estimated_cost_per_run_usd": 0.38
  },
  "per_case_scores": "baseline-v2-details.json"
}
```

## Regression Detection Configuration

### Thresholds

| Metric | Threshold | Severity | Rationale |
|--------|-----------|----------|-----------|
| Deterministic pass rate drop | > 1% | Blocker | Format violations (missing date, wrong length) are hard failures. |
| Mean judge score drop | > 0.3 | Blocker | A 0.3 drop on a 1-5 scale is perceptible to users and indicates content quality regression. |
| Latency p95 increase | > 25% | Warning | v3 adds instructions which may increase token count. A 25% increase is the tolerance budget. |
| Cost increase | > 30% | Warning | More tokens cost more, but quality justifies moderate cost increases. |
| Any individual case score drop > 1.5 | Per-case | Blocker | A single case collapsing from 4.5 to 3.0 indicates a targeted regression even if the mean holds. |

### Comparison Logic

```python
import json
import statistics
from scipy import stats

def compare_runs(baseline_path: str, current_path: str, config: dict) -> dict:
    baseline = json.load(open(baseline_path))
    current = json.load(open(current_path))

    report = {"verdict": "PASS", "flags": []}

    # Deterministic pass rate
    delta_pass = current["metrics"]["deterministic_pass_rate"] - baseline["metrics"]["deterministic_pass_rate"]
    if delta_pass < -config["thresholds"]["pass_rate_drop"]:
        report["verdict"] = "REGRESS"
        report["flags"].append({
            "metric": "deterministic_pass_rate",
            "baseline": baseline["metrics"]["deterministic_pass_rate"],
            "current": current["metrics"]["deterministic_pass_rate"],
            "delta": delta_pass,
            "severity": "blocker"
        })

    # Mean judge score with confidence interval
    baseline_scores = baseline["per_case_judge_scores"]
    current_scores = current["per_case_judge_scores"]

    t_stat, p_value = stats.ttest_ind(baseline_scores, current_scores)
    mean_delta = statistics.mean(current_scores) - statistics.mean(baseline_scores)

    if mean_delta < -config["thresholds"]["judge_score_drop"] and p_value < 0.05:
        report["verdict"] = "REGRESS"
        report["flags"].append({
            "metric": "mean_judge_score",
            "baseline": statistics.mean(baseline_scores),
            "current": statistics.mean(current_scores),
            "delta": mean_delta,
            "p_value": p_value,
            "severity": "blocker"
        })

    # Latency p95
    latency_delta_pct = (
        (current["metrics"]["latency_p95_ms"] - baseline["metrics"]["latency_p95_ms"])
        / baseline["metrics"]["latency_p95_ms"]
    )
    if latency_delta_pct > config["thresholds"]["latency_p95_increase_pct"]:
        report["flags"].append({
            "metric": "latency_p95",
            "baseline": baseline["metrics"]["latency_p95_ms"],
            "current": current["metrics"]["latency_p95_ms"],
            "delta_pct": latency_delta_pct,
            "severity": "warning"
        })

    return report
```

### Alerting Rules

| Condition | Action |
|-----------|--------|
| Any blocker flag | Fail the CI pipeline. Block merge. Post summary to PR comment. |
| Warning flags only | Pass CI but post a warning comment on the PR with the delta table. |
| No flags | Pass CI silently. Archive the run as the new candidate baseline. |
| 3 consecutive runs with warnings | Escalate to blocker. Cumulative warnings indicate drift. |

## Sample Regression Report

```
## Regression Report: Summarization v2 -> v3

**Run ID:** run-20251201-v3-candidate
**Model:** claude-sonnet-4-20250514 | Temperature: 0.3 | Date: 2025-12-01
**Verdict:** PASS (with warnings)

### Summary
| Metric                 | v2 Baseline | v3 Current | Delta     | Status  |
|------------------------|-------------|------------|-----------|---------|
| Deterministic pass rate| 97.0%       | 98.5%      | +1.5%     | PASS    |
| Mean judge score       | 4.3         | 4.4        | +0.1      | PASS    |
| Latency p95            | 1450ms      | 1680ms     | +15.9%    | WARNING |
| Est. cost/run          | $0.38       | $0.44      | +15.8%    | PASS    |

### Warnings
- Latency p95 increased by 15.9% (within 25% threshold but trending upward).
  Likely cause: v3 adds date/source extraction instructions, increasing output tokens.
  Recommendation: Monitor next 3 runs. If trend continues, optimize prompt token count.

### Improvements
- Deterministic pass rate improved by 1.5% -- v3's explicit date instruction reduced
  format violations where v2 sometimes omitted the publication context.
- Mean judge score improved by 0.1 -- summaries now include source attribution,
  which the rubric rewards under the "completeness" dimension.
```

## Key Takeaways

1. **Baseline snapshots are mandatory.** Without the v2 snapshot, the v3 results are just numbers with no context.
2. **Statistical significance matters.** The 0.1 mean score improvement is not statistically significant at p < 0.05 with 200 samples, so it should be reported as "within noise" rather than celebrated as an improvement.
3. **Latency warnings prevent future blockers.** The 15.9% latency increase is below threshold today but indicates a trend that could cross the 25% line with further prompt additions.
4. **Per-case analysis catches hidden regressions.** The aggregate looks clean, but individual case review might reveal that v3 regresses on short-article summaries while improving on long articles.
