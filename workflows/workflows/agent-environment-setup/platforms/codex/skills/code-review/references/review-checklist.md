# Code Review Checklist

## Overview

A systematic checklist ensures consistent review quality regardless of reviewer experience or time pressure. Use this checklist as a starting point and customize it for your team's specific needs.

## Before Reading Code

- [ ] Read the PR description — understand what and why before how.
- [ ] Check linked issues or specs — verify the PR addresses the stated requirement.
- [ ] Note the change size — PRs over 400 lines need extra scrutiny or should be split.
- [ ] Check the author's context — junior authors benefit from more detailed feedback.
- [ ] Review the file list — identify high-risk areas (auth, payments, data layer).

## Correctness

### Logic

- [ ] Does the code do what the PR description says it does?
- [ ] Are conditional branches (if/else, switch) correct and complete?
- [ ] Are loop boundaries correct (off-by-one, empty collections)?
- [ ] Are boolean expressions correct (De Morgan's law, operator precedence)?
- [ ] Are return values used correctly (not silently discarded)?

### Edge Cases

- [ ] Empty input (null, undefined, empty string, empty array, zero)
- [ ] Boundary values (MAX_INT, negative numbers, Unicode)
- [ ] Concurrent access (race conditions, double-submit)
- [ ] Network failures (timeout, partial response, connection reset)
- [ ] Large input (pagination needed? Memory bounded?)

### Error Handling

- [ ] Are errors caught at appropriate levels (not too broad, not too narrow)?
- [ ] Do error messages help debugging without leaking internals?
- [ ] Are errors logged with sufficient context (request ID, user context)?
- [ ] Are error states propagated to the caller correctly?
- [ ] Are resources cleaned up in error paths (connections, file handles)?

## Security

### Input Validation

- [ ] All external input is validated before use (request body, query params, headers).
- [ ] Validation happens at the system boundary, not deep in business logic.
- [ ] Input length limits are enforced to prevent DoS.
- [ ] File uploads are validated (type, size, content inspection).

### Injection

- [ ] No string concatenation in SQL queries — use parameterized queries.
- [ ] No string concatenation in HTML — use templating with auto-escaping.
- [ ] No string concatenation in shell commands — use argument arrays.
- [ ] No `eval()`, `new Function()`, or equivalent dynamic code execution.

### Authentication and Authorization

- [ ] Protected endpoints check authentication.
- [ ] Authorization checks verify the user can access the specific resource.
- [ ] No IDOR (Insecure Direct Object Reference) — resource access is scoped to the user.
- [ ] Sensitive operations require re-authentication or step-up auth.

### Data Protection

- [ ] No secrets, tokens, or API keys in the code.
- [ ] Passwords are hashed with bcrypt, argon2, or scrypt (not MD5/SHA).
- [ ] PII is not logged in application logs.
- [ ] Sensitive data in responses is filtered (no returning password hashes).
- [ ] HTTPS is enforced for all data in transit.

## Performance

### Database

- [ ] No N+1 queries (use eager loading, joins, or batch queries).
- [ ] Queries use appropriate indexes (check EXPLAIN plan for new queries).
- [ ] Large result sets are paginated (no unbounded SELECT *).
- [ ] Write operations use transactions where atomicity is needed.
- [ ] No unnecessary queries (cached data re-fetched, same query in a loop).

### Application

- [ ] No unbounded loops or recursion.
- [ ] Large data processing is chunked or streamed.
- [ ] Expensive operations are cached with appropriate TTL.
- [ ] Async operations do not block the event loop (Node.js) or main thread.
- [ ] Memory allocations are bounded (no growing arrays without limits).

### Frontend

- [ ] No unnecessary re-renders (check dependency arrays, memoization).
- [ ] Images and assets are lazy-loaded or optimized.
- [ ] Bundle size impact is acceptable (no large library for small utility).
- [ ] API calls are debounced or throttled where appropriate.

## Maintainability

### Readability

- [ ] Names are clear and consistent with codebase conventions.
- [ ] Functions are focused and do one thing well.
- [ ] Complex logic has explanatory comments (WHY, not WHAT).
- [ ] No magic numbers — use named constants.
- [ ] No dead code, commented-out code, or unreachable branches.

### Architecture

- [ ] Changes follow existing patterns in the codebase.
- [ ] No unnecessary abstractions or premature generalization.
- [ ] Dependencies are justified (not adding a library for one function).
- [ ] Public API surface changes are intentional and documented.
- [ ] The change does not create circular dependencies.

### Testing

- [ ] New behavior has tests (unit, integration, or E2E as appropriate).
- [ ] Edge cases identified during review have corresponding tests.
- [ ] Tests are deterministic (no flaky tests from timing or ordering).
- [ ] Test assertions are specific (not just "no error thrown").
- [ ] Mocks are realistic and do not mask real integration issues.

## After Review

- [ ] All blocking comments are marked as "Request Changes."
- [ ] Non-blocking suggestions are clearly marked as optional.
- [ ] At least one positive callout is included.
- [ ] The verdict (Approve / Request Changes / Comment) is clear.
- [ ] Follow-up items are tracked (create issues for future improvements).
