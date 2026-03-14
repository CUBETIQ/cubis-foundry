# Verification Strategies

Load this when verifying an implementation against extracted specifications and detecting drift.

---

## Verification Levels

| Level | What it checks | Confidence |
|-------|---------------|------------|
| **Static** | Code structure matches spec expectations (types, function signatures, error codes) | Medium |
| **Dynamic** | Tests pass and cover spec assertions | High |
| **Behavioral** | System behavior matches spec under realistic conditions | Highest |

---

## Static Verification

### Type-Level Checks

Compare the specification's data model against the implementation's types.

```
Spec: "Order must have status: pending | processing | shipped | delivered | cancelled"

Verify:
- Does the code define an OrderStatus type or enum?
- Does it include all 5 values?
- Are there any additional values not in the spec? (drift)
```

### API Contract Checks

For API specifications, verify request/response shapes.

```
Spec: POST /api/orders returns 201 with { orderId: string, status: string }

Verify:
- Does the route handler return 201?
- Does the response schema include both fields?
- Are field types correct?
- Are there additional fields not in the spec? (feature drift)
```

---

## Dynamic Verification

### Running the Spec Test Suite

Execute all tests generated from specifications and map results:

```markdown
| Spec ID | Test ID | Result | Notes |
|---------|---------|--------|-------|
| SPEC-001 | TEST-001 | Pass | -- |
| SPEC-002 | TEST-002 | Fail | Returns 200 instead of 201 |
| SPEC-003 | -- | No Test | Test generation needed |
```

### Failure Classification

| Failure Type | Meaning | Action |
|-------------|---------|--------|
| Test fails, spec correct | Implementation bug | Fix the code |
| Test fails, spec wrong | Spec needs updating | Update spec, re-derive test |
| Test passes, wrong assertion | Test does not actually check the spec | Rewrite test |
| No test exists | Untested specification | Generate and run test |

---

## Detecting Specification Drift

Drift occurs when the implementation's behavior diverges from the specification over time.

### Common Drift Patterns

1. **Feature Drift** -- Code does more than the spec says. New behaviors were added without updating the specification.

2. **Regression Drift** -- Code stopped doing what the spec says. A refactoring or dependency update broke specified behavior without being caught by tests.

3. **Configuration Drift** -- Behavior varies by environment. The spec says "timeout after 30 seconds" but production config says 60 seconds.

4. **Silent Drift** -- Tests pass but don't actually verify the spec. The test asserts `response.ok` instead of checking the specific status code the spec requires.

### Drift Detection Technique

1. Re-read the specification with fresh eyes.
2. For each spec clause, write a new, independent verification test.
3. Run the new tests without looking at existing tests.
4. Compare new test results with existing test results.
5. Discrepancies indicate drift.

---

## Verification Report Structure

```markdown
## Verification Summary

| Metric | Value |
|--------|-------|
| Total specifications | N |
| Verified (pass) | X |
| Failed | Y |
| Untested | Z |
| Drifted | W |

## Detailed Findings

### Passed Specifications
[List with evidence]

### Failed Specifications
[Each with root cause and recommended fix]

### Untested Specifications
[Each with recommended test approach]

### Detected Drift
[Each with spec vs. actual comparison]
```

---

## Continuous Verification

### In CI/CD Pipeline

```yaml
steps:
  - name: Run spec verification
    run: npm run test:spec

  - name: Check spec coverage
    run: node scripts/spec-coverage.js --threshold 95

  - name: Detect drift
    run: node scripts/drift-check.js --baseline specs/
```

### On Requirement Change

When a specification changes:
1. Mark affected matrix entries as "needs re-verification."
2. Update or regenerate affected tests.
3. Run verification.
4. Update matrix with new results.
5. Include matrix diff in the PR.
