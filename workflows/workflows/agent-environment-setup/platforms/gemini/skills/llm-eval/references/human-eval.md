# Human Evaluation

## Overview

Human evaluation remains the gold standard for subjective quality dimensions that LLM judges cannot reliably assess: nuance, cultural appropriateness, domain expertise, and user satisfaction. This reference covers campaign design, annotator calibration, agreement metrics, and integration with automated pipelines.

## When Human Eval is Necessary

| Scenario | Why automated eval falls short |
|----------|-------------------------------|
| Launching a new product vertical | No existing rubric or baseline to calibrate a judge model against. |
| Assessing cultural sensitivity | LLM judges lack the cultural context to detect subtle inappropriateness. |
| Domain-expert validation | Medical, legal, or financial accuracy requires credentialed reviewers. |
| Calibrating LLM-as-judge | Human scores provide the ground truth needed to validate and tune judge prompts. |
| High-stakes decisions | Automated pass rates should not be the sole evidence for decisions affecting user safety. |

## Campaign Design

### Task Definition

Write the task description as if explaining to a new annotator who has never seen the product. Include:

1. **Context:** What the LLM is doing and who uses it.
2. **Input format:** What the annotator will see (user query + LLM response).
3. **Scoring dimensions:** Exactly what to evaluate and what each score means.
4. **Examples:** At least 2 scored examples per dimension with explanations.

```markdown
## Task: Rate Customer Support Responses

You will review responses from an AI customer support assistant. For each
response, you will see the customer's message and the AI's reply.

Rate each response on two dimensions:

### Accuracy (1-5)
- 1: Response contains factual errors or contradicts the query.
- 2: Response is partially accurate but missing key information.
- 3: Response is accurate but generic, not tailored to the query.
- 4: Response is accurate and specifically addresses the query.
- 5: Response is accurate, specific, and provides additional helpful context.

### Tone (1-5)
- 1: Response is rude, dismissive, or robotic.
- 2: Response is neutral but impersonal.
- 3: Response is polite but formulaic.
- 4: Response is warm, professional, and empathetic.
- 5: Response demonstrates genuine understanding and proactive care.
```

### Sample Size

Calculate the required sample size based on desired confidence and expected variance:

```python
import math

def required_sample_size(
    confidence: float = 0.95,
    margin_of_error: float = 0.3,
    estimated_std: float = 1.0
) -> int:
    """For a 1-5 scale with std ~1.0, margin of error 0.3, need ~43 samples."""
    z = 1.96 if confidence == 0.95 else 2.576  # 95% or 99%
    n = (z * estimated_std / margin_of_error) ** 2
    return math.ceil(n)
```

**Rules of thumb:**
- 50 samples: Sufficient for directional signal (is v3 better than v2?).
- 200 samples: Sufficient for confident per-dimension scoring.
- 500+ samples: Required for sub-group analysis (performance by input type).

### Annotator Selection

| Type | Use for | Cost | Quality |
|------|---------|------|---------|
| Internal team | Rapid iteration, domain knowledge | Low (staff time) | High but potential bias |
| Contracted annotators | Scale, objectivity | Medium ($15-40/hr) | Medium (requires training) |
| Crowdsource (MTurk, Prolific) | Large-scale, diverse perspectives | Low ($0.10-1.00/task) | Variable (requires QC) |
| Domain experts | Medical, legal, financial accuracy | High ($50-200/hr) | Highest for domain tasks |

## Annotator Calibration

### Golden Set

Create 10-20 pre-scored examples (the "golden set") that annotators must score before starting the real task. Compare their scores against the gold scores.

```python
def calibration_score(annotator_scores: list[int], gold_scores: list[int]) -> float:
    """Returns the mean absolute deviation from gold scores."""
    deviations = [abs(a - g) for a, g in zip(annotator_scores, gold_scores)]
    return statistics.mean(deviations)

# Acceptable: MAD < 0.5 on a 1-5 scale
# Marginal: MAD 0.5-1.0, requires discussion
# Fail: MAD > 1.0, annotator needs retraining or removal
```

### Calibration Session

Before large campaigns, hold a 30-minute calibration session:

1. Present 5 examples from the golden set.
2. Have annotators score independently.
3. Reveal gold scores and discuss disagreements.
4. Re-score 3 additional examples to verify alignment.
5. Document any rubric clarifications that emerged.

### Ongoing Quality Control

Embed golden-set items (10-15% of the total) throughout the real task. Monitor annotator scores on these items to detect drift.

```python
def monitor_quality(annotator_id: str, golden_results: list[dict]) -> dict:
    recent_mad = calibration_score(
        [r["annotator_score"] for r in golden_results[-10:]],
        [r["gold_score"] for r in golden_results[-10:]]
    )
    return {
        "annotator_id": annotator_id,
        "recent_mad": recent_mad,
        "status": "ok" if recent_mad < 0.5 else "flagged"
    }
```

## Inter-Annotator Agreement

### Cohen's Kappa (2 Annotators)

Measures agreement between two annotators, adjusted for chance agreement.

```python
from sklearn.metrics import cohen_kappa_score

def compute_kappa(scores_a: list[int], scores_b: list[int]) -> float:
    return cohen_kappa_score(scores_a, scores_b, weights="linear")

# Interpretation:
# < 0.20: Poor agreement - rubric is ambiguous
# 0.21-0.40: Fair - rubric needs refinement
# 0.41-0.60: Moderate - acceptable for subjective tasks
# 0.61-0.80: Substantial - good rubric clarity
# > 0.80: Almost perfect - typical for objective tasks only
```

### Krippendorff's Alpha (3+ Annotators)

Generalizes to any number of annotators and handles missing data.

```python
import krippendorff

def compute_alpha(reliability_data: list[list]) -> float:
    """
    reliability_data: matrix where rows are annotators, columns are items.
    Use None for missing annotations.
    """
    return krippendorff.alpha(
        reliability_data=reliability_data,
        level_of_measurement="ordinal"
    )
```

### What to Do When Agreement is Low

1. **Review the rubric.** Low agreement usually means the rubric is ambiguous, not that annotators are bad. Identify the specific score boundaries that cause disagreement.

2. **Add examples to the rubric.** For every boundary that causes disagreement (is this a 3 or a 4?), add a concrete example that anchors the distinction.

3. **Split the dimension.** If "quality" has low agreement, try splitting into "accuracy" and "helpfulness." Narrower dimensions produce higher agreement.

4. **Accept the variance.** Some dimensions (e.g., "creativity") have inherently low agreement. In those cases, use more annotators and report the distribution rather than the mean.

## Integrating Human Eval with Automated Pipelines

### Hybrid Workflow

1. **Automated eval runs on every PR** with deterministic assertions and LLM-as-judge.
2. **Human eval runs weekly** on a stratified sample of production outputs.
3. **Human scores calibrate the judge.** Compare human and judge scores on the same items. If they diverge, update the judge rubric.
4. **Quarterly rubric review.** Revise the rubric, golden set, and judge prompts based on accumulated human eval data.

### Judge Calibration from Human Data

```python
def calibrate_judge(human_scores: list[float], judge_scores: list[float]) -> dict:
    correlation = statistics.correlation(human_scores, judge_scores)
    bias = statistics.mean(judge_scores) - statistics.mean(human_scores)

    return {
        "correlation": correlation,
        "bias": bias,
        "recommendation": (
            "Judge is well-calibrated" if correlation > 0.7 and abs(bias) < 0.3
            else "Judge needs rubric adjustment"
        )
    }
```

**Target:** Pearson correlation > 0.7 and absolute bias < 0.3 between human and judge scores. Below these thresholds, the judge is not a reliable proxy for human evaluation on this dimension.

## Cost Estimation

| Scale | Annotators | Items | Dimensions | Est. Hours | Est. Cost |
|-------|------------|-------|------------|------------|-----------|
| Pilot | 3 | 50 | 2 | 5 | $200 |
| Standard | 3 | 200 | 3 | 30 | $1,200 |
| Large | 5 | 500 | 3 | 100 | $4,000 |
| Enterprise | 5 | 1000 | 5 | 300 | $12,000 |

These estimates assume contracted annotators at $40/hr, including calibration time. Crowdsource costs are 5-10x lower but require more QC overhead.
