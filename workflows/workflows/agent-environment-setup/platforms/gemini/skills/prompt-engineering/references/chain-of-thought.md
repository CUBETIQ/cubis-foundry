# Chain-of-Thought Reasoning

## Overview

Chain-of-thought (CoT) prompting instructs the model to show its reasoning before producing a final answer. This technique improves accuracy on multi-step problems by 15-40% because it forces the model to decompose complex tasks into sequential steps rather than jumping to conclusions.

## When CoT Helps

| Task type | CoT benefit | Example |
|-----------|-------------|---------|
| Arithmetic and math | High (+30-40%) | "If 25% off $80, what is the final price with 8% tax?" |
| Multi-hop reasoning | High (+25-35%) | "Given A implies B and B implies C, does A imply C?" |
| Code debugging | Medium (+15-25%) | "Find the bug in this function." |
| Classification | Low (+5-10%) | "Is this email spam or not?" |
| Simple extraction | None (0%) | "Extract the email address from this text." |

**Rule of thumb:** Use CoT when the task requires more than one mental step. Skip it for tasks where the answer is a direct extraction or lookup.

## CoT Variants

### Zero-Shot CoT

Append "Let's think step by step" to the prompt.

```
Q: A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball.
How much does the ball cost?

Let's think step by step.
```

**Effectiveness:** Surprisingly effective. The phrase improves accuracy by 10-20% on reasoning tasks with zero additional effort.

### Few-Shot CoT

Provide examples that include the reasoning trace.

```
Q: Roger has 5 tennis balls. He buys 2 more cans with 3 balls each. Total?

A: Step by step:
1. Roger starts with 5 balls.
2. He buys 2 cans x 3 balls = 6 new balls.
3. Total: 5 + 6 = 11 balls.

The answer is 11.
```

**Effectiveness:** 20-40% improvement on math and reasoning tasks.

### Structured CoT

Provide a numbered template that the model fills in.

```
Analyze this security vulnerability:

Step 1 - IDENTIFY: What type of vulnerability is present?
Step 2 - SEVERITY: How severe is it (Critical/High/Medium/Low) and why?
Step 3 - IMPACT: What could an attacker do with this vulnerability?
Step 4 - FIX: What is the recommended remediation?
Step 5 - ANSWER: Provide the structured finding JSON.
```

**Effectiveness:** Most reliable variant. Numbered steps ensure the model does not skip reasoning steps and produces consistent structure.

### Tree-of-Thought

For tasks with multiple possible approaches, have the model explore alternatives before committing.

```
Consider 3 possible approaches to solve this problem:

Approach A: [describe]  Pros: ...  Cons: ...
Approach B: [describe]  Pros: ...  Cons: ...
Approach C: [describe]  Pros: ...  Cons: ...

Best approach: [choose and justify]
Solution: [solve using chosen approach]
```

**When to use:** Complex design decisions, architecture choices, or problems with multiple valid solutions.

## Separating Reasoning from Output

Downstream systems need to parse the final answer without extracting it from reasoning text.

### XML Fencing

```xml
<thinking>
1. The user wants to sort a list of strings by length.
2. Python's sorted() accepts a key parameter.
3. Using len as the key sorts by string length.
</thinking>

<answer>
def sort_by_length(strings: list[str]) -> list[str]:
    return sorted(strings, key=len)
</answer>
```

### JSON Separation

```json
{
  "reasoning": "The error on line 15 uses 'count' before definition. Move init to line 10.",
  "answer": {
    "bug_line": 15,
    "fix": "Move 'count = 0' to line 10, before the for loop."
  }
}
```

### Delimiter Separation

```
--- REASONING ---
The customer asks about order #12345. Order shipped March 1, out for delivery.
--- END REASONING ---

Your order #12345 shipped March 1 and is out for delivery. Expected today by 5 PM.
```

## Extended Thinking (Claude)

Claude supports extended thinking mode where the model produces a `<thinking>` block not shown to the end user.

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=8192,
    thinking={"type": "enabled", "budget_tokens": 4096},
    messages=[{"role": "user", "content": "Solve this math problem: ..."}]
)
```

**Advantage:** The model reasons internally without the user seeing "Let me think step by step..."
**Limitation:** You cannot control the thinking process or provide a thinking template.

## CoT Calibration

### When CoT Hurts

1. **Simple tasks:** CoT adds unnecessary tokens and latency without improving accuracy.
2. **Speed-critical paths:** CoT doubles or triples token output.
3. **Very long contexts:** CoT in long contexts can cause the model to lose track of earlier information.

### Controlling Reasoning Depth

| Instruction | Effect |
|-------------|--------|
| "Think step by step" | Open-ended, may be verbose |
| "Think briefly before answering" | 1-2 sentence reasoning |
| "In 3 steps, reason through..." | Exactly 3 reasoning steps |
| "Use the following analysis template:" | Templated, predictable structure |

Match reasoning depth to task complexity.

## CoT + Structured Output

Combine CoT with structured output for accurate reasoning and parseable answers.

```xml
<thinking>
[Step-by-step analysis here]
</thinking>

<findings>
[{"line": N, "severity": "...", "description": "...", "fix": "..."}]
</findings>
```

This pattern ensures the model reasons through the problem (improving accuracy) while producing a parseable output (enabling automation).

## Measuring CoT Impact

Run the same eval suite with and without CoT:

| Metric | Without CoT | With CoT | Delta |
|--------|-------------|----------|-------|
| Accuracy | 72% | 91% | +19% |
| Latency p50 | 800ms | 1400ms | +75% |
| Token output | 120 | 350 | +192% |
| Cost per query | $0.003 | $0.008 | +167% |

**Decision rule:** Use CoT when the accuracy improvement justifies the cost and latency increase.

### Reasoning Quality Checks

Signs of low-quality CoT:
- **Circular reasoning:** "The answer is X because X is the answer."
- **Confabulated steps:** Reasoning cites facts not in the input.
- **Correct reasoning, wrong answer:** Indicates a formatting or extraction problem, not a reasoning problem.
