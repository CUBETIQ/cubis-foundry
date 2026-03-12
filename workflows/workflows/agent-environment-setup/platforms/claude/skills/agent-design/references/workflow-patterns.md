# Workflow Patterns Reference

Load this when choosing or implementing a workflow pattern for a CBX agent or skill.

Source: Anthropic engineering research — [Common workflow patterns for AI agents](https://claude.com/blog/common-workflow-patterns-for-ai-agents-and-when-to-use-them) (March 2026).

---

## The Core Insight

Workflows don't replace agent autonomy — they _shape where and how_ agents apply it.

A fully autonomous agent decides everything: tools, order, when to stop.  
A workflow provides structure: overall flow, checkpoints, boundaries — but each step still uses full agent reasoning.

**Start with a single agent call.** If that meets quality bar, you're done. Only add workflow complexity when you can measure the improvement.

---

## Pattern 1: Sequential Workflow

### What it is

Agents execute in a fixed order. Each stage processes its input, makes tool calls, then passes results to the next stage.

```
Input → [Agent A] → [Agent B] → [Agent C] → Output
```

### Use when

- Steps have explicit dependencies (B needs A's output before starting)
- Multi-stage transformation where each step adds specific value
- Draft-review-polish cycles
- Data extraction → validation → loading pipelines

### Avoid when

- A single agent can handle the whole task
- Agents need to collaborate rather than hand off linearly
- You're forcing sequential structure onto a task that doesn't naturally fit it

### Cost/benefit

- **Cost:** Latency is linear — step 2 waits for step 1
- **Benefit:** Each agent focuses on one thing; accuracy often improves

### CBX implementation

```markdown
## Workflow

1. **[Agent/Step A]** — [what it receives, what it does, what it produces]
2. **[Agent/Step B]** — [takes A's output, does X, produces Y]
3. **[Agent/Step C]** — [final synthesis/delivery]

Artifacts pass via [file path / variable / structured JSON / natural handoff instructions].
```

### Pro tip

First try the pipeline as a single agent where the steps are part of the prompt. If quality is good enough, you've solved the problem without complexity.

---

## Pattern 2: Parallel Workflow

### What it is

Multiple agents run simultaneously on independent tasks. Results are merged or synthesized afterward.

```
         ┌→ [Agent A] →┐
Input →  ├→ [Agent B] →├→ Synthesize → Output
         └→ [Agent C] →┘
```

### Use when

- Tasks are genuinely independent (no agent needs another's output to start)
- Speed matters and concurrent execution helps
- Multiple perspectives on the same input (e.g., code review from security + performance + quality)
- Separation of concerns — different engineers can own individual agents

### Avoid when

- Agents need cumulative context or must build on each other's work
- Resource constraints (API quotas) make concurrent calls inefficient
- Aggregation logic is unclear or produces contradictory results with no resolution strategy

### Cost/benefit

- **Cost:** Tokens multiply (N agents × tokens each); requires aggregation strategy
- **Benefit:** Faster completion; clean separation of concerns

### CBX implementation

```markdown
## Parallel Steps

Run these simultaneously:

- **[Agent A]** — [focused task, specific scope]
- **[Agent B]** — [focused task, different scope]
- **[Agent C]** — [focused task, different scope]

## Synthesis

After all agents complete:
[How to merge: majority vote / highest confidence / specialized agent defers to other / human review]
```

### Pro tip

Design your aggregation strategy _before_ implementing parallel agents. Without a clear merge plan, you collect conflicting outputs with no way to resolve them.

---

## Pattern 3: Evaluator-Optimizer Workflow

### What it is

Two agents loop: one generates content, another evaluates it against criteria, the generator refines based on feedback. Repeat until quality threshold is met or max iterations reached.

```
        ┌─────────────────────────────────────┐
        ↓                                     |
Input → [Generator] → Draft → [Evaluator] → Pass? → Output
                                 ↓ Fail
                            Feedback → [Generator]
```

### Use when

- First-draft quality consistently falls short of the required bar
- You have clear, measurable quality criteria an AI evaluator can apply consistently
- The gap between first-attempt and final quality justifies extra tokens and latency
- Examples: technical docs, customer communications, code against specific standards

### Avoid when

- First-attempt quality already meets requirements (unnecessary cost)
- Real-time applications needing immediate responses
- Evaluation criteria are too subjective for consistent AI evaluation
- Deterministic tools exist (linters for style, validators for schemas) — use those instead

### Cost/benefit

- **Cost:** Tokens × iterations; adds latency proportionally
- **Benefit:** Structured feedback loops produce measurably better outputs

### CBX implementation

```markdown
## Generator Prompt

Task: [what to create]
Constraints: [specific, measurable requirements]
Format: [exact output format]

## Evaluator Prompt

Review this output against these criteria:

1. [Criterion A] — Pass/Fail + specific failure note
2. [Criterion B] — Pass/Fail + specific failure note
3. [Criterion C] — Pass/Fail + specific failure note

Output JSON: { "pass": bool, "failures": ["..."], "revision_note": "..." }

## Loop Control

- Max iterations: [3-5]
- Stop when: all criteria pass OR max iterations reached
- On max with failures: surface remaining issues for human review
```

### Pro tip

Set stopping criteria _before_ iterating. Define max iterations and specific quality thresholds. Without guardrails, you enter expensive loops where the evaluator finds minor issues and quality plateaus well before you stop.

---

## Decision Tree

```
Can a single agent handle this task effectively?
  → YES: Don't use workflows. Use a rich single-agent prompt.
  → NO: Continue...

Do steps have dependencies (B needs A's output)?
  → YES: Use Sequential
  → NO: Continue...

Can steps run independently, and would concurrency help?
  → YES: Use Parallel
  → NO: Continue...

Does quality improve meaningfully through iteration, and can you measure it?
  → YES: Use Evaluator-Optimizer
  → NO: Re-examine whether workflows help at all
```

---

## Combining Patterns

Patterns are building blocks, not mutually exclusive:

- A **sequential workflow** can include **parallel** steps at certain stages (e.g., three parallel reviewers before a final synthesis step)
- An **evaluator-optimizer** can use **parallel evaluation** where multiple evaluators assess different quality dimensions simultaneously
- A **sequential chain** can use **evaluator-optimizer** at the critical high-quality step

Only add the combination when each additional pattern measurably improves outcomes.

---

## Pattern Comparison

|                | Sequential                                   | Parallel                                | Evaluator-Optimizer                  |
| -------------- | -------------------------------------------- | --------------------------------------- | ------------------------------------ |
| **When**       | Dependencies between steps                   | Independent tasks                       | Quality below bar                    |
| **Examples**   | Extract → validate → load; Draft → translate | Code review (security + perf + quality) | Technical docs, comms, SQL           |
| **Latency**    | Linear (each waits for previous)             | Fast (concurrent)                       | Multiplied by iterations             |
| **Token cost** | Linear                                       | Multiplicative                          | Linear × iterations                  |
| **Key risk**   | Bottleneck at slow steps                     | Aggregation conflicts                   | Infinite loops without stop criteria |
