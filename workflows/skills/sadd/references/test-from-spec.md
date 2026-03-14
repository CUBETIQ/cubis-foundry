# Test-from-Spec Reference

Load this when generating tests directly from requirement text.

---

## The Principle

Tests should be derived from specifications, not from implementation. Spec-first testing ensures:

- Tests validate **intended behavior**, not accidental behavior.
- Tests survive refactoring because they are anchored to requirements, not code structure.
- Coverage is measured against requirements, not lines of code.

---

## The Derivation Process

### Step 1: Decompose the Requirement

Break a requirement into its constituent conditions and outcomes:

**Requirement:** "The system must send a notification email when an order ships, containing the tracking number and estimated delivery date."

| Component | Value |
|-----------|-------|
| Trigger | Order ships |
| Action | Send notification email |
| Content requirement 1 | Contains tracking number |
| Content requirement 2 | Contains estimated delivery date |
| Implicit | Email is sent to the customer who placed the order |
| Implicit | Email is not sent if order is cancelled before shipping |

### Step 2: Generate Positive Tests

One test per component combination that should succeed:

```
TEST-001: When order ships, notification email is sent to the order's customer.
TEST-002: Notification email contains the tracking number.
TEST-003: Notification email contains the estimated delivery date.
```

### Step 3: Generate Negative Tests

One test per boundary or failure condition:

```
TEST-004: No email is sent if order is cancelled before shipping.
TEST-005: No email is sent if customer has unsubscribed from notifications.
TEST-006: If tracking number is unavailable, email is sent with "tracking pending" message.
```

### Step 4: Generate Boundary Tests

For numeric, time, or size constraints:

```
Requirement: "Password must be at least 8 characters."

TEST-007: Password with exactly 8 characters is accepted.    (boundary - valid)
TEST-008: Password with 7 characters is rejected.            (boundary - invalid)
TEST-009: Password with 100 characters is accepted.          (large input)
TEST-010: Empty password is rejected.                        (zero input)
```

---

## Test Naming Convention

Name tests to read as specification statements:

```
should_[expected behavior]_when_[condition]

should_send_notification_when_order_ships
should_reject_password_when_fewer_than_8_characters
should_return_404_when_resource_not_found
```

This convention makes test suites readable as living specification documents.

---

## Mapping Requirement Types to Test Types

| Requirement Type | Test Type | Example |
|-----------------|-----------|---------|
| Functional (happy path) | Unit test | Input -> expected output |
| Functional (error handling) | Unit test with error assertion | Invalid input -> specific error |
| Performance | Benchmark / load test | Response time < 200ms at P95 |
| Security | Security test | SQL injection input -> safe handling |
| Compatibility | Cross-environment test | Works on Node 18 and Node 20 |
| Accessibility | Automated a11y check | WCAG 2.1 AA compliance |

---

## Common Pitfalls

### Testing Implementation Instead of Specification

**Wrong:** Test that `calculateDiscount` calls `lookupTier` method.
**Right:** Test that a premium user gets 10% discount on orders.

The first test breaks when you refactor the internal method. The second test survives because it tests the specified behavior.

### Compound Test Cases

**Wrong:** One test that checks sending, content, and recipient simultaneously.
**Right:** Separate tests for each: sending occurs, content is correct, recipient is correct.

Compound tests report a single failure that could be any of several issues.

### Missing the Implicit Requirements

Specifications often leave behaviors implicit:

- What happens on timeout?
- What happens with empty input?
- What happens when a dependency is unavailable?

Explicitly mine these gaps and create tests for the decisions you make.
