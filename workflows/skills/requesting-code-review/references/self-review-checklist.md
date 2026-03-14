# Self-Review Checklist

## Overview

Self-review is the highest-ROI activity in the code review process. Catching your own mistakes before requesting review builds trust, reduces review cycles, and trains your eye for quality. This checklist is designed to be completed in 10-15 minutes on a typical PR before assigning reviewers.

## Before You Start

- [ ] Close your IDE and review the diff in the PR interface (GitHub, GitLab, etc.) — you will see the code differently in a new context.
- [ ] Read your own PR description — does it make sense to someone without your context?
- [ ] Check the file list — are there any files that should not be in this PR (debug logs, unrelated changes, generated files)?

## Diff Review

### Accidental Inclusions

- [ ] No `console.log`, `print()`, `debugger`, or `binding.pry` statements left in
- [ ] No commented-out code that should be deleted
- [ ] No TODO comments without a linked issue
- [ ] No unrelated formatting changes mixed with functional changes
- [ ] No accidental file permission changes
- [ ] No secrets, API keys, or credentials in the diff
- [ ] No large binary files or data files committed accidentally
- [ ] `.gitignore` has not been weakened to include files that should be excluded

### Completeness

- [ ] Every changed behavior has a corresponding test
- [ ] Error paths return appropriate status codes and messages
- [ ] New API endpoints are documented (OpenAPI, README, or inline)
- [ ] New environment variables are documented and have defaults
- [ ] Database migrations have corresponding rollback migrations
- [ ] New dependencies are justified and pinned to a version

### Correctness

- [ ] Variable names accurately describe their contents
- [ ] Function signatures match their documented behavior
- [ ] Edge cases are handled: null, empty, zero, negative, maximum
- [ ] Async operations are properly awaited (no floating promises)
- [ ] Resources are cleaned up in error paths (connections, file handles, locks)
- [ ] Loop invariants are correct (off-by-one, empty collection, infinite loop)

### Security

- [ ] User input is validated before use
- [ ] SQL queries use parameterized statements (no string concatenation)
- [ ] HTML output is escaped or uses auto-escaping templates
- [ ] Authentication checks are present on protected endpoints
- [ ] Authorization checks verify the user can access the specific resource
- [ ] Sensitive data is not logged or exposed in error messages

### Performance

- [ ] No N+1 query patterns (queries inside loops)
- [ ] Large result sets are paginated
- [ ] Expensive operations are not repeated unnecessarily
- [ ] New database queries use appropriate indexes (check with EXPLAIN)
- [ ] Frontend changes do not add unnecessary re-renders or large bundle size

## Commit History Review

- [ ] Commits tell a logical story when read in order
- [ ] Each commit compiles and passes tests independently
- [ ] Commit messages are descriptive (not "fix", "wip", "stuff")
- [ ] No fixup commits that should be squashed into their parent
- [ ] Merge commits are clean (no accidental conflict resolution artifacts)

## PR Metadata Review

- [ ] Title is concise, imperative mood, under 72 characters
- [ ] Description includes What, Why, and How
- [ ] Related issues are linked with closing keywords (Fixes #123)
- [ ] Labels are applied (bug, feature, refactor, etc.)
- [ ] Milestone or sprint is set if required by team process
- [ ] Draft status is correct (draft for early feedback, ready for final review)

## Test Review

- [ ] All new tests pass locally
- [ ] Tests cover the happy path and at least one error path
- [ ] Tests are deterministic (no time-dependent or order-dependent)
- [ ] Test names describe the behavior being tested, not the implementation
- [ ] Mocks are realistic and match the real API contract
- [ ] No tests were deleted without explanation

## Visual Review (UI Changes Only)

- [ ] Before/after screenshots are attached to the PR
- [ ] UI renders correctly at common breakpoints (mobile, tablet, desktop)
- [ ] Interactive elements are keyboard-accessible
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text)
- [ ] Loading states and error states are handled
- [ ] Text is not truncated or overflowing

## Final Check

- [ ] CI pipeline passes (do not request review with failing CI)
- [ ] Branch is up to date with the target branch (no stale conflicts)
- [ ] The change is complete — no "I will fix this in a follow-up" without a linked issue
- [ ] You can explain every line of the diff if asked

## When Self-Review Finds Issues

If self-review reveals problems:

1. **Fix them before requesting review** — do not rely on reviewers to catch issues you already found.
2. **Add inline PR comments** on decisions that might look wrong but are intentional — this prevents reviewers from flagging the same things.
3. **Update the PR description** if the fix changed the approach or introduced new limitations.
4. **Reset the review if you push significant changes** — reviewers should not approve a diff that changed substantially after their review.

## Time Budget

| PR Size           | Self-Review Time | When to Spend More |
|-------------------|------------------|--------------------|
| Small (<50 lines) | 5 minutes        | Security-sensitive changes |
| Medium (50-200)   | 10 minutes       | Multiple files, new APIs |
| Large (200-500)   | 15-20 minutes    | Always — large PRs need thorough self-review |
| Very large (500+) | 20-30 minutes    | Consider splitting the PR instead |

Self-review time is never wasted. Every issue you catch yourself is a review cycle you did not need, a reviewer interaction you did not wait for, and trust you built for the next review.
