# Assertion Patterns

## Overview

Assertions are the atomic unit of LLM evaluation. Each assertion tests one property of the model output. Well-designed assertions are specific, independent, and produce clear pass/fail signals. This reference catalogs the assertion types, when to use each, and how to combine them for comprehensive coverage.

## Assertion Type Catalog

### Deterministic Assertions

These assertions produce identical results on repeated execution. They are cheap, fast, and should always be evaluated first.

#### Contains

Checks whether the output includes a specific substring (case-insensitive by default).

```json
{
  "type": "contains",
  "value": "SQL injection",
  "case_sensitive": false,
  "description": "Must identify the vulnerability type by name."
}
```

**When to use:** Verifying that the output mentions a required concept, term, or identifier.

**Pitfall:** Overly specific contains checks break when the model paraphrases. Use for exact terms (error codes, IDs, technical names) not general concepts.

#### Not-Contains

Checks that the output does NOT include a specific substring.

```json
{
  "type": "not-contains",
  "value": "AKIAIOSFODNN7EXAMPLE",
  "description": "Must not echo back AWS access keys from the input."
}
```

**When to use:** Verifying refusal behavior, absence of sensitive data, or absence of known-bad patterns.

**Pitfall:** Not-contains only catches exact matches. The model could rephrase or partially redact the sensitive content while still leaking information.

#### Regex

Checks whether the output matches a regular expression pattern.

```json
{
  "type": "regex",
  "value": "CASE-\\d{6}",
  "description": "Response must include a case reference ID in CASE-NNNNNN format."
}
```

**When to use:** Verifying structured format requirements (IDs, dates, version numbers, JSON fragments).

**Pitfall:** Complex regex patterns become maintenance burdens. Keep patterns focused on one structural element.

#### JSON Schema

Validates that the output (or a JSON block within the output) conforms to a JSON Schema.

```json
{
  "type": "json-schema",
  "value": {
    "type": "object",
    "required": ["severity", "description", "line_number"],
    "properties": {
      "severity": { "enum": ["Critical", "High", "Medium", "Low"] },
      "description": { "type": "string", "minLength": 10 },
      "line_number": { "type": "integer", "minimum": 1 }
    }
  },
  "description": "Each finding must be a structured object with severity, description, and line number."
}
```

**When to use:** When the LLM is expected to produce structured JSON output (tool calls, API responses, data extraction).

**Pitfall:** JSON schema validation fails completely if the model wraps the JSON in markdown code fences. Preprocess the output to extract JSON before validation.

#### Length

Checks that the output falls within a character or token count range.

```json
{
  "type": "length",
  "min": 100,
  "max": 500,
  "unit": "characters",
  "description": "Summary must be 100-500 characters to fit the UI card."
}
```

**When to use:** Enforcing UI constraints, token budgets, or brevity requirements.

### Judgmental Assertions

These assertions require an LLM judge or human evaluator and may produce different results across runs.

#### LLM-as-Judge (Rubric)

Sends the input and output to a judge model with an explicit rubric. The judge returns a score on the defined scale.

```json
{
  "type": "llm-judge",
  "rubric": "Rate the response on factual accuracy (1-5):\n1 = Contains factual errors\n2 = Mostly accurate with one error\n3 = Accurate but lacks detail\n4 = Accurate and detailed\n5 = Accurate, detailed, and includes supporting evidence",
  "threshold": 4,
  "judge_model": "claude-sonnet-4-20250514",
  "description": "Response must score >= 4 on factual accuracy."
}
```

**When to use:** Evaluating subjective quality dimensions (accuracy, helpfulness, tone, completeness) that cannot be captured by deterministic checks.

**Pitfall:** Judge models have their own biases. Claude judges tend to rate longer responses higher. GPT-4 judges tend toward the middle of the scale. Calibrate thresholds per judge model.

#### LLM-as-Judge (Pairwise)

Presents two outputs to the judge and asks which is better on a specific dimension.

```json
{
  "type": "llm-judge-pairwise",
  "dimension": "helpfulness",
  "candidate_a": "{{output_v2}}",
  "candidate_b": "{{output_v3}}",
  "description": "v3 must be preferred over v2 on helpfulness in at least 60% of cases."
}
```

**When to use:** A/B comparing prompt variants or model versions where absolute scores are less meaningful than relative preference.

## Assertion Composition Patterns

### The Five-Assertion Minimum

Every eval case should have at least five assertions that cover different quality dimensions:

| Slot | Type | Purpose |
|------|------|---------|
| 1 | Deterministic (contains/regex) | Verify a hard requirement is present. |
| 2 | Deterministic (contains/regex) | Verify a second hard requirement or format. |
| 3 | Not-contains | Verify absence of a known-bad pattern. |
| 4 | LLM-as-judge | Assess subjective quality (accuracy, tone). |
| 5 | LLM-as-judge or length | Assess a second quality dimension or constraint. |

### Independence Principle

Each assertion should test one thing. If assertion #2 only passes when assertion #1 passes, they are coupled and the second adds no diagnostic value. Coupled assertions inflate the apparent assertion count without improving coverage.

### Diagnostic Value

A good assertion set, when one assertion fails, tells you WHAT went wrong. If all five assertions fail simultaneously on every bad output, they are all testing the same property from different angles. Spread assertions across orthogonal dimensions.

## Common Anti-Patterns

1. **The single "looks correct" judge assertion.** One LLM-as-judge call with a vague rubric ("is this response good?") provides no diagnostic value when it fails and high variance across runs.

2. **Overly specific contains chains.** Checking for exact sentence fragments makes the eval brittle to any rephrase. Use contains for technical terms and identifiers, not prose.

3. **Missing negative assertions.** A suite of only positive checks creates false confidence. The model could pass every "must contain X" check while also including harmful content.

4. **Threshold inflation.** Setting the judge threshold to 3.0 on a 1-5 scale means "median quality is acceptable." Production systems should target >= 4.0 for customer-facing outputs.

5. **Unstable regex patterns.** Patterns like `\d+\.\d+%` to match percentages will fail when the model writes "ninety-two percent" instead of "92%". Use regex for machine-generated format, not natural language.
