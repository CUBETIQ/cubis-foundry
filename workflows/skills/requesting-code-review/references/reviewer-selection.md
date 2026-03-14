# Reviewer Selection

## Overview

Selecting the right reviewers is as important as writing good code. The wrong reviewer wastes time — theirs and yours. The right reviewer catches issues you cannot see, provides feedback you can act on, and approves with confidence. This reference covers how to choose reviewers based on change characteristics, team composition, and practical constraints.

## Selection Criteria

### Domain Expertise

The most important factor. A reviewer who understands the domain can evaluate correctness, design, and edge cases that a generalist would miss.

| Change Area              | Look for Reviewer With                        |
|--------------------------|-----------------------------------------------|
| Authentication / Auth    | Security expertise, auth protocol knowledge   |
| Database / Migrations    | DBA knowledge, schema design experience       |
| Payment / Billing        | Financial systems experience, compliance awareness |
| Frontend / UI            | Component architecture, accessibility knowledge |
| Infrastructure / DevOps  | Deployment, scaling, observability experience  |
| API Design               | REST/GraphQL conventions, versioning experience|
| Performance              | Profiling experience, system design knowledge  |

### Recent Context

A reviewer who recently worked on the affected code has a mental model that makes review faster and more thorough. Check `git log` for recent authors of the files you changed.

**How to find context holders**:
- `git log --format='%an' -- path/to/file | sort | uniq -c | sort -rn` — most frequent authors
- `git log --since='3 months ago' --format='%an' -- path/to/file | head -5` — recent authors
- CODEOWNERS file — designated owners per path

### Availability and Workload

A qualified reviewer who is overloaded will delay your review or give it less attention. Consider:

- Current sprint workload and deadline pressure
- Number of PRs already in their review queue
- Time zone overlap for async review
- PTO or meeting-heavy days

**Practical rule**: If your first-choice reviewer has more than 3 pending reviews, assign someone else or explicitly negotiate timeline.

### Author Experience Level

Match reviewer seniority to the change risk:

| Author Level  | Change Risk | Recommended Reviewer         |
|---------------|-------------|------------------------------|
| Junior        | High risk   | Senior + domain expert       |
| Junior        | Low risk    | Mid-level peer               |
| Mid-level     | High risk   | Senior or domain expert      |
| Mid-level     | Low risk    | Any qualified peer           |
| Senior        | High risk   | Another senior or principal  |
| Senior        | Low risk    | Any qualified peer           |

## How Many Reviewers

### One reviewer (default)

- Standard feature work, bug fixes, refactoring
- The change is in a well-understood area
- The author is experienced with the codebase

### Two reviewers

- The change spans multiple domains (backend + frontend, API + database)
- The change touches security-sensitive areas
- The change is high-risk and benefits from independent perspectives

### Three or more reviewers (rare)

- Architecture changes affecting the entire system
- Public API changes with external consumers
- Compliance-sensitive changes requiring multiple sign-offs

**Warning**: More than 2 reviewers often causes diffusion of responsibility. Everyone assumes someone else will do the deep review. If you need 3+ reviewers, assign specific focus areas to each.

## Assigning Focus Areas

When using multiple reviewers, prevent duplicate effort by assigning focus areas:

```
@alice — Please review the database migration and query changes.
         Focus on: index performance, backward compatibility, rollback safety.

@bob   — Please review the API endpoint and request validation.
         Focus on: input validation, error handling, API contract consistency.
```

This pattern:
- Prevents reviewers from duplicating each other's effort
- Ensures every area gets reviewed by the most qualified person
- Makes the review request feel manageable rather than overwhelming

## CODEOWNERS Integration

If your repository uses a CODEOWNERS file, GitHub automatically suggests reviewers based on file paths. Use CODEOWNERS as a starting point, but override when:

- The CODEOWNER is on PTO or overloaded
- The change requires expertise the CODEOWNER does not have
- The CODEOWNER is a team alias and you need a specific individual

## When to Skip Review

Some changes do not need full review:

- **Automated dependency bumps** (Dependabot, Renovate) — review the changelog, not the lock file
- **Generated code** (protobuf, OpenAPI, GraphQL codegen) — review the source schema, not the output
- **Trivial fixes** — typo in a comment, fixing a broken link in docs

Even skip-review changes should go through CI and get a quick approval from someone for audit trail purposes.

## Communicating with Reviewers

### When requesting

- Tag the reviewer directly (not just assign in the UI)
- State the urgency and desired timeline
- Explain why you chose them specifically
- Specify the focus area and review depth

### Template for review request message

```
@reviewer I'd appreciate your review on this PR.

Focus: [specific area or concern]
Urgency: [blocking/normal/low priority]
Depth: [quick sanity check / standard / deep review]
Timeline: [ideally by when]

Key context: [one sentence about what this change does and why]
```

### When your reviewer is slow

1. Wait 24 hours (they may be busy)
2. Send a polite ping: "Hey, just checking if you've had a chance to look at PR #X"
3. If still no response after 48 hours, reassign with a note: "Reassigning to unblock — happy to add you back for a second pass"
4. Never escalate to management without first trying steps 1-3

## Anti-Patterns

### The rubber stamp

Assigning a reviewer who will approve without reading. This defeats the purpose of review.

### The bottleneck

Assigning the same senior engineer to every PR. They become a bottleneck and burn out.

### The punishment reviewer

Assigning the strictest reviewer to someone you are frustrated with. Reviews should improve code, not punish people.

### The crowd

Assigning 5 reviewers hoping someone will look at it. Assign 1-2 with clear expectations instead.

### The surprise assignment

Assigning someone without context or warning. Always communicate why you chose them and what you need.
