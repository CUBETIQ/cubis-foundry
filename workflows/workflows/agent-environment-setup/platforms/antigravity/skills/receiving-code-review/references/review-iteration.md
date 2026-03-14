# Review Iteration

## Overview

Efficient review iteration minimizes the number of round trips between author and reviewer while ensuring all feedback is properly addressed. The goal is to merge a high-quality change in 1-2 review cycles rather than 4-5.

## The Iteration Cycle

```
Review received
  → Read ALL comments (don't react yet)
  → Categorize: blocking / non-blocking / questions / praise
  → Address all blocking items first
  → Batch non-blocking fixes together
  → Respond to every comment
  → Push all changes in one update
  → Re-request review with summary
```

## Batching Strategy

### Why Batch

Piecemeal updates cause problems:
- Each push triggers notifications, fragmenting reviewer attention
- Partial fixes can break the build or tests
- Reviewers can't tell if you're done or still making changes
- Comment threads become interleaved with code changes

### How to Batch

1. Read all feedback completely
2. Plan all changes before making any
3. Make all changes locally
4. Run tests locally to verify nothing is broken
5. Push everything in a single force-push or commit set
6. Respond to all comments at once
7. Re-request review as the final action

### Exception: Quick Clarifications

It's fine to respond to questions immediately (without code changes) to unblock the reviewer's understanding. Just don't push code until everything is ready.

## Commit Strategies for Iterations

### Fixup Commits (Recommended)

Create separate commits for each piece of feedback:
```
fix: add enum validation for notification channels (review feedback)
fix: wrap batch update in transaction (review feedback)
fix: standardize naming to preferences (review feedback)
```

Benefits:
- Reviewers can see exactly what changed per comment
- Easy to verify each piece of feedback was addressed
- Can be squashed before merge

### Amend + Force Push

Rewrite the original commits to incorporate feedback:

Benefits:
- Clean commit history
- No "fix review feedback" commits in the log

Drawbacks:
- Reviewers must re-review the entire diff (can't see just the changes)
- Use only when the reviewer requests it or when changes are extensive

## Re-Review Request Template

After addressing all feedback:

```markdown
## Changes in this iteration

### Blocking fixes
- [x] Added enum validation for channels (#comment-1) — abc1234
- [x] Wrapped batch update in transaction (#comment-3) — def5678

### Non-blocking fixes
- [x] Replaced SELECT * with column list (#comment-2)
- [x] Standardized naming to `preferences` (#comment-4)

### Deferred
- Rate limiting → tracked in #247 (#comment-5)

### Tests
- Added test for invalid channel rejection
- Added test for partial batch failure rollback

Ready for re-review. All blocking issues addressed with tests.
```

## Reducing Review Cycles

### Cycle 1: First Review

Goal: Address all blocking feedback. If possible, also fix non-blocking items.

Typical outcome: 2-4 blocking items, 3-6 non-blocking items.

### Cycle 2: Follow-Up Review

Goal: Verify fixes and address any new issues that emerged from the changes.

Typical outcome: 0-1 new blocking items, 1-2 clarifications.

### Cycle 3+: Escalation Signal

If you're in cycle 3 or beyond, something is wrong:
- The PR scope is too large — consider splitting
- There's a fundamental design disagreement — escalate to synchronous discussion
- Requirements are unclear — pause the PR and clarify with stakeholders

## Stale Review Recovery

When a PR has been in review for more than 3 days:

1. Rebase on the latest main branch
2. Resolve any conflicts
3. Re-run all tests
4. Post a comment: "Rebased and resolved conflicts. All tests passing. Ready for re-review."
5. If the reviewer is unresponsive, find an alternate reviewer

## Metrics for Review Efficiency

Track these to improve over time:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Review cycles to merge | ≤ 2 | Count re-review requests per PR |
| Time from review to response | < 4 hours | Timestamp between review and first response |
| Blocking comments per PR | Trending down | Count blocking comments over time |
| Repeated feedback themes | 0 repeats | Track if same feedback appears across PRs |

If blocking comments per PR is trending down over months, you're learning from review feedback effectively.
