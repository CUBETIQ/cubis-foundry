# Team Review Practices

## Overview

Code review is a team practice, not an individual one. The team's review culture — how quickly reviews happen, how feedback is given, and how disagreements are resolved — determines whether reviews accelerate or bottleneck development.

## Review Culture Principles

### 1. Reviews are a first-class activity

Review time is not "overhead" that takes away from "real work." Treat review time as equivalent to coding time in sprint planning, stand-ups, and performance reviews.

**Practice**: Block 1-2 hours daily for reviews. Do not treat them as interruptible filler between coding sessions.

### 2. Speed matters more than thoroughness

A good-enough review done in 4 hours is more valuable than a perfect review done in 3 days. Stale PRs create merge conflicts, context loss, and frustration.

**Practice**: Set a team SLA of 4 business hours for first response. Track review turnaround time as a team metric.

### 3. Feedback is about the code, not the person

Use "the code" not "your code." Focus on consequences, not blame. Assume the author had good reasons for their choices.

**Practice**: Adopt the WHAT-WHY-HOW feedback pattern. Train new reviewers on constructive feedback.

### 4. Approval means "I believe this is safe to deploy"

Do not approve code you have not reviewed. If you cannot review it in time, say so and suggest another reviewer.

**Practice**: Use "Comment" when you have partial feedback but cannot complete the review. Use "Approve" only when you are confident.

### 5. Authors own the final decision

Unless there is a blocking issue (bug, security, data loss), the author decides whether to accept suggestions. Different approaches are acceptable as long as they meet quality standards.

**Practice**: Mark non-blocking feedback clearly. Do not re-request changes on items you marked as suggestions.

## Team Workflow

### Review Assignment

#### CODEOWNERS-based (recommended)

Assign reviewers automatically based on file paths. This ensures domain experts review changes to their areas.

```
# .github/CODEOWNERS
src/auth/           @alice @bob
src/billing/        @carol @dave
src/api/            @backend-team
src/ui/             @frontend-team
```

**Pros**: Consistent, automatic, ensures domain expertise.
**Cons**: Creates bottlenecks if owners are unavailable.

#### Round-robin

Distribute reviews evenly across the team using GitHub's automatic assignment.

**Pros**: Fair distribution, cross-pollination of knowledge.
**Cons**: Reviewers may lack domain context.

#### Author-selected

Authors choose their reviewer based on context.

**Pros**: Authors pick the most relevant reviewer.
**Cons**: Leads to reviewer concentration (everyone picks the same senior dev).

#### Hybrid (recommended)

Use CODEOWNERS for automatic assignment. Allow authors to add additional reviewers for specific context. Rotate secondary reviewers for knowledge sharing.

### Review SLAs

| Urgency     | First Response | Complete Review | Escalation              |
|-------------|----------------|-----------------|-------------------------|
| Hotfix      | 30 minutes     | 2 hours         | Page on-call reviewer   |
| Blocking    | 2 hours        | 4 hours         | Slack @channel           |
| Normal      | 4 hours        | 24 hours        | Reminder after 8 hours  |
| Low priority| 24 hours       | 48 hours        | Reminder after 24 hours |

### Stale PR Protocol

1. **Day 1**: PR is opened, reviewer is assigned automatically.
2. **Day 1 + 4 hours**: If no response, PR bot sends a reminder.
3. **Day 2**: If no response, author pings the reviewer directly.
4. **Day 3**: If still no response, author reassigns to a different reviewer and notifies the team lead.
5. **Day 5**: Any PR without a review is escalated in the team retrospective.

## Handling Disagreements

### The 10-minute rule

If a code review discussion exceeds 3 rounds of back-and-forth without resolution, switch to a synchronous conversation (call or in-person). Async debate has diminishing returns after 3 exchanges.

### Decision framework

When reviewer and author disagree:

1. **Is there a correctness issue?** — The reviewer's concern takes precedence. Bugs must be fixed.
2. **Is there a security issue?** — The reviewer's concern takes precedence. Security cannot be deferred.
3. **Is it a design choice?** — Discuss, but the author decides. The author will maintain the code.
4. **Is it a style preference?** — The author decides, or defer to the linter. Style debates do not belong in reviews.
5. **Is it an architectural decision?** — Escalate to the team or tech lead. Architecture decisions affect everyone.

### When to seek a third opinion

- The disagreement is about architecture or design (not style).
- Both parties have valid points and neither will yield.
- The discussion has become emotional or personal.
- The change affects other teams or systems.

## Onboarding New Reviewers

### Week 1: Shadow reviews

The new reviewer reads PRs and writes practice review comments in a private document. A senior reviewer provides feedback on the practice reviews.

### Week 2: Co-reviews

The new reviewer posts actual review comments alongside a senior reviewer. The senior reviewer provides feedback on comment quality, tone, and coverage.

### Week 3: Solo reviews with oversight

The new reviewer conducts reviews independently. A senior reviewer spot-checks their reviews weekly for the first month.

### Review quality checklist for new reviewers

- [ ] Did I read the PR description before the code?
- [ ] Did I check for security issues (input validation, auth, injection)?
- [ ] Did I verify error handling?
- [ ] Did I check for test coverage?
- [ ] Is my feedback specific and actionable (WHAT-WHY-HOW)?
- [ ] Did I categorize by severity (blocking, suggestion, nit)?
- [ ] Did I include at least one positive callout?
- [ ] Is my tone collaborative and respectful?

## Metrics

### What to track

| Metric              | Target         | Why it matters                                            |
|---------------------|----------------|-----------------------------------------------------------|
| Review turnaround   | < 4 hours      | Slow reviews block the team and cause merge conflicts.    |
| PR cycle time       | < 24 hours     | Time from open to merge. Indicates overall flow health.   |
| Review comment rate | 2-5 per PR     | Too low = rubber-stamping. Too high = nitpicking.         |
| PRs per reviewer    | Even distribution | Concentrated reviews create bus factor risk.             |
| Rework rate         | < 20%          | High rework means reviews are catching too late or feedback is unclear. |

### What NOT to track

- **Number of bugs caught** — incentivizes finding bugs, not preventing them.
- **Lines reviewed per hour** — incentivizes speed over quality.
- **Approval rate** — incentivizes rubber-stamping.

## Team Agreements Template

Document your team's review practices in a CONTRIBUTING.md or team wiki:

```markdown
## Code Review Agreement

### Turnaround
- First response within 4 business hours.
- Complete review within 24 hours.
- If you cannot review in time, say so and suggest a replacement.

### Feedback
- Use WHAT-WHY-HOW for all comments.
- Label severity: [Blocking], [Suggestion], [Nit].
- Include at least one positive callout per review.
- Assume good intent.

### Merge Policy
- 1 approval required (2 for auth, billing, infrastructure).
- All CI checks must pass.
- Squash merge by default.
- Author merges after approval.

### Disagreements
- 3 rounds max in comments, then sync call.
- Author decides on style and design.
- Security and correctness concerns take precedence.
- Architecture disagreements escalate to tech lead.
```
