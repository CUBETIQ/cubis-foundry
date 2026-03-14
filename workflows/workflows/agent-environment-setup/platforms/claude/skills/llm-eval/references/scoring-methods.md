# Scoring Methods

## Overview

Scoring translates raw LLM outputs into quantitative signals that drive pass/fail decisions, regression detection, and variant comparison. This reference covers deterministic scoring, LLM-as-judge scoring, composite metrics, and calibration techniques.

## Deterministic Scoring

Deterministic scores are binary (0 or 1) or computed from exact rules. They are reproducible, cheap, and should form the foundation of every eval suite.

### Binary Pass/Fail

The simplest scoring: the assertion either passes (1.0) or fails (0.0).

```python
def score_contains(output: str, expected: str) -> float:
    return 1.0 if expected.lower() in output.lower() else 0.0
```

### Partial Credit

Some assertions benefit from partial credit. For example, if the expected output has 5 required fields and the model produces 3:

```python
def score_fields(output: dict, required_fields: list[str]) -> float:
    present = sum(1 for f in required_fields if f in output)
    return present / len(required_fields)
```

### ROUGE and BLEU

For summarization or translation tasks, n-gram overlap metrics provide a deterministic quality signal.

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)

def score_summary(output: str, reference: str) -> dict:
    scores = scorer.score(reference, output)
    return {
        "rouge1": scores["rouge1"].fmeasure,
        "rouge2": scores["rouge2"].fmeasure,
        "rougeL": scores["rougeL"].fmeasure
    }
```

**Limitation:** ROUGE and BLEU measure lexical overlap, not semantic equivalence. Two semantically identical summaries with different wording will score low. Use them as a floor check, not a ceiling.

## LLM-as-Judge Scoring

LLM-as-judge uses a second model to evaluate the output of the first. This enables scoring of subjective dimensions like helpfulness, accuracy, and tone.

### Single-Point Rubric

The judge scores the output on a numeric scale with anchored definitions.

```python
JUDGE_PROMPT = """You are evaluating an LLM's response to a customer support query.

INPUT: {input}
OUTPUT: {output}

Rate the response on a 1-5 scale for HELPFULNESS:
1 - Does not address the user's question at all.
2 - Partially addresses the question but missing key information.
3 - Addresses the question but the answer is generic or imprecise.
4 - Addresses the question with specific, actionable information.
5 - Exceeds expectations: specific, actionable, empathetic, and proactive.

Return ONLY a JSON object: {{"score": <int>, "reasoning": "<explanation>"}}
"""

async def judge_helpfulness(input_text: str, output_text: str) -> dict:
    prompt = JUDGE_PROMPT.format(input=input_text, output=output_text)
    response = await call_judge_model(prompt)
    return json.loads(response)
```

### Pairwise Comparison

Instead of absolute scores, the judge chooses which of two outputs is better.

```python
PAIRWISE_PROMPT = """Compare these two responses to the same query.

QUERY: {input}
RESPONSE A: {output_a}
RESPONSE B: {output_b}

Which response is more helpful? Consider accuracy, completeness, and tone.
Return ONLY: {{"winner": "A" or "B" or "TIE", "reasoning": "<explanation>"}}
"""
```

**Advantage:** Pairwise comparison is easier for the judge model than absolute scoring. It is the preferred method for A/B testing prompt variants.

### Multi-Dimension Scoring

Score multiple dimensions in a single judge call to reduce API costs.

```python
MULTI_DIM_PROMPT = """Evaluate this response on three dimensions.

INPUT: {input}
OUTPUT: {output}

Score each dimension 1-5:
- ACCURACY: Is the information factually correct?
- COMPLETENESS: Does it address all parts of the question?
- TONE: Is it professional, empathetic, and appropriate?

Return ONLY: {{"accuracy": <int>, "completeness": <int>, "tone": <int>, "reasoning": "<explanation>"}}
"""
```

**Pitfall:** Multi-dimension scoring can create halo effects where a strong first impression inflates all dimensions. If dimensions are critical, score them in separate judge calls.

## Variance Reduction for Judge Scoring

LLM-as-judge scores vary across runs due to model sampling. Use these techniques to reduce variance:

### Median of Odd Runs

Run the judge 3 or 5 times and take the median. This eliminates single-run outliers.

```python
async def stable_judge_score(input_text: str, output_text: str, runs: int = 3) -> float:
    scores = []
    for _ in range(runs):
        result = await judge_helpfulness(input_text, output_text)
        scores.append(result["score"])
    return statistics.median(scores)
```

### Temperature Control

Set the judge model's temperature to 0.0 for maximum determinism. This does not eliminate variance (top-p sampling still introduces noise) but reduces it substantially.

### Prompt Anchoring

Include concrete examples of each score level in the judge prompt. Anchored prompts produce tighter score distributions.

## Composite Metrics

Combine multiple scores into a single decision metric.

### Weighted Average

```python
def composite_score(scores: dict, weights: dict) -> float:
    total = sum(scores[dim] * weights[dim] for dim in scores)
    return total / sum(weights.values())

# Example: accuracy matters more than tone
composite = composite_score(
    scores={"accuracy": 4.5, "completeness": 4.0, "tone": 3.5},
    weights={"accuracy": 0.5, "completeness": 0.3, "tone": 0.2}
)
# Result: 4.1
```

### Gate + Score

Deterministic assertions act as a gate; judgmental scores only matter if the gate passes.

```python
def gated_score(deterministic_pass: bool, judge_score: float) -> float:
    if not deterministic_pass:
        return 0.0  # Hard fail regardless of judge score
    return judge_score
```

This prevents a scenario where a response gets a high judge score but violates a hard requirement (e.g., leaks a secret but is very helpful).

## Calibration

### Score Distribution Analysis

After the first eval run, plot the distribution of judge scores. A healthy distribution spans the full scale. If 90% of scores cluster at 4-5, the rubric is too lenient or the cases are too easy.

### Reference Outputs

Include 2-3 test cases with known-good outputs and expected scores. If the judge consistently scores these differently than expected, the rubric or judge model needs adjustment.

### Cross-Judge Validation

Run the same eval cases through two different judge models. High disagreement signals that the scoring dimension is ambiguous and needs a clearer rubric definition.
