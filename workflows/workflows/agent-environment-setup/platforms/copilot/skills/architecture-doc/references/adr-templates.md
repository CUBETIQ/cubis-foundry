# ADR Templates

Load this when writing or reviewing Architecture Decision Records, setting up ADR conventions for a new project, or choosing an ADR format.

## Standard ADR template

```markdown
# ADR-NNNN: [Short Decision Title]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-XXXX]

## Date

YYYY-MM-DD

## Context

[Describe the forces, constraints, and business requirements that make this
decision necessary. Include technical context, team constraints, timeline
pressure, and any regulatory requirements. A reader unfamiliar with the
project should understand WHY this decision is being made after reading
this section.]

## Decision

[State the decision clearly in one or two sentences. Use active voice:
"We will use X" rather than "X was chosen." Follow with implementation
details if needed.]

## Alternatives Considered

### Option A: [Name]
- **Pros**: [List specific advantages]
- **Cons**: [List specific disadvantages]
- **Rejected because**: [One-sentence reason]

### Option B: [Name]
- **Pros**: [List specific advantages]
- **Cons**: [List specific disadvantages]
- **Selected because**: [One-sentence reason] (if this is the chosen option)

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Trade-off 1]
- [Trade-off 2]

### Risks
- [Risk with mitigation or monitoring plan]

## Related Decisions

- [Link to related ADRs]
```

## Lightweight ADR template (Y-statements)

For smaller decisions that do not warrant a full ADR.

```markdown
# ADR-NNNN: [Title]

In the context of [situation],
facing [concern],
we decided to [decision],
to achieve [goal],
accepting [trade-off].
```

## ADR status lifecycle

```
Proposed -> Accepted -> [Deprecated | Superseded by ADR-XXXX]
```

- **Proposed**: Decision is under discussion. Not yet binding.
- **Accepted**: Decision is approved and binding. Implementation should follow.
- **Deprecated**: Decision is no longer relevant (technology removed, feature sunset).
- **Superseded**: A newer ADR replaces this one. Link to the successor.

## Numbering conventions

- Use zero-padded sequential numbers: ADR-0001, ADR-0002, etc.
- Never reuse numbers, even if an ADR is deprecated.
- Include the number in the filename: `0007-multi-tenant-isolation.md`.

## File organization

```
docs/
  architecture/
    decisions/
      0001-use-postgresql.md
      0002-api-gateway-pattern.md
      0003-event-driven-messaging.md
      index.md                      # Table of contents
```

The index file should contain:

```markdown
# Architecture Decision Log

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| 0001 | Use PostgreSQL as primary database | Accepted | 2025-01-15 |
| 0002 | API gateway pattern for service routing | Accepted | 2025-02-01 |
| 0003 | Event-driven messaging with RabbitMQ | Superseded by 0005 | 2025-02-15 |
```

## What makes a good ADR

### Context section

- Explains the problem, not just the solution.
- Includes quantitative data when available (traffic volume, team size, budget).
- Mentions constraints: timeline, team skills, regulatory requirements, existing infrastructure.
- A reader who joins the team in 6 months should understand the decision without asking questions.

### Decision section

- States the decision in one clear sentence.
- Uses active voice: "We will" not "It was decided."
- Includes enough implementation detail to be actionable but not so much that it becomes a design doc.

### Alternatives section

- Lists at least two alternatives (including the chosen option).
- Provides specific pros and cons, not generic statements.
- States why each rejected option was rejected in one sentence.
- Avoids straw-man alternatives that were never seriously considered.

### Consequences section

- Separates positive and negative consequences.
- Is honest about trade-offs rather than only listing benefits.
- Includes risks with mitigation plans.
- Mentions what will need to change if the decision is wrong.

## When to write an ADR

Write an ADR when the decision:

1. Affects the structure of the system (adding a service, choosing a database, changing communication patterns).
2. Is difficult or expensive to reverse.
3. Has been debated by the team (disagreement signals architectural significance).
4. Will be questioned by future team members.

Do NOT write an ADR for:

- Library version bumps (unless the upgrade changes API contracts).
- Code style decisions (use linter configuration instead).
- Tactical implementation choices that are easy to change.

## Review process

1. Author writes ADR in Proposed status and opens a pull request.
2. Reviewers comment on the PR, focusing on completeness of context and consequences.
3. After team consensus, status changes to Accepted and the PR is merged.
4. The ADR is immutable after merging. New decisions that override it create a new ADR with Superseded status on the old one.
