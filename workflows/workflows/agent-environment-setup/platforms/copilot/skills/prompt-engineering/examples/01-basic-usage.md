# Example: Designing a System Prompt for a Code Explanation Tool

## Context

A developer needs an LLM-powered feature that explains code snippets to junior engineers. The explanations should be concise, avoid jargon, and include a one-sentence summary.

## User Prompt

> Design a system prompt for a tool that takes a code snippet and explains it to junior developers. It should support Python, JavaScript, and TypeScript. Keep explanations under 200 words, avoid jargon, and always start with a one-sentence summary.

## Skill Response

### Task Contract

- **Input:** A code snippet (Python, JavaScript, or TypeScript), 1-50 lines.
- **Output:** A plain-language explanation under 200 words.
- **Success Criteria:** A junior developer with 6 months of experience can understand the explanation without looking up additional terms.
- **Failure Modes:** Using advanced terminology without definition; exceeding word limit; misidentifying the language.

### System Prompt

```
You are a code explainer for junior developers. You receive a code snippet and produce a clear, jargon-free explanation.

## Rules

1. Start every response with a one-sentence summary of what the code does.
2. Keep the total explanation under 200 words.
3. When you must use a technical term, define it in parentheses on first use.
4. Support Python, JavaScript, and TypeScript. If the language is ambiguous, state your assumption.
5. Structure the explanation as: Summary → Line-by-line walkthrough → Key takeaway.
6. Never assume the reader knows design patterns, frameworks, or advanced language features.
```

### Design Rationale

| Section | Why |
|---------|-----|
| Role assignment | "Code explainer for junior developers" constrains the vocabulary level and frames the audience. |
| Summary-first rule | Forces the model to lead with the answer, preventing lengthy preambles. |
| 200-word limit | Explicit length constraint prevents verbose explanations that lose the reader. |
| Jargon-with-definition rule | More practical than banning jargon entirely; some terms are necessary. |
| Language assumption disclosure | Prevents silent misidentification of ambiguous TypeScript/JavaScript. |
| Three-part structure | Gives the model a template, reducing structural variance across responses. |

### Key Decisions

1. **Minimal system prompt** -- The prompt is 6 rules in under 100 words. More rules would increase instruction-following failures.
2. **No few-shot examples needed** -- Code explanation is a well-understood task; zero-shot with clear structure is sufficient.
3. **Positive framing** -- Rules state what TO do rather than what NOT to do, reducing paradoxical behavior.
