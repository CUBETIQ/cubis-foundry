# Skill Testing Reference

Load this when writing evals, regression sets, or description-triggering tests for a CBX skill.

Source: Anthropic skill-creator research — [Improving skill-creator: Test, measure, and refine Agent Skills](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills) (March 2026).

---

## Two Reasons to Test

1. **Catch regressions** — As models and infrastructure evolve, skills that worked last month may behave differently. Evals give you an early signal before it impacts your team.
2. **Know when the skill is obsolete** — For _capability uplift_ skills: if the base model starts passing your evals without the skill loaded, the skill has been incorporated into model behavior and can be retired.

---

## Five Test Categories

Every skill should pass all five before shipping.

### 1. Trigger tests (description precision)

Does the skill load when it should — and stay quiet when it shouldn't?

**Method:**

- Write 5 natural-language prompts that _should_ trigger the skill
- Write 5 near-miss prompts that _should not_ trigger
- Load the skill and observe whether it activates

**Example for a frontend-design skill:**

```
Should trigger:
- "Build me a landing page for my SaaS product"
- "Make this dashboard look less generic"
- "I need a color system for a health app"

Should NOT trigger:
- "Fix this TypeScript error"
- "Review my API endpoint design"
- "Help me write tests"
```

**Fix:** If false positives occur, make the description more specific. If false negatives, broaden or add domain keywords.

### 2. Happy path test

Does the skill complete its standard task correctly?

**Method:**

- Write the most common, straightforward version of the task the skill handles
- Run it and verify the output meets the expected criteria

### 3. Edge case tests

What happens under abnormal or missing input?

Examples:

- Missing required information (no brand color, no framework specified)
- Ambiguous phrasing
- Conflicting requirements
- Very large or very small input
- The user ignored the clarification questions and just said "do it"

### 4. Comparison test (A/B)

Does the skill actually improve output vs. no skill?

**Method:** Run the same prompt with and without the skill loaded. Judge which output is better — ideally with a fresh evaluator agent that doesn't know which is which.

If the no-skill output is equivalent, the skill adds no value (or the model has caught up to it).

### 5. Reader test

Can someone with no conversation context understand the skill's output?

**Method:**

- Take the skill's final output (plan, document, code, design)
- Open a fresh conversation or use a sub-agent with only the output, no history
- Ask: "What is this?", "What are the key decisions?", "What's unclear?"

If the fresh reader struggles, the output has context bleed issues. Fix them before shipping.

---

## Writing Eval Cases

Each eval case = one input + expected behavior description.

**Format:**

```
Input: [natural language prompt or file +prompt]
Expected:
  - [Observable behavior 1]
  - [Observable behavior 2]
  - [Observable behavior 3 — what NOT to happen]
```

**Example for `ask-questions-if-underspecified`:**

```
Input: "Build me a feature."
Expected:
  - Asks at least 1 clarifying question (scope, purpose, or constraints)
  - Provides default options to choose from
  - Does NOT immediately generate code
  - Does NOT ask more than 5 questions
```

**Rules:**

- Evals should be independent (not dependent on previous evals)
- Expected behavior should be observable and binary (pass/fail, not subjective)
- Aim for 5-10 evals per skill before shipping; 15+ for critical skills

---

## Benchmark Mode

Run all evals after a model update or after editing the skill:

1. Run all evals sequentially (or in parallel to avoid context bleed)
2. Record: pass rate, elapsed time per eval, token usage
3. Compare to baseline before the change

**Pass rate thresholds:**

- < 60%: Skill has serious issues. Do not ship.
- 60-80%: Acceptable for early versions. Target improvement.
- > 80%: Production-ready.
- > 90%: Reliable enough for critical workflows.

---

## Description Tuning Process

If triggering is unreliable:

1. List 10 prompts that should trigger the skill (write them as a user would)
2. List 5 prompts of similar tasks that should _not_ trigger
3. Find the distinguishing words/phrases between the two lists
4. Rewrite the description to include the distinguishing words and exclude the overlap

**Pattern:**

```yaml
description: "Use when [specific verb] [specific noun/domain]: [comma-separated task keywords]. NOT for [adjacent tasks that should not trigger]."
```

---

## When to Retire a Skill

A skill is ready to retire when:

- 90%+ of its evals pass without the skill loaded (for capability uplift skills)
- The skill's instructions are now standard model behavior
- Maintenance cost exceeds value

Retiring isn't failure — it means the skill did its job and the model caught up.
