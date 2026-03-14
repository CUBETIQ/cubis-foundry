# Eval Design Guide

## Overview

Evals are the skill's test suite. They verify that the skill's instructions produce correct, consistent output. Well-designed evals catch instruction regressions when skills are modified and provide a quality signal for benchmarking.

## Eval Structure

### evals.json Format

```json
{
  "evals": [
    {
      "prompt": "Scenario description that triggers the skill",
      "assertions": [
        "behavioral assertion 1",
        "behavioral assertion 2",
        "behavioral assertion 3",
        "behavioral assertion 4",
        "behavioral assertion 5"
      ]
    }
  ]
}
```

### Minimum Requirements

- 2+ eval objects per skill
- 5+ assertions per eval
- Prompts must be specific enough to trigger the skill
- Assertions must be independently verifiable

## Prompt Design

### Good Prompts

Good eval prompts are:
- **Specific** — describe a concrete scenario, not a vague request
- **Scoped** — test one aspect of the skill per eval
- **Realistic** — represent actual user requests
- **Deterministic** — should produce consistent output themes

```json
{
  "prompt": "Design a caching strategy for a product catalog API that serves 100K products with 10M daily requests. The catalog updates every 4 hours. Latency SLA is p99 < 200ms."
}
```

### Bad Prompts

```json
{
  "prompt": "Tell me about caching."
}
```

This is too vague — the skill can respond in many valid ways, making assertions unreliable.

## Assertion Design

### Behavioral Assertions

Test what the output DOES, not exact strings:

Good:
- "recommends cache-aside pattern for read-heavy workloads"
- "identifies TTL as a function of the 4-hour update cycle"
- "addresses cache invalidation strategy"

Bad:
- "contains the word 'Redis'" — too specific to exact phrasing
- "is at least 500 words" — tests length, not quality
- "mentions p99 latency" — tests echo, not reasoning

### Assertion Categories

1. **Presence** — does the output address topic X?
   - "identifies SQL injection vulnerability"
   - "recommends parameterized queries"

2. **Correctness** — is the guidance technically correct?
   - "recommends Argon2id or bcrypt for password hashing" (not MD5)
   - "uses TaskGroup for structured concurrency" (not raw create_task)

3. **Completeness** — does the output cover all required aspects?
   - "addresses both read and write paths"
   - "includes error handling for network failures"

4. **Reasoning** — does the output explain WHY?
   - "explains why cache-aside is preferred over write-through for this use case"
   - "provides trade-off analysis between consistency and latency"

5. **Actionability** — can the user act on the output?
   - "provides code examples for the recommended approach"
   - "includes configuration snippets for the caching layer"

### Assertion Count

5 assertions per eval is the sweet spot:
- 1-2 presence assertions (did the output cover the topic?)
- 1-2 correctness assertions (is the guidance right?)
- 1 completeness or reasoning assertion (is it thorough?)

Fewer than 5 doesn't provide enough signal. More than 8 becomes brittle.

## Flaky Assertion Detection

An assertion is "flaky" if it passes inconsistently across runs. Common causes:

1. **Too-specific phrasing** — testing for exact words instead of concepts
   - Fix: use behavioral language ("recommends X" instead of "says 'use X'")

2. **Ambiguous scope** — the assertion is true for many valid outputs
   - Fix: narrow the assertion to a specific aspect

3. **Order-dependent** — the assertion assumes a specific output structure
   - Fix: test for presence, not position

4. **Context-sensitive** — the assertion depends on external state
   - Fix: make the eval prompt self-contained

### Benchmark Protocol

To detect flaky assertions:
1. Run each eval 3-5 times
2. Record pass/fail per assertion per run
3. Flag assertions with < 80% pass rate
4. Rewrite flagged assertions or adjust instructions

## assertions.md Format

```markdown
# Skill Name — Eval Assertions

## Eval 1: [Eval title]

### Assertion 1: [Short name]
What it tests, why it matters, what constitutes pass vs fail.

### Assertion 2: [Short name]
...
```

Each assertion explanation should include:
- What the assertion verifies
- Why this matters for skill quality
- Clear pass/fail criteria
- Example of passing and failing output
