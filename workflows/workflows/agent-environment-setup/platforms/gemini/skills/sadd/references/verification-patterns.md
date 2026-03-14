# Verification Patterns Reference

Load this when cross-referencing implementation against specifications.

---

## Verification vs. Validation

| Concept | Question | How |
|---------|----------|-----|
| **Verification** | "Did we build the thing right?" | Check implementation against specification. |
| **Validation** | "Did we build the right thing?" | Check specification against user needs. |

SADD focuses on verification. Validation is a product management concern.

---

## Verification Strategies

### Strategy 1: Assertion-Based Verification

Compare the specification text directly to test assertions.

**Specification:** "The system must return HTTP 429 when rate limit is exceeded."

**Verification check:**
- Does a test exist that triggers the rate limit?
- Does the test assert HTTP 429 (not just "error")?
- Does the test verify the rate limit threshold matches the spec?

### Strategy 2: Behavioral Comparison

Run the same inputs through the specification model and the implementation, then compare outputs.

```
Spec says: deposit($100) -> balance increases by $100
Test does: deposit($100) -> assert balance == previous + 100
Code does: balance += amount (after validation)

Verdict: Aligned ✓
```

### Strategy 3: Contract Testing

For API specifications, generate contract tests that verify request/response shapes.

```markdown
| Endpoint | Method | Request Schema Valid? | Response Schema Valid? | Status Codes Match? |
|----------|--------|----------------------|----------------------|-------------------|
| /users   | POST   | Yes                  | Yes                  | 201, 400, 409 ✓  |
| /users   | GET    | Yes                  | No (missing pagination) | 200 ✓, 404 missing |
```

---

## Common Verification Failures

### Off-by-One Errors

**Spec:** "Maximum 10 items per page."
**Implementation:** `if (items.length > 10)` (allows 11 items because > should be >=10 with slice)

**Detection:** Boundary tests at exactly the specified limit.

### Partial Implementation

**Spec:** "Return error with code and message."
**Implementation:** Returns error with code only; message field is always null.

**Detection:** Assert on every field specified, not just the primary one.

### Hardcoded Value Drift

**Spec:** "Session timeout: 30 minutes."
**Implementation:** `SESSION_TIMEOUT = 1800` (correct) but another code path uses `setTimeout(3600000)` (60 minutes).

**Detection:** Search for all references to the configured value; verify consistency.

### Error Path Omission

**Spec:** "Return 404 when resource not found, 403 when unauthorized, 429 when rate-limited."
**Implementation:** Handles 404 and 403; returns 500 for rate limit (unhandled exception).

**Detection:** Verify every specified error code has a corresponding handler and test.

---

## Verification Report Template

```markdown
## Verification Summary

### Scope
- Specification: [document reference]
- Implementation: [repository and commit]
- Date: [verification date]

### Results
| Category | Count |
|----------|-------|
| Requirements verified | X |
| Requirements with failures | Y |
| Requirements untestable | Z |
| Specification gaps found | W |

### Detailed Findings
[One section per failure or gap with REQ ID, expected vs. actual, and recommended fix]

### Verdict
[PASS / CONDITIONAL_PASS / FAIL]
[Conditions for conditional pass or blockers for fail]
```

---

## Automating Verification

### For Machine-Readable Specs

| Spec Format | Auto-Verification Tool |
|------------|----------------------|
| OpenAPI/Swagger | Schemathesis, Dredd, Prism |
| Protocol Buffers | buf lint, buf breaking |
| JSON Schema | ajv, jsonschema |
| GraphQL | Apollo schema validation |
| Database migrations | Schema diff tools |

### For Human-Readable Specs

Automation is limited, but you can:

1. Tag requirements in the spec with IDs.
2. Tag tests with `@req(REQ-XXX)` annotations.
3. Run a script that cross-references tags to produce a coverage report.
4. Integrate the coverage report into CI as a quality gate.
