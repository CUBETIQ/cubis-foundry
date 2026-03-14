# Disagreement Resolution

## Overview

Disagreements during code review are normal and often productive. The goal is not to avoid disagreement but to resolve it efficiently while preserving relationships and making the best technical decision.

## The Resolution Ladder

Escalate through these levels only as needed:

### Level 1: Async Discussion (Default)

Reply to the comment with your reasoning. Most disagreements resolve here.

**Template:**
```
"I see your point about [their concern]. I went with [your approach] because
[specific reasoning]. [Alternative proposal if applicable]. What do you think?"
```

Time limit: 2 comment rounds. If unresolved, escalate.

### Level 2: Synchronous Conversation

Schedule a 15-minute call or huddle. Voice communication resolves misunderstandings faster than text.

**Preparation:**
- Write down your position and their position
- Identify the specific technical trade-off
- Come with a willingness to be wrong

**After the call:** Summarize the decision in the PR comment thread so it's documented.

### Level 3: Third-Party Opinion

Bring in a third engineer for perspective. Choose someone with relevant domain expertise who isn't invested in either position.

**When to use:**
- Both positions are technically valid
- The disagreement is about architecture, not style
- The decision has long-term implications

### Level 4: Team Lead/Tech Lead Decision

If the team can't reach consensus, the tech lead makes the call.

**When to use:**
- Rarely. Most disagreements should resolve at Level 1-2.
- Only for decisions with significant architectural impact
- When the team is blocked and needs to move forward

## Disagreement Categories

### Style Disagreements

Example: "Use `forEach` vs `for...of`"

Resolution: Defer to the team's linter/style guide. If no guide exists, accept the reviewer's preference — style consistency matters more than personal preference.

### Design Disagreements

Example: "Use composition vs inheritance"

Resolution: Discuss trade-offs. Consider YAGNI, testability, and the team's familiarity with the pattern. Document the decision.

### Correctness Disagreements

Example: "This will cause a race condition" / "No it won't"

Resolution: Write a test that proves or disproves the claim. Code doesn't lie.

### Scope Disagreements

Example: "You should also handle the edge case where..." / "That's out of scope"

Resolution: If the edge case is a real risk, create a follow-up issue. If it's speculative, explain why it's deferred.

## Constructive Pushback Techniques

### The Evidence-Based Pushback

Present data, benchmarks, or references:
```
"I benchmarked both approaches. The current implementation handles
10K requests/sec while the suggested approach peaks at 6K due to
[specific bottleneck]. See benchmark results: [link]."
```

### The Trade-Off Acknowledgment

Show you understand both sides:
```
"Your approach is cleaner. The trade-off is [specific cost]. Given our
current requirements of [context], I think [your approach] is the better
fit because [reasoning]. Happy to revisit if requirements change."
```

### The Compromise Proposal

Offer a middle ground:
```
"What if we [alternative that addresses both concerns]? This gives us
[benefit from their suggestion] while preserving [benefit from your approach]."
```

### The Deferral with Issue

Accept the feedback but defer execution:
```
"That's a great improvement. It's a bigger change than I want to include
in this PR though — I've created #N to track it. Can we merge this as-is
and address it in the follow-up?"
```

## Red Lines: When NOT to Compromise

- **Security vulnerabilities** — never compromise on known security issues
- **Data integrity** — don't accept approaches that risk data loss or corruption
- **Legal/compliance** — regulatory requirements are non-negotiable
- **Team standards** — if the team decided on a standard, follow it

For everything else, be flexible. The best code is shipped code, and perfect is the enemy of good.
