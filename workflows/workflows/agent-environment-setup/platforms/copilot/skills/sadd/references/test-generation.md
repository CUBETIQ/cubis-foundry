# Test Generation from Specifications

Load this when generating test cases from extracted specifications across testing frameworks.

---

## The Test Generation Pipeline

```
Specification (GIVEN-WHEN-THEN)
    |
    v
Test Skeleton (describe/it structure with placeholders)
    |
    v
Assertion Design (what to assert and why)
    |
    v
Implementation (framework-specific test code)
```

---

## From Spec to Test Skeleton

### Input: A Structured Specification

```
SPEC-007: GIVEN a user with an expired subscription
          WHEN they attempt to access premium content
          THEN they receive a 403 Forbidden response
          AND the response body contains an upgrade prompt
```

### Output: Test Skeleton

```javascript
describe('Premium Content Access', () => {
  describe('SPEC-007: Expired subscription access', () => {
    it('should return 403 when subscription is expired', async () => {
      // GIVEN
      const user = await createUser({ subscriptionStatus: 'expired' });

      // WHEN
      const response = await request(app)
        .get('/api/premium/content')
        .set('Authorization', `Bearer ${user.token}`);

      // THEN
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('upgradePrompt');
    });
  });
});
```

---

## Assertion Strategies by Spec Type

### Functional Specifications

Assert on outputs, side effects, and state changes.

| Spec Says | Assert On |
|-----------|-----------|
| "returns X" | Response body content |
| "creates a record" | Database state after action |
| "sends an email" | Email service mock was called with correct arguments |
| "redirects to Y" | Response status 3xx and Location header |

### Non-Functional Specifications

Assert on quality attributes with appropriate tools.

| Spec Says | Assert On | Tool |
|-----------|-----------|------|
| "responds within 200ms" | P95 response time | k6, artillery |
| "handles 1000 concurrent users" | Error rate under load | k6, locust |
| "meets WCAG 2.1 AA" | Accessibility violations | axe-core, pa11y |
| "no SQL injection" | Input sanitization | sqlmap, OWASP ZAP |

### Constraint Specifications

Assert that business rules are enforced.

| Spec Says | Assert On |
|-----------|-----------|
| "maximum 10 items per cart" | Rejection at item 11 |
| "only admins can delete" | 403 for non-admin users |
| "amounts in USD only" | Rejection of non-USD currency codes |

---

## Generating Negative Tests

Every positive specification implies at least one negative test:

| Positive Spec | Negative Test |
|--------------|---------------|
| "Users can log in with valid credentials" | "Users cannot log in with invalid credentials" |
| "Orders with valid payment are processed" | "Orders with declined payment are not processed" |
| "Admins can view all reports" | "Non-admins cannot view all reports" |

### Boundary Value Tests

For numeric or size constraints, test at the boundaries:

```
Spec: "Password must be at least 8 characters"

Tests:
- 7 characters -> rejected (below boundary)
- 8 characters -> accepted (at boundary)
- 9 characters -> accepted (above boundary)
- 0 characters -> rejected (zero case)
- 1000 characters -> accepted (large input)
```

---

## Framework-Specific Patterns

### Jest / Vitest (JavaScript/TypeScript)

```javascript
describe('[SPEC-ID]: [spec description]', () => {
  it('should [expected behavior] when [condition]', () => {
    // Arrange - GIVEN
    // Act - WHEN
    // Assert - THEN
  });
});
```

### pytest (Python)

```python
class TestSpecXXX:
    """SPEC-XXX: [spec description]"""

    def test_expected_behavior_when_condition(self):
        # Arrange - GIVEN
        # Act - WHEN
        # Assert - THEN
        pass
```

### Go testing

```go
func TestSpec001_ExpectedBehavior_WhenCondition(t *testing.T) {
    // Arrange - GIVEN
    // Act - WHEN
    // Assert - THEN
}
```

---

## Test Completeness Checklist

For every specification, verify that tests cover:

- [ ] Happy path (positive case as specified)
- [ ] Error path (invalid input, missing data)
- [ ] Boundary values (min, max, zero, one-off)
- [ ] Concurrency (if applicable)
- [ ] State dependencies (preconditions not met)
- [ ] Idempotency (if operation should be repeatable)
