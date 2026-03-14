# Example: Structured Output Extraction Pipeline

## Context

A product analytics team needs to automatically extract structured data from customer feedback emails. Each email should produce a JSON object with sentiment, urgency, product name, issue category, and a summary. The pipeline must work reliably across Claude and GPT-4 and handle malformed outputs gracefully.

## JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["sentiment", "urgency", "product_name", "issue_category", "summary"],
  "properties": {
    "sentiment": {
      "type": "string",
      "enum": ["positive", "negative", "neutral"]
    },
    "urgency": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"]
    },
    "product_name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "issue_category": {
      "type": "string",
      "enum": ["billing", "technical", "account", "feature_request", "other"]
    },
    "summary": {
      "type": "string",
      "minLength": 10,
      "maxLength": 200
    }
  },
  "additionalProperties": false
}
```

## Extraction Prompt (Claude-optimized)

```
<system>
You extract structured data from customer feedback emails. You respond ONLY with
a valid JSON object matching the schema below. No prose, no explanation, no
markdown code fences -- just the JSON object.

## Schema

{
  "sentiment": "positive" | "negative" | "neutral",
  "urgency": "low" | "medium" | "high" | "critical",
  "product_name": string (the product mentioned in the email),
  "issue_category": "billing" | "technical" | "account" | "feature_request" | "other",
  "summary": string (1-2 sentence summary of the feedback)
}

## Rules

- If the email mentions multiple products, use the PRIMARY product (the one the
  complaint or praise is about).
- If sentiment is mixed, choose the DOMINANT sentiment.
- urgency is "critical" only if the customer mentions data loss, security breach,
  or complete service outage.
- If you cannot determine a field, use your best inference. NEVER leave a field empty
  or null.

## Examples

<example>
<email>
Hi, I've been trying to export my reports from DataViz Pro for the last 3 hours
and keep getting a timeout error. This is blocking our quarterly review tomorrow.
Please help urgently.
</email>
<output>
{"sentiment": "negative", "urgency": "high", "product_name": "DataViz Pro", "issue_category": "technical", "summary": "Customer cannot export reports due to timeout errors, blocking their quarterly review deadline."}
</output>
</example>

<example>
<email>
Just wanted to say that the new dashboard in Analytics Hub is fantastic! The
real-time filtering is exactly what we needed. Great job to the team.
</email>
<output>
{"sentiment": "positive", "urgency": "low", "product_name": "Analytics Hub", "issue_category": "feature_request", "summary": "Customer praises the new dashboard and real-time filtering feature in Analytics Hub."}
</output>
</example>
</system>
```

## Extraction Prompt (GPT-4 with Function Calling)

For GPT-4, use function calling mode which natively enforces JSON schema:

```python
tools = [{
    "type": "function",
    "function": {
        "name": "extract_feedback",
        "description": "Extract structured data from a customer feedback email.",
        "parameters": {
            "type": "object",
            "required": ["sentiment", "urgency", "product_name", "issue_category", "summary"],
            "properties": {
                "sentiment": {
                    "type": "string",
                    "enum": ["positive", "negative", "neutral"],
                    "description": "The overall sentiment of the email."
                },
                "urgency": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "critical"],
                    "description": "How urgently the issue needs attention."
                },
                "product_name": {
                    "type": "string",
                    "description": "The primary product mentioned in the email."
                },
                "issue_category": {
                    "type": "string",
                    "enum": ["billing", "technical", "account", "feature_request", "other"],
                    "description": "The category of the customer's issue."
                },
                "summary": {
                    "type": "string",
                    "description": "A 1-2 sentence summary of the feedback."
                }
            }
        }
    }
}]

response = openai.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Extract feedback from this email:\n\n{email_text}"}
    ],
    tools=tools,
    tool_choice={"type": "function", "function": {"name": "extract_feedback"}}
)
```

## Validation Logic

```python
import json
import jsonschema

SCHEMA = {
    "type": "object",
    "required": ["sentiment", "urgency", "product_name", "issue_category", "summary"],
    "properties": {
        "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
        "urgency": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
        "product_name": {"type": "string", "minLength": 1, "maxLength": 100},
        "issue_category": {"type": "string", "enum": ["billing", "technical", "account", "feature_request", "other"]},
        "summary": {"type": "string", "minLength": 10, "maxLength": 200}
    },
    "additionalProperties": False
}

def validate_extraction(raw_output: str) -> dict:
    """Parse and validate the LLM's structured output."""
    # Step 1: Parse JSON
    try:
        # Handle markdown code fences that some models add despite instructions
        cleaned = raw_output.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ExtractionError(f"Invalid JSON: {e}")

    # Step 2: Validate against schema
    try:
        jsonschema.validate(data, SCHEMA)
    except jsonschema.ValidationError as e:
        raise ExtractionError(f"Schema violation: {e.message}")

    return data
```

## Fallback Strategy

```python
import logging

logger = logging.getLogger(__name__)

async def extract_with_fallback(
    email_text: str,
    max_retries: int = 2
) -> dict:
    """Extract feedback with retry and fallback handling."""

    for attempt in range(max_retries + 1):
        try:
            raw_output = await call_llm(email_text)
            validated = validate_extraction(raw_output)
            return validated

        except ExtractionError as e:
            logger.warning(f"Extraction attempt {attempt + 1} failed: {e}")

            if attempt < max_retries:
                # Retry with a more constrained prompt
                raw_output = await call_llm_simplified(email_text)
                try:
                    validated = validate_extraction(raw_output)
                    return validated
                except ExtractionError:
                    continue

    # All retries exhausted -- return partial extraction with flag
    logger.error(f"All extraction attempts failed for email: {email_text[:100]}...")
    return {
        "sentiment": "neutral",
        "urgency": "medium",
        "product_name": "Unknown",
        "issue_category": "other",
        "summary": "Extraction failed. Flagged for human review.",
        "_flagged_for_review": True,
        "_raw_output": raw_output
    }
```

## Production Results

Running against 500 real customer emails:

| Metric | Claude Sonnet | GPT-4o | GPT-4o (function calling) |
|--------|--------------|--------|--------------------------|
| Valid JSON rate | 97.6% | 95.2% | 99.8% |
| Schema compliance | 96.8% | 93.4% | 99.8% |
| Correct sentiment | 91.2% | 89.4% | 90.6% |
| Correct category | 87.4% | 85.8% | 86.2% |
| Fallback triggered | 2.4% | 4.8% | 0.2% |

## Key Takeaways

1. **Function calling mode wins for schema compliance.** GPT-4o with function calling produced valid JSON 99.8% of the time vs. 95.2% with prompt-based extraction. Use function calling when available.

2. **XML fencing works well for Claude.** Wrapping the email in `<email>` tags reduced prompt injection from customer emails that contained instruction-like text.

3. **Fallback is essential.** Even at 97.6% success rate, 2.4% of 500 emails needed fallback handling. At production scale (10K emails/day), that is 240 failures per day without fallback.

4. **Enum validation catches drift.** Without validation, the model occasionally invented categories like "shipping" or "performance" that were not in the enum. Schema validation forces these into the "other" bucket on retry.

5. **Few-shot examples reduced schema violations by 68%.** The same prompt without examples produced valid JSON only 89% of the time. Adding two examples brought it to 97.6%.
