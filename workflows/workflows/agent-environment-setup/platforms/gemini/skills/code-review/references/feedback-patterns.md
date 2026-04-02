# Feedback Patterns

## Overview

The way review feedback is written determines whether it leads to improvement or resentment. Good feedback is specific, actionable, and respectful. This reference provides patterns for common feedback scenarios.

## The WHAT-WHY-HOW Pattern

Every piece of feedback should answer three questions:

1. **WHAT** — What is the issue? Be specific about the line, function, or pattern.
2. **WHY** — Why does it matter? Connect to a real consequence (bug, security, performance, maintainability).
3. **HOW** — How should it be fixed? Provide a concrete suggestion or code example.

### Example: Good feedback

> **WHAT**: The `findUser` function catches all exceptions and returns null.
>
> **WHY**: This swallows database connection errors, making them appear as "user not found." A real outage would be invisible until users report they cannot log in.
>
> **HOW**: Catch only `RecordNotFoundError` and let other exceptions propagate. Alternatively, return a Result type that distinguishes "not found" from "error."

### Example: Bad feedback

> "This error handling looks wrong."

The bad example gives the author no information about what is wrong, why it matters, or how to fix it. It creates a back-and-forth that wastes both people's time.

## Severity Labels

Categorize every comment with a severity label to set clear expectations.

### Blocking (must fix before merge)

Use for: correctness bugs, security vulnerabilities, data loss risks, missing tests for critical paths.

Format:
> **[Blocking]** SQL injection via string interpolation in the user query. Use parameterized queries: `db.query('SELECT * FROM users WHERE id = $1', [userId])`.

### Suggestion (should fix, does not block merge)

Use for: performance improvements, better abstractions, missing error messages, additional test cases.

Format:
> **[Suggestion]** This query runs inside a loop, creating an N+1 pattern. Consider using `Promise.all` with a batch query for better performance.

### Nit (optional, take it or leave it)

Use for: style preferences, naming alternatives, minor readability improvements.

Format:
> **[Nit]** `processData` is generic — `normalizeUserInput` would be more descriptive. Feel free to ignore.

## Tone Guidelines

### Use collaborative language

| Instead of                          | Write                                          |
|-------------------------------------|-------------------------------------------------|
| "You should..."                     | "Consider..." or "What about..."               |
| "This is wrong."                    | "This will cause X because Y."                 |
| "Why did you do this?"              | "I'm curious about the reasoning here."        |
| "Don't use X."                      | "X can lead to Y. Z is safer because..."       |
| "This is obviously broken."         | "This will fail when [specific scenario]."     |

### Ask questions when uncertain

If you are not sure something is wrong, ask rather than assert:

> "Is there a reason this uses `var` instead of `const`? In the rest of the codebase we use `const` by default."

This gives the author a chance to explain their reasoning. Sometimes the reviewer is wrong.

### Avoid possessive language

Say "the code" or "this function," not "your code" or "your function." Depersonalizing feedback makes it easier to receive.

### Include positive feedback

Every review should include at least one specific, genuine positive callout:

> "The error handling in the webhook processor is thorough — catching each provider-specific error separately with clear logging is exactly right."

Avoid generic praise ("looks good") — it reads as performative. Be specific about what was done well and why.

## Common Feedback Scenarios

### The architecture is wrong

Do not write 50 line-level comments. Instead, write one high-level comment:

> **[Blocking]** I think the overall approach here needs discussion before we continue line-level review. The PR adds a new REST endpoint, but the existing pattern for real-time data is WebSocket subscriptions. Should we be consistent with the existing pattern, or is there a reason to use REST here? Happy to discuss in a quick call.

### The PR is too large

> "This PR touches 800 lines across 15 files. Could we split it into smaller PRs? For example, the database migration could be one PR, the API changes another, and the frontend updates a third. This would make each PR easier to review and safer to deploy."

### The author keeps making the same mistake

Address it once in the PR, then follow up offline:

> **[Suggestion]** This is the third PR where we've caught missing input validation. Would it help to add a validation middleware that runs automatically on all endpoints? I can pair with you on setting that up.

### You disagree with the approach but it works

If the code is correct, readable, and follows conventions, do not block on personal preference:

> **[Comment]** I would have used a strategy pattern here instead of the switch statement, but the current approach is readable and works. No change needed — just sharing an alternative for future reference.

## Anti-Patterns

### The ghost approval

Approving without reading the code. This provides zero value and creates a false sense of security.

### The nitpick avalanche

20 comments about formatting, naming, and style. This is demoralizing and should be automated with linters.

### The rewrite request

Leaving so many comments that the author would need to rewrite the entire PR. If the approach is fundamentally wrong, say so in one comment and discuss the alternative.

### The delayed review

Reviewing 3 days after submission. The author has context-switched, the branch is stale, and new conflicts have appeared.

### The passive-aggressive question

"Did you even test this?" — always assume good intent. Ask: "How was this tested? I want to make sure the edge case in line 42 is covered."
