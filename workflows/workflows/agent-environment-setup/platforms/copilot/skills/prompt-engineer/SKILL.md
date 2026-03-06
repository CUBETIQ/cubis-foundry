---
name: "prompt-engineer"
description: "Design and optimize LLM prompts with chain-of-thought, few-shot learning, and evaluation frameworks"
---
# Prompt Engineer

## When to Load Steering Files

| File | Load when |
| --- | --- |
| `references/prompt-patterns.md` | Choosing zero-shot, few-shot, chain-of-thought, or decomposition patterns. |
| `references/prompt-optimization.md` | Iterating on failures, reducing ambiguity, or tightening prompts for latency/cost. |
| `references/evaluation-frameworks.md` | Building prompt test cases, eval loops, or regression checks. |
| `references/structured-outputs.md` | Designing JSON outputs, schema-constrained outputs, or tool/function calling prompts. |
| `references/system-prompts.md` | Defining durable system prompts, role constraints, or behavioral guardrails. |

## Core Workflow

1. **Understand** - Define task, success criteria, constraints
2. **Design** - Choose pattern, write clear instructions
3. **Test** - Run diverse test cases
4. **Iterate** - Refine based on failures
5. **Document** - Version and monitor

## Prompt Format

```
<role/persona>
<task description>
<constraints>
<output format>
<examples if few-shot>
```

## Rules

- Test with diverse inputs including edge cases
- Measure with quantitative metrics
- Version prompts and track changes
- Consider token costs and latency
- Don't deploy without evaluation
