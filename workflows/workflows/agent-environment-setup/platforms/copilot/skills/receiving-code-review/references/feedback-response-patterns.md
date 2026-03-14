# Feedback Response Patterns

## Overview

Different types of review feedback require different response strategies. Using the right pattern prevents misunderstandings, reduces review cycles, and maintains productive working relationships.

## Response Templates by Feedback Type

### Blocking Feedback (Must Fix)

**Pattern:** Acknowledge → Fix → Verify

```
"Good catch — [restate the issue]. Fixed in [commit SHA]. I also added
a test for [specific scenario] to prevent regression."
```

When to use: Bugs, security issues, correctness problems, missing error handling.

Key principle: Never argue with blocking feedback about correctness. If the reviewer found a bug, fix it and thank them.

### Suggestion Feedback (Could Improve)

**Pattern:** Evaluate → Decide → Explain

```
"Thanks for the suggestion. I [adopted it / went with a variation / deferred it]
because [specific reasoning]. [If deferred:] Created issue #N to track this."
```

When to use: Refactoring ideas, alternative approaches, performance optimizations.

Key principle: You can decline suggestions with good reasoning. The key is explaining why, not just saying no.

### Clarification Request

**Pattern:** Answer → Show → Offer Context

```
"This [code/approach] works by [explanation]. I added an inline comment
to make this clearer for future readers. See [file:line]."
```

When to use: "Why did you...?", "What does this do?", "Is this intentional?"

Key principle: If a reviewer is confused, future readers will be too. Add a comment.

### Nitpick/Style Feedback

**Pattern:** Fix Quickly → Move On

```
"Done." or "Fixed — good eye."
```

When to use: Naming, formatting, import ordering, minor style issues.

Key principle: Don't debate nitpicks. Fix them immediately and save energy for substantive discussions.

### Positive Feedback

**Pattern:** Thank → Elaborate (optional)

```
"Thanks! [Optional: brief context about why you chose this approach]."
```

When to use: Compliments, "nice!" comments, approval comments.

Key principle: Acknowledge praise briefly. Don't over-explain.

## Anti-Patterns to Avoid

### The Defensive Response

Bad: "It works fine on my machine." / "That's not what the ticket says."

Why it fails: Signals that you're protecting ego rather than improving code. Reviewers stop giving honest feedback.

Fix: Assume good intent. Restate the concern to confirm understanding before responding.

### The Silent Fix

Bad: Pushing changes without responding to comments.

Why it fails: Reviewers can't tell if you understood their feedback or just made a random change. They'll re-review more skeptically.

Fix: Always respond to the comment AND push the fix.

### The Scope Expander

Bad: "While I'm at it, I also refactored the entire module..."

Why it fails: Expanding scope during review makes the PR harder to review and delays merge.

Fix: Create follow-up issues for good ideas that are out of scope.

### The Passive Resolver

Bad: Marking comments as "resolved" without addressing them.

Why it fails: Hides unfinished work and destroys reviewer trust.

Fix: Only resolve after genuinely addressing the feedback.

## Tone Guidelines

- **Use "we" language** — "We should probably add a test" not "You're wrong"
- **Assume good intent** — reviewers are trying to improve the code, not attack you
- **Be specific** — "Fixed in abc123" not "Fixed"
- **Stay professional** — avoid sarcasm, passive aggression, or dismissiveness
- **Separate ego from code** — the review is about the code, not about you
