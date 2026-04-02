# PR Review Checklist

## Reviewer responsibilities

Before approving, verify each area:

### Correctness

- [ ] Does the code do what the PR description says it does?
- [ ] Are edge cases handled (empty input, null, boundary values)?
- [ ] Are error states handled appropriately (not swallowed, not over-caught)?
- [ ] Does the logic match the linked issue or acceptance criteria?

### Security

- [ ] No secrets, tokens, or credentials in the code
- [ ] User input is validated and sanitized at system boundaries
- [ ] No SQL injection, XSS, or command injection vectors
- [ ] Auth checks are present for protected operations
- [ ] No PII logged or exposed in error messages

### Performance

- [ ] No N+1 queries or unbounded loops
- [ ] No unnecessary re-renders in UI components
- [ ] Large data sets are paginated, not loaded entirely
- [ ] Expensive operations are cached or debounced where appropriate

### Maintainability

- [ ] Code is readable without extensive comments
- [ ] Names are clear and consistent with codebase conventions
- [ ] No dead code, commented-out code, or TODO without tracking issue
- [ ] Test coverage exists for new behavior and critical paths

### Architecture

- [ ] Changes follow existing patterns in the codebase
- [ ] No unnecessary abstractions or premature generalization
- [ ] Dependencies are justified (not adding a library for one function)
- [ ] Public API surface changes are intentional and documented

## Review anti-patterns to avoid

- **Rubber-stamping**: approving without reading — undermines the entire review process.
- **Nitpicking style**: formatting fights belong in linters, not reviews.
- **Rewriting in review**: if the approach is fundamentally wrong, say so early — don't micro-edit via 50 comments.
- **Blocking on taste**: if the code works, is readable, and follows conventions, approve it even if you would have written it differently.
- **Delayed reviews**: review within 4 hours during business hours. Stale PRs kill velocity.

## When to request changes vs. comment

- **Request changes**: correctness bugs, security issues, missing tests for critical paths.
- **Comment (non-blocking)**: style suggestions, alternative approaches, minor improvements that can be done later.
- **Approve with comments**: minor nits that do not block merge.

## Stacked PR review

When PRs are stacked (PR 2 depends on PR 1):

1. Review PR 1 first. Approve and merge before deep-reviewing PR 2.
2. Reviewer should check the diff against the base branch, not the full stack.
3. Author should rebase the stack after each merge, not merge `main` into feature branches.
