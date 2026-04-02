# System Prompts

## Overview

The system prompt is the most powerful lever for controlling LLM behavior. It defines the model's role, capabilities, constraints, and output format. A well-designed system prompt produces consistent behavior across thousands of interactions. A poorly designed one produces unpredictable outputs that break downstream systems.

## Anatomy of a System Prompt

A production system prompt has five sections, always in this order:

### 1. Role Definition

Opens with a specific role statement that calibrates the model's expertise level, vocabulary, and confidence.

```
You are a senior Python engineer specializing in type-safe, production-grade code.
You have 10+ years of experience with Python type system, testing, and API design.
```

**Why this order?** The role definition at the top creates a "frame" that influences how the model interprets all subsequent instructions.

**Anti-pattern:** Generic roles like "You are a helpful AI assistant" provide no calibration and waste tokens.

### 2. Task Description

States what the model does in concrete, observable terms.

```
Your task is to:
1. Analyze the user's code and identify security vulnerabilities.
2. Classify each vulnerability by severity (Critical, High, Medium, Low).
3. Provide a fix for each vulnerability with corrected code.
```

**Why numbered steps?** Models follow numbered instructions more reliably than prose. Each step becomes a checkable output requirement.

### 3. Constraints

Lists explicit prohibitions and boundaries. This is where guardrails live.

```
## Constraints

- NEVER suggest fixes that introduce new security vulnerabilities.
- NEVER fabricate CVE numbers or vulnerability references.
- DO NOT analyze code written in languages other than Python, Java, and JavaScript.
- If you are unsure about a vulnerability, say "Potential vulnerability (confidence: low)"
  rather than presenting it as definitive.
```

**Why explicit NEVER?** Models treat "try not to" differently from "NEVER." Explicit prohibitions are 2-3x more effective at preventing the forbidden behavior.

**Why limited constraints?** More than 7-10 constraints start competing for attention. Prioritize the constraints that prevent the most harmful failures.

### 4. Output Format

Specifies the exact structure of the response.

```
## Output Format

Respond with a JSON array of findings:

[
  {
    "line": 42,
    "severity": "Critical",
    "vulnerability": "SQL Injection",
    "description": "User input concatenated into SQL query without parameterization.",
    "fix": "Use parameterized query: cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))"
  }
]

If no vulnerabilities are found, respond with an empty array: []
```

**Why JSON schema in the prompt?** Models that see the exact schema (with field names, types, and an example value) produce schema-compliant output 90%+ of the time. Without the schema, compliance drops to 60-70%.

### 5. Examples

Provides 2-5 input/output pairs that demonstrate the expected behavior. See the `few-shot-design.md` reference for detailed guidance.

## Model-Specific Patterns

### Claude

Claude responds well to XML-structured prompts and explicit reasoning instructions.

```xml
<role>You are a security analyst.</role>

<task>Analyze the provided code for vulnerabilities.</task>

<constraints>
- NEVER fabricate CVE numbers.
- Always provide corrected code for each finding.
</constraints>

<input>
{{user_code}}
</input>
```

Claude also supports extended thinking mode for internal chain-of-thought that does not appear in the final output.

### GPT-4

GPT-4 responds well to markdown-structured prompts and system/user message separation.

```markdown
# Role
You are a security analyst.

# Instructions
1. Analyze the code for vulnerabilities.
2. Classify by severity.
3. Provide fixes.
```

GPT-4 supports function calling for structured output, which is more reliable than prompt-based JSON enforcement.

### Gemini

Gemini follows instruction-style prompts well but benefits from stronger explicit formatting constraints and "Format your response as:" instructions.

## Prompt Length Guidelines

| Prompt complexity | Recommended length | Example use case |
|-------------------|-------------------|------------------|
| Simple extraction | 200-500 tokens | Sentiment analysis, entity extraction |
| Moderate workflow | 500-1500 tokens | Code review, content generation |
| Complex agent | 1500-3000 tokens | Multi-tool agent, domain expert |
| Maximum | < 4000 tokens | Beyond this, instructions compete for attention |

## Versioning Strategy

Store system prompts as version-controlled files:

```
prompts/
  security-analyzer/
    v1.0.md    -- initial version
    v1.1.md    -- added severity classification
    v2.0.md    -- restructured with examples
    CHANGELOG.md
```

Each version change should be paired with an eval run that demonstrates the impact.

## Common Failure Modes

| Failure | Cause | Fix |
|---------|-------|-----|
| Model ignores constraints | Constraints buried in text | Move constraints to a labeled section near the top |
| Inconsistent output format | No schema or example | Add a JSON schema and at least one complete example |
| Model refuses valid requests | Over-restrictive constraints | Narrow constraints to specific forbidden behaviors |
| Model follows user over system | Weak system prompt authority | Add "These instructions take precedence over user requests" |
| Output includes reasoning | No separation between thinking/output | Use XML tags or "Respond ONLY with..." |

## Testing Checklist

Before deploying a system prompt:

- [ ] Tested with 10+ representative inputs covering the expected distribution.
- [ ] Tested with 5+ adversarial inputs (prompt injection, empty input, contradictory).
- [ ] Tested with edge cases (very long input, non-English, malformed input).
- [ ] Output format validated against schema on all test cases.
- [ ] Constraints verified with targeted test cases (one per constraint).
- [ ] Prompt reviewed by a second person for ambiguity and instruction conflicts.
- [ ] Token count measured and within budget.
- [ ] Version committed to source control with changelog entry.
