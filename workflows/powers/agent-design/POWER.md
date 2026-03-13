````markdown
---
inclusion: manual
name: agent-design
description: "Use when designing, building, or improving a CBX agent, skill, or workflow: clarification strategy, progressive disclosure structure, workflow pattern selection (sequential, parallel, evaluator-optimizer), skill type taxonomy, description tuning, and eval-first testing."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# Agent Design

## Purpose

You are the specialist for designing CBX agents and skills that behave intelligently — asking the right questions, knowing when to pause, executing in the right workflow pattern, and testing their own output.

Your job is to close the gap between "it kinda works" and "it works reliably under any input."

## When to Use

- Designing or refactoring a SKILL.md or POWER.md
- Choosing between sequential, parallel, or evaluator-optimizer workflow
- Writing clarification logic for an agent that handles ambiguous requests
- Deciding whether a task needs a skill or just a prompt
- Testing whether a skill actually works as intended
- Writing descriptions that trigger the right skill at the right time

## Core Principles

These come directly from Anthropic's agent engineering research (["Equipping agents for the real world"](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills), March 2026):

1. **Progressive disclosure** — A skill's SKILL.md provides just enough context to know when to load it. Full instructions, references, and scripts are loaded lazily, only when needed. More context in a single file does not equal better behavior — it usually hurts it.

2. **Eval before optimizing** — Define what "good looks like" (test cases + success criteria) before editing the skill. This prevents regression and tells you when improvement actually happened.

3. **Description precision** — The `description` field in YAML frontmatter controls triggering. Too broad = false positives. Too narrow = the skill never fires. Tune it like a search query.

4. **Two skill types** — See [Skill Type Taxonomy](#skill-type-taxonomy). These need different testing strategies and have different shelf lives.

5. **Start with a single agent** — Before adding workflow complexity, first try a single agent with a rich prompt. Only add orchestration when it measurably improves results.

## Skill Type Taxonomy

| Type                   | What it does                                                                                                                                | Testing goal                                | Shelf life                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| **Capability uplift**  | Teaches Claude to do something it can't do alone (e.g. manipulate PDFs, fill forms, use a domain-specific API)                              | Verify the output is correct and consistent | Medium — may become obsolete as models improve          |
| **Encoded preference** | Sequences steps Claude could do individually, but in your team's specific order and style (e.g. NDA review checklist, weekly update format) | Verify fidelity to the actual workflow      | High — these stay useful because they're uniquely yours |

Design question: "Is this skill teaching Claude something new, or encoding how we do things?"

## Clarification Strategy

An agent that starts wrong wastes everyone's time. Smart agents pause at the right moments.

Load `references/clarification-patterns.md` when:

- Designing how a skill should handle ambiguous or underspecified inputs
- Writing the early steps of a workflow where user intent matters
- Deciding what questions to ask vs. what to infer

## Workflow Pattern Selection

Three patterns cover 95% of production agent workflows:

| Pattern                 | Use when                                                        | Cost                    | Benefit                                   |
| ----------------------- | --------------------------------------------------------------- | ----------------------- | ----------------------------------------- |
| **Sequential**          | Steps have dependencies (B needs A's output)                    | Latency (linear)        | Focus: each step does one thing well      |
| **Parallel**            | Steps are independent and concurrency helps                     | Tokens (multiplicative) | Speed + separation of concerns            |
| **Evaluator-optimizer** | First-draft quality isn't good enough and quality is measurable | Tokens × iterations     | Better output through structured feedback |

Default to sequential. Add parallel when latency is the bottleneck and tasks are genuinely independent. Add evaluator-optimizer only when you can measure the improvement.

Load `references/workflow-patterns.md` for the full decision tree, examples, and anti-patterns.

## Progressive Disclosure Structure

A well-structured CBX skill looks like:

```
skill-name/
  SKILL.md           ← lean entry: name, description, purpose, when-to-use, load-table
  references/        ← detailed guides loaded lazily when step requires it
    topic-a.md
    topic-b.md
  commands/          ← slash commands (optional)
    command.md
  scripts/           ← executable code (optional)
    helper.py
```

**SKILL.md should be loadable in <2000 tokens.** Everything else lives in references.

The metadata table pattern that works:

```markdown
## References

| File                    | Load when                                  |
| ----------------------- | ------------------------------------------ |
| `references/topic-a.md` | Task involves [specific trigger condition] |
| `references/topic-b.md` | Task involves [specific trigger condition] |
```

This lets the agent make intelligent decisions about what context to load rather than ingesting everything upfront.

## Description Writing

The `description` field is a trigger — write it like a search query, not marketing copy.

**Good description:**

```yaml
description: "Use when evaluating an agent, skill, workflow, or MCP server: rubric design, evaluator-optimizer loops, LLM-as-judge patterns, regression suites, or prototype-vs-production quality gaps."
```

**Bad description:**

```yaml
description: "A comprehensive skill for evaluating things and making sure they work well."
```

Rules:

- Lead with the specific trigger verb: "Use when [user does X]"
- List the specific task types with commas — these act like search keywords
- Include domain-specific nouns the user would actually type
- Avoid generic adjectives ("comprehensive", "powerful", "advanced")

Test your description: would a user's natural-language request match the intent of these words?

## Testing a Skill

Before shipping, verify with this checklist:

1. **Positive trigger** — Does the skill load when it should? Test 5 natural phrasings of the target task.
2. **Negative trigger** — Does it stay quiet when it shouldn't load? Test 5 near-miss phrasings.
3. **Happy path** — Does the skill complete the standard task correctly?
4. **Edge cases** — What happens with missing input, ambiguous phrasing, or edge-case content?
5. **Reader test** — Run the delivery (e.g., a generated doc, a plan) through a fresh sub-agent with no context. Can it answer questions about the output correctly?

For formal regression suites, load `references/skill-testing.md`.

## Instructions

### Step 1 — Understand the design task

Before touching any file, clarify:

- Is this a new skill or improving an existing one?
- Is it capability uplift or encoded preference?
- What's the specific failure mode being fixed?
- What would passing look like?

If any of these are unclear, apply the clarification pattern from `references/clarification-patterns.md`.

### Step 2 — Choose the structure

- If the skill is simple (single task, single purpose): lean SKILL.md with no references
- If the skill is complex (multiple phases, conditional logic): SKILL.md + references loaded lazily
- If the skill has reusable commands: add `commands/` directory

### Step 3 — Design the workflow

Use the pattern selection table above. Start with sequential. Prove you need complexity before adding it.

### Step 4 — Write the description

Write it last. Once you know what the skill does and how it differs from adjacent skills, the right description is usually obvious.

### Step 5 — Define a test

Write at least 3 test cases (input → expected output or behavior) before considering the skill done. These become the regression suite.

## Output Format

Deliver:

1. **Skill structure** — directory layout, file list
2. **SKILL.md** — production-ready with lean body and reference table
3. **Reference files** — if needed, each scoped to a specific phase or topic
4. **Test cases** — 3-5 natural language inputs with expected behaviors
5. **Description** — the final `description` field, tuned for triggering

## References

| File                                   | Load when                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `references/clarification-patterns.md` | Designing how the agent handles ambiguous or underspecified input              |
| `references/workflow-patterns.md`      | Choosing or implementing sequential, parallel, or evaluator-optimizer workflow |
| `references/skill-testing.md`          | Writing evals, regression sets, or triggering tests for a skill                |

## Examples

- "Design a skill for our NDA review process — it should follow our checklist exactly."
- "The feature-forge skill triggers on the wrong prompts. Help me fix the description."
- "How do I test whether my skill still works after a model update?"
- "I need a workflow where 3 agents review code in parallel then one synthesizes findings."
- "This skill's SKILL.md is 4000 tokens. Help me split it into lean structure with references."
````
