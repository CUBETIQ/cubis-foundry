# Structured Output

## Overview

Structured output transforms free-form LLM responses into machine-parseable data (JSON, YAML, XML, typed objects). This is critical for production systems where downstream code must reliably extract fields, validate types, and process results. This reference covers schema design, enforcement techniques, validation, and error recovery.

## Enforcement Techniques

### 1. Prompt-Based Enforcement

Include the exact schema and an example in the system prompt.

```
Respond ONLY with a valid JSON object matching this schema. No prose, no code fences.

{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": number between 0 and 1,
  "keywords": ["string", ...]
}

Example:
{"sentiment": "negative", "confidence": 0.92, "keywords": ["slow", "frustrated", "billing"]}
```

**Reliability:** 85-95% valid JSON depending on model and prompt quality.
**Pros:** Works with any model, no API-specific features required.
**Cons:** Model may add prose, code fences, or deviate from the schema.

### 2. Function Calling / Tool Use (OpenAI)

Use the function calling API to define the output schema as a tool.

```python
tools = [{
    "type": "function",
    "function": {
        "name": "analyze_sentiment",
        "parameters": {
            "type": "object",
            "required": ["sentiment", "confidence", "keywords"],
            "properties": {
                "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "keywords": {"type": "array", "items": {"type": "string"}}
            }
        }
    }
}]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    tool_choice={"type": "function", "function": {"name": "analyze_sentiment"}}
)

result = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
```

**Reliability:** 98-99.8% schema-compliant output.
**Pros:** Schema enforced by the API, not just the prompt. Highest reliability.
**Cons:** OpenAI-specific. Other providers have different implementations.

### 3. Structured Outputs Mode (OpenAI)

OpenAI's `response_format` parameter with JSON Schema.

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "sentiment_analysis",
            "schema": {
                "type": "object",
                "required": ["sentiment", "confidence", "keywords"],
                "properties": {
                    "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
                    "confidence": {"type": "number"},
                    "keywords": {"type": "array", "items": {"type": "string"}}
                },
                "additionalProperties": False
            }
        }
    }
)
```

**Reliability:** 99.9%+ schema compliance. The API constrains the model's token generation to only produce valid JSON matching the schema.
**Pros:** Guaranteed schema compliance. No validation needed.
**Cons:** OpenAI-specific. Limited schema complexity (no recursive schemas).

### 4. XML Fencing (Claude)

Claude follows XML-structured prompts reliably.

```
Extract the data and respond inside <result> tags:

<result>
{"sentiment": "...", "confidence": N, "keywords": ["..."]}
</result>
```

**Reliability:** 90-95% correct structure when using XML tags.
**Pros:** Native to Claude's training. Clean separation of output from any reasoning.
**Cons:** Requires post-processing to extract content from tags.

## Schema Design Principles

### Use Enums for Categorical Fields

```json
{
  "severity": {"type": "string", "enum": ["critical", "high", "medium", "low"]}
}
```

Without enums, the model may produce "Critical", "CRITICAL", "crit", or "very high" -- all meaning the same thing but breaking downstream parsing.

### Require All Fields

```json
{
  "required": ["sentiment", "confidence", "keywords"],
  "additionalProperties": false
}
```

Optional fields invite inconsistency. If a field is sometimes present and sometimes absent, downstream code needs to handle both cases.

### Constrain String Lengths

```json
{
  "summary": {"type": "string", "minLength": 10, "maxLength": 200}
}
```

Without length constraints, the model may produce a 1000-word "summary" or a single word.

### Use Nested Objects Sparingly

Deeply nested schemas increase the chance of structural errors. Prefer flat structures:

**Prefer:**
```json
{
  "author_name": "string",
  "author_email": "string",
  "title": "string"
}
```

**Avoid (unless necessary):**
```json
{
  "author": {
    "name": "string",
    "email": "string"
  },
  "title": "string"
}
```

## Validation Pipeline

Always validate LLM output, even with schema-enforced APIs.

```python
import json
import jsonschema
from typing import Any

SCHEMA = {
    "type": "object",
    "required": ["sentiment", "confidence", "keywords"],
    "properties": {
        "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "keywords": {"type": "array", "items": {"type": "string"}, "maxItems": 10}
    },
    "additionalProperties": False
}

def validate_output(raw: str) -> dict[str, Any]:
    """Parse, clean, and validate LLM output against schema."""
    # Step 1: Clean common artifacts
    cleaned = raw.strip()

    # Remove markdown code fences
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    # Remove XML tags if present
    if "<result>" in cleaned:
        cleaned = cleaned.split("<result>")[1].split("</result>")[0].strip()

    # Step 2: Parse JSON
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid JSON: {e}")

    # Step 3: Validate against schema
    try:
        jsonschema.validate(data, SCHEMA)
    except jsonschema.ValidationError as e:
        raise ValidationError(f"Schema violation: {e.message}")

    return data
```

## Error Recovery Strategies

### Strategy 1: Retry with Simplified Prompt

```python
SIMPLIFIED_PROMPT = """Extract sentiment from this text.
Respond with ONLY one word: positive, negative, or neutral."""

async def extract_with_retry(text: str, max_retries: int = 2) -> dict:
    for attempt in range(max_retries + 1):
        try:
            raw = await call_llm(text, full_prompt if attempt == 0 else SIMPLIFIED_PROMPT)
            return validate_output(raw)
        except ValidationError:
            if attempt == max_retries:
                raise
            continue
```

### Strategy 2: Partial Extraction

When full validation fails, extract whatever fields are valid.

```python
def partial_extract(raw: str, schema: dict) -> dict:
    """Extract valid fields from potentially malformed output."""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {"_parse_error": True, "_raw": raw}

    result = {}
    for field, field_schema in schema["properties"].items():
        if field in data:
            try:
                jsonschema.validate({field: data[field]}, {
                    "type": "object",
                    "properties": {field: field_schema}
                })
                result[field] = data[field]
            except jsonschema.ValidationError:
                result[f"_{field}_invalid"] = data[field]

    return result
```

### Strategy 3: Human Review Queue

For critical data, route validation failures to human review rather than discarding.

```python
async def extract_or_queue(text: str) -> dict:
    try:
        return await extract_with_retry(text)
    except ValidationError:
        await queue_for_review(text, reason="extraction_failure")
        return {"_status": "queued_for_review"}
```

## Multi-Model Comparison

| Technique | Claude | GPT-4o | Gemini |
|-----------|--------|--------|--------|
| Prompt-based JSON | 92% valid | 90% valid | 88% valid |
| XML fencing | 95% valid | 85% valid | 82% valid |
| Function calling | N/A | 99.5% valid | 97% valid |
| Structured outputs | N/A | 99.9% valid | N/A |
| With few-shot example | +5-8% improvement | +5-8% improvement | +8-10% improvement |

**Recommendation:** Use function calling / structured outputs when available. Fall back to prompt-based with few-shot examples and validation for models that do not support native structured output.

## Performance Optimization

### Streaming with Partial JSON

For latency-sensitive applications, parse the JSON as it streams in:

```python
import ijson

async def stream_structured_output(response_stream) -> dict:
    """Parse JSON incrementally from a streaming response."""
    buffer = ""
    async for chunk in response_stream:
        buffer += chunk
        try:
            return json.loads(buffer)
        except json.JSONDecodeError:
            continue
    raise ValidationError("Stream ended without valid JSON")
```

### Caching Validated Results

If the same input produces the same structured output, cache it:

```python
from functools import lru_cache
import hashlib

def cache_key(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()

# Cache up to 1000 recent extractions
@lru_cache(maxsize=1000)
def cached_extract(text_hash: str, text: str) -> dict:
    return extract_with_retry(text)
```
