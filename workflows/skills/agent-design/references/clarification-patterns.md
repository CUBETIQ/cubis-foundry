# Clarification Patterns Reference

Load this when designing how an agent handles ambiguous, underspecified, or multi-interpretation input.

Source: Anthropic doc-coauthoring skill pattern + CBX ask-questions-if-underspecified research (2026).

---

## When to Clarify vs. When to Infer

The wrong default is to ask everything. The right default is to ask what genuinely branches the work.

**Clarify** when:

- Multiple plausible interpretations produce significantly different implementations
- The wrong interpretation wastes significant time or produces the wrong output
- A key parameter (scope, audience, constraint) changes the entire approach

**Infer and state assumptions** when:

- A quick read (repo structure, config file, existing code) can answer the question
- The request is clear for 90%+ of the obvious interpretations
- The user explicitly asked you to proceed

**Proceed without asking** when:

- The task is clear and unambiguous
- Discovery is faster than asking
- The cost of being slightly wrong is low and reversible

---

## The 1-5 Question Rule

Ask at most **5 questions** in the first pass. Prefer questions that eliminate entire branches of work.

If more than 5 things are unclear, rank by impact and ask the highest-impact ones first. More questions surface after the user's first answers.

---

## Fast-Path Design

Every clarification block should have a fast path. Users who know what they want shouldn't wade through 5 questions.

**Include always:**

- A compact reply format: `"Reply 1b 2a 3c to accept these options"`
- Default options explicitly labeled: `(default)` or _bolded_
- A fast-path shortcut: `"Reply 'defaults' to accept all recommended choices"`

**Example block:**

```
Before I start, a few quick questions:

1. **Scope?**
   a) Only the requested function **(default)**
   b) Refactor any touched code
   c) Not sure — use default

2. **Framework target?**
   a) Match existing project **(default)**
   b) Specify: ___

3. **Test coverage?**
   a) None needed **(default)**
   b) Unit tests alongside
   c) Full integration test

Reply with numbers and letters (e.g., `1a 2a 3b`) or `defaults` to proceed with all defaults.
```

---

## Three-Stage Context Gathering (for complex tasks)

Use this when a task is substantial enough that getting it wrong = significant wasted work. Borrowed from Anthropic's doc-coauthoring skill.

### Stage 1: Initial Questions (meta-context)

Ask 3-5 questions about the big-picture framing before touching the content:

- What type of deliverable is this? (spec, code, doc, design, plan)
- Who's the audience / consumer of this output?
- What's the definition of done — what would make this clearly successful?
- Are there constraints (framework, format, performance bar, audience knowledge level)?
- Is there an existing template or precedent to follow?

Tell the user they can answer in shorthand. Offer: "Or just dump your context and I'll ask follow-ups."

### Stage 2: Info Dump + Follow-up

After initial answers, invite a full brain dump:

> "Dump everything you know about this — background, prior decisions, constraints, blockers, opinions. Don't organize it, just get it out."

Then ask targeted follow-up questions based on gaps in what they provided. Aim for 5-10 numbered follow-ups. Users can use shorthand (e.g., "1: yes, 2: see previous context, 3: no").

**Exit condition for Stage 2:** You understand the objective, the constraints, and at least one clear definition of success.

### Stage 3: Confirm Interpretation, Then Proceed

Restate the requirements in 1-3 sentences before starting work:

> "Here's my understanding: [objective in one sentence]. [Key constraint]. [What done looks like]. Starting now — let me know if anything's off."

---

## Reader Test (for deliverables)

When the deliverable is substantial (a plan, a document, a design decision), test it with a fresh context before handing it to the user.

**How:** Invoke a sub-agent or fresh prompt with only the deliverable (no conversation history) and ask:

- "What is this about?"
- "What are the key decisions made here?"
- "What's missing or unclear?"

If the fresh read surfaces gaps the user would have found, fix them first.

**When to use:** After generating complex plans, multi-section documents, architecture decisions, or any output that will be read by someone without conversation context.

---

## Clarification Anti-Patterns

Avoid these:

| Anti-pattern                         | Problem                                                      |
| ------------------------------------ | ------------------------------------------------------------ |
| Asking everything upfront            | Overwhelms users; many questions are answerable by inference |
| Asking about things you can discover | Read the file/repo before asking about it                    |
| No default options                   | Forces users to reason through every option                  |
| Open-ended questions without choices | High friction; users don't know the option space             |
| Not restating interpretation         | User doesn't know what you understood                        |
| Asking the same question twice       | Signals you didn't read the answer                           |
| Asking about reversible decisions    | Just pick one and move; it can be changed                    |

---

## Decision: Which Pattern to Use

```
Is the task clear and unambiguous?
  → YES: Proceed. State assumptions inline if any.
  → NO: Is missing info discoverable by reading files/code?
    → YES: Read first, then proceed or ask a single targeted question.
    → NO: Is this a quick task where wrong interpretation is cheap?
      → YES: Proceed with stated assumptions, invite correction.
      → NO: Use the 1-5 Question Rule or Three-Stage Context Gathering.
```

Use Three-Stage context gathering only for substantial deliverables (docs, plans, architecture, complex features). For code tasks, the 1-5 question rule is usually sufficient.
