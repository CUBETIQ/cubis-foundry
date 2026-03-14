# Specification Mining Reference

Load this when extracting specifications from legacy code or informal documentation.

---

## Mining Source Hierarchy

Not all sources are equally reliable. Prioritize by evidence strength:

| Priority | Source | Reliability | Why |
|----------|--------|-------------|-----|
| 1 | Passing tests | High | Tests encode executable specifications; if they pass, the behavior exists. |
| 2 | Code contracts (guards, validators, type checks) | High | Explicit enforcement means the behavior is intentional. |
| 3 | API schemas (OpenAPI, protobuf, GraphQL) | High | Machine-readable contracts are typically maintained. |
| 4 | Inline comments (NOTE, HACK) | Medium | Comments may be stale but often encode undocumented decisions. |
| 5 | Commit messages | Low | Describe intent at a point in time; may not reflect current behavior. |
| 6 | External documentation | Variable | Wikis and READMEs decay fastest; cross-reference with code. |

---

## Mining from Tests

### Reading a Test as a Specification

Every test encodes a requirement in this form:

```
GIVEN [test setup / Arrange]
WHEN  [action / Act]
THEN  [expected outcome / Assert]
```

Extract the requirement by converting this to: "The system MUST [THEN] WHEN [WHEN] GIVEN [GIVEN]."

### Example

```python
def test_discount_applied_for_premium_users():
    user = create_user(tier="premium")       # GIVEN a premium user
    order = create_order(user, amount=100)   # WHEN they place a $100 order
    assert order.total == 90                 # THEN total is $90 (10% discount)
```

Mined requirement: "The system MUST apply a 10% discount to orders WHEN the user tier is premium."

### Watch for Test Gaps

Tests only cover behaviors someone thought to test. Common untested areas:

- Error handling and edge cases.
- Concurrent access and race conditions.
- Resource cleanup and teardown.
- Configuration and environment-dependent behavior.

---

## Mining from Code Contracts

### Input Validation as Specification

```python
def transfer(from_account, to_account, amount):
    if amount <= 0:
        raise ValueError("Amount must be positive")
    if from_account == to_account:
        raise ValueError("Cannot transfer to same account")
    if amount > from_account.balance:
        raise InsufficientFundsError()
```

Mined requirements:
- REQ-XXX: Transfer amount must be positive.
- REQ-XXX: Source and destination accounts must be different.
- REQ-XXX: Transfer amount must not exceed source account balance.

### Type Signatures as Specification

```typescript
function calculateTax(
  amount: number,       // Must be numeric
  state: USState,       // Must be a valid US state
  exemptions: string[]  // Can be empty but must be an array
): TaxResult            // Always returns a TaxResult, never null
```

---

## Confidence Levels

| Level | Criteria | Action |
|-------|----------|--------|
| High | Behavior verified by passing test AND code contract | Include in specification as-is |
| Medium | Behavior implied by code contract OR comment but no test | Include with "needs test" flag |
| Low | Behavior mentioned in comment only, no code enforcement | Include with "needs verification" flag |
| Contradicted | Test says X, code does Y, comment says Z | Flag for human resolution, do not include |
