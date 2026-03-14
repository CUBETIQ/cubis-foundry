# Example: Batch Review Triage and Prioritization

## Scenario

A senior developer has 6 PRs in their review queue on a Monday morning. They need to prioritize and allocate review time effectively.

## User Prompt

> I have these PRs to review today. Help me prioritize and allocate my time:
>
> 1. PR #340: Add Stripe webhook handler for subscription renewals. 200 lines, billing service.
> 2. PR #341: Update ESLint config to add new rules. 30 lines, config only.
> 3. PR #342: Fix race condition in job queue worker. 45 lines, touches Redis pub/sub.
> 4. PR #343: Add dark mode support to the dashboard. 400 lines, frontend only.
> 5. PR #344: Migrate user sessions from JWT to database-backed sessions. 300 lines, auth middleware.
> 6. PR #345: Add unit tests for the notification service. 180 lines, tests only.

## Expected Response

### Risk Assessment

| PR  | Risk Level | Domain     | Review Depth | Estimated Time |
|-----|------------|------------|--------------|----------------|
| #344 | Critical  | Auth       | Deep         | 45 min         |
| #340 | High      | Billing    | Deep         | 30 min         |
| #342 | High      | Infra      | Thorough     | 20 min         |
| #343 | Medium    | Frontend   | Standard     | 25 min         |
| #345 | Low       | Tests      | Focused      | 15 min         |
| #341 | Low       | Config     | Quick        | 5 min          |

### Recommended Review Order

**1. PR #344 — Session migration (Critical, 45 min)**

This PR changes the authentication foundation. A bug here locks out all users or creates session hijacking vectors. Review checklist:
- Verify old sessions are migrated or gracefully invalidated.
- Check session storage security (encryption at rest, secure cookie flags).
- Verify logout actually destroys the server-side session.
- Check for session fixation vulnerabilities.
- Confirm rollback strategy exists (can you revert to JWT if needed?).

**2. PR #340 — Stripe webhook (High, 30 min)**

Financial transactions require zero tolerance for bugs. Review checklist:
- Verify webhook signature validation (Stripe signing secret).
- Check idempotency handling (webhooks can be delivered multiple times).
- Verify error handling does not silently drop failed renewals.
- Check that subscription state transitions are valid.
- Confirm logging captures enough detail for financial auditing.

**3. PR #342 — Race condition fix (High, 20 min)**

Concurrency bugs are subtle and hard to reproduce. Review checklist:
- Understand the race condition (ask author to explain in PR description if not clear).
- Verify the fix addresses the root cause, not just a symptom.
- Check for new race conditions introduced by the fix.
- Verify Redis operations use appropriate atomicity (MULTI/EXEC or Lua scripts).
- Check if a test reproduces the race condition.

**4. PR #343 — Dark mode (Medium, 25 min)**

Large frontend PR but low risk. Review focus:
- Check for accessibility (contrast ratios, WCAG compliance).
- Verify theme toggle persists across sessions.
- Spot-check a few components rather than reviewing all 400 lines.
- Check for CSS specificity issues or !important overuse.

**5. PR #345 — Notification tests (Low, 15 min)**

Tests only — low risk but ensure test quality:
- Verify tests cover meaningful behavior, not implementation details.
- Check that assertions are specific (not just "no error thrown").
- Confirm mocks are realistic and not masking real issues.

**6. PR #341 — ESLint config (Low, 5 min)**

Config change, quick review:
- Verify new rules do not conflict with existing codebase.
- Check that CI passes with the new rules.
- Approve quickly to unblock the author.

### Time Budget

Total estimated: 2 hours 20 minutes. If time is constrained to 1 hour, review #344 and #340 today, delegate #342 to another reviewer with Redis expertise, and schedule the rest for tomorrow.

## Why This Response Works

- Provides a concrete risk assessment table with time estimates.
- Orders PRs by risk, not by PR number or submission time.
- Gives specific review checklists tailored to each PR's domain.
- Includes a time-constrained fallback plan for limited availability.
- Identifies delegation opportunities based on domain expertise.
