# Writing Style Guide

Load this when establishing writing conventions, tone guidelines, or reviewing documentation for consistency and clarity.

## Core principles

1. **Write for the reader, not the writer.** The reader does not know what you know. Assume they are smart but lack your context.
2. **One idea per sentence.** Compound sentences with multiple clauses slow down comprehension, especially under stress (on-call, debugging).
3. **Active voice over passive voice.** "Run the migration script" beats "The migration script should be run."
4. **Imperative mood for instructions.** "Click the Deploy button" not "You should click the Deploy button."
5. **Concrete over abstract.** "Set `maxRetries` to 3" beats "Configure an appropriate retry count."

## Voice and tone

### Technical documentation tone

- **Direct**: State facts. Do not hedge ("This might possibly help with...").
- **Precise**: Use exact terms. "Returns a 404 status" not "Returns an error."
- **Neutral**: Do not inject humor into runbooks or API docs. A developer reading your docs at 2 AM during an incident needs clarity, not jokes.
- **Honest**: Document limitations and known issues. Hiding problems erodes trust.

### Audience-specific tone adjustments

| Audience | Tone | Example |
|---|---|---|
| API consumers | Professional, concise | "Authenticate with a Bearer token in the Authorization header." |
| On-call engineers | Urgent, step-focused | "Step 3: Restart the service. Expected: health check returns 200 within 30 seconds." |
| New hires | Welcoming, explanatory | "This service handles order processing. When a customer places an order, the flow starts here..." |
| Leadership | Outcome-focused, quantified | "The migration reduced p95 latency from 800ms to 120ms." |

## Sentence structure

### Do

```markdown
Run the migration script.
Verify that all tests pass.
Deploy to staging first.
```

### Do not

```markdown
First, you'll want to run the migration script, which will update the database
schema to match the latest version, and then you should verify that all the tests
pass before proceeding to deploy to the staging environment first.
```

### Sentence length guideline

- Ideal: 15-20 words per sentence.
- Maximum: 30 words. If a sentence exceeds 30 words, split it.
- Exception: code examples can be longer because they follow programming syntax, not prose rules.

## Formatting conventions

### Headings

- Use sentence case: "Configure the database" not "Configure The Database."
- Headings describe what the section covers, not what the reader should do.
- Limit to 3 heading levels (##, ###, ####). Deeper nesting signals the document needs restructuring.

### Code references

- Use backticks for inline code: `DATABASE_URL`, `npm install`, `users` table.
- Use fenced code blocks with language hints for multi-line code.
- Include the filename as a comment at the top of code blocks.

```typescript
// src/server/db.ts
import { PrismaClient } from "@prisma/client";
```

### Lists

- Use numbered lists for sequential steps.
- Use bullet lists for non-sequential items.
- Keep list items grammatically parallel.

**Parallel (good):**

- Install dependencies.
- Configure the database connection.
- Run the migration script.

**Not parallel (bad):**

- Install dependencies.
- The database connection needs to be configured.
- Running the migration script.

### Tables

Use tables for structured comparisons, parameter lists, or reference data.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `email` | string | Yes | User's email address |
| `name` | string | Yes | Display name (1-100 chars) |
| `role` | string | No | Default: `member` |

## Common mistakes

### Ambiguous pronouns

**Bad**: "The service calls the database and it returns an error." (What returns an error — the service or the database?)

**Good**: "The service calls the database. The database returns a connection timeout error."

### Weasel words

Remove these from technical docs:

- "Simply" / "Just" / "Easy" — what is easy for you may not be easy for the reader.
- "Obviously" / "Clearly" — if it were obvious, you would not be documenting it.
- "Should" (when you mean "must") — "The config file should contain..." vs "The config file must contain..."
- "Various" / "Several" — use specific numbers.

### Missing context for commands

**Bad:**

```bash
kubectl rollout restart deployment/api
```

**Good:**

```bash
# Restart the API deployment to pick up the new config map.
# This causes a rolling restart with zero downtime.
kubectl rollout restart deployment/api
```

## Technical writing checklist

Before publishing, verify:

1. Every code example is syntactically correct and tested.
2. Every link resolves to a valid page.
3. Every screenshot or diagram matches the current UI/architecture.
4. Prerequisites are listed before the first instruction step.
5. Abbreviations are expanded on first use.
6. The document has a clear title, last-updated date, and owner.
7. Someone unfamiliar with the system can follow the document from start to finish.

## Word choice reference

| Instead of | Use |
|---|---|
| utilize | use |
| in order to | to |
| due to the fact that | because |
| at this point in time | now |
| a large number of | many |
| in the event that | if |
| prior to | before |
| subsequent to | after |
| terminate | stop / end |
| initialize | start / create |
