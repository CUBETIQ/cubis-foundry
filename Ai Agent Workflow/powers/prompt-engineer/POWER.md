````markdown
---
inclusion: manual
name: "prompt-engineer"
displayName: "Prompt Engineer"
description: "Design and optimize LLM prompts with chain-of-thought, few-shot learning, and evaluation frameworks"
keywords: ["prompt", "llm", "ai", "chain-of-thought", "few-shot", "evaluation", "gpt", "claude"]
---

# Prompt Engineer

## When to Load Steering Files

- Prompt patterns (zero-shot, few-shot, CoT) → `prompt-patterns.md`
- Optimization techniques → `prompt-optimization.md`
- Evaluation frameworks → `evaluation-frameworks.md`
- Structured outputs (JSON, function calling) → `structured-outputs.md`
- System prompt design → `system-prompts.md`

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
````
