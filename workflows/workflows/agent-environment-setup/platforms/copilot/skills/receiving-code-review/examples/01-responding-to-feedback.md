# Example: Responding to Review Feedback on a Feature PR

## Context

A developer submitted a PR adding a user notification preferences API. The reviewer left 6 comments covering a range of feedback types. The developer needs to categorize, respond to, and address all feedback.

## Reviewer Comments

1. "The `updatePreferences` endpoint doesn't validate that the notification channels are valid enum values. A user could POST `channel: 'pigeon'` and it would be stored."
2. "This SQL query in `getPreferences` is doing a SELECT * — we should only select the columns we need."
3. "The error handling in the batch update doesn't roll back partial changes if one preference fails. This could leave the user in an inconsistent state."
4. "Nit: `prefs` is used in some places and `preferences` in others. Pick one and be consistent."
5. "Should we add rate limiting to the preferences endpoint? Users could hammer it."
6. "The test coverage for the happy path is solid."

## Skill Response

### Feedback Categorization

| # | Comment | Type | Priority | Action |
|---|---------|------|----------|--------|
| 1 | Missing enum validation | Blocking | High | Fix: add Zod enum validation |
| 2 | SELECT * usage | Non-blocking | Medium | Fix: specify column list |
| 3 | No rollback on partial failure | Blocking | High | Fix: wrap in transaction |
| 4 | Inconsistent naming | Non-blocking | Low | Fix: standardize to `preferences` |
| 5 | Rate limiting question | Discussion | Medium | Defer: create follow-up issue |
| 6 | Positive feedback on tests | Acknowledgment | — | Thank reviewer |

### Response Plan

**Blocking fixes (do first):**
- Comment 1: Add Zod schema with `z.enum(['email', 'sms', 'push', 'in-app'])` validation to the request body. Add test for invalid channel rejection.
- Comment 3: Wrap the batch update in a database transaction with rollback on any individual failure. Add test for partial failure scenario.

**Non-blocking fixes (batch together):**
- Comment 2: Replace `SELECT *` with explicit column list. Minor performance improvement.
- Comment 4: Rename all `prefs` occurrences to `preferences` for consistency.

**Discussion items:**
- Comment 5: Rate limiting is a good idea but out of scope for this PR. Create issue #247 to track it. Respond: "Great point — I've created #247 to add rate limiting. I'd rather not expand this PR's scope but agree it should be done soon."

**Acknowledgment:**
- Comment 6: "Thanks! I spent extra time on the happy path tests to make sure the preference merge logic was well-covered."

### Re-Review Request

After pushing all changes:

> All feedback addressed in fixup commits:
> - `fix: add enum validation for notification channels` (comment 1)
> - `fix: wrap batch update in transaction` (comment 3)
> - `fix: select specific columns in getPreferences` (comment 2)
> - `fix: standardize naming to preferences` (comment 4)
>
> Created follow-up issue #247 for rate limiting (comment 5).
> Ready for re-review — the two blocking issues are fixed with tests.
