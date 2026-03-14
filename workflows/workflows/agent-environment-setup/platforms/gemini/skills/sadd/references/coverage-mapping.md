# Coverage Mapping Reference

Load this when building and maintaining traceability matrices and spec coverage reports.

---

## Traceability Matrix Fundamentals

A traceability matrix maps every requirement to its specifications, tests, and implementing code. It answers:

- **Forward traceability:** Does every requirement have tests?
- **Backward traceability:** Does every test trace to a requirement?
- **Implementation traceability:** Does every requirement have code?

---

## Matrix Formats

### Minimal (for small projects)

```markdown
| Req ID | Test ID | Status |
|--------|---------|--------|
| REQ-001 | TEST-001 | Pass |
| REQ-002 | TEST-002 | Fail |
| REQ-003 | -- | No test |
```

### Full (for compliance or audit)

```markdown
| Req ID | Requirement | Spec ID | Test ID | Test Status | Code Location | Reviewer | Date |
|--------|------------|---------|---------|-------------|---------------|----------|------|
| REQ-001 | Users register with email | SPEC-001 | TEST-001 | Pass | auth.ts:45 | @dev | 2026-03 |
```

---

## Building the Matrix

### Step 1: Enumerate Requirements

Source requirements from:
- Product requirements documents (PRD)
- User stories and acceptance criteria
- API specifications (OpenAPI, protobuf)
- Regulatory or compliance requirements
- Mined specifications from existing code

Assign each a unique, stable identifier (REQ-001, REQ-002, ...).

### Step 2: Map Specs to Requirements

Each requirement may produce 1-N specifications:

```
REQ-001: "Users can reset their password"
  -> SPEC-001: Password reset email is sent on request
  -> SPEC-002: Reset link expires after 1 hour
  -> SPEC-003: New password must meet strength requirements
  -> SPEC-004: All sessions invalidated after reset
```

### Step 3: Map Tests to Specs

Each spec should have at least one test. Complex specs need multiple tests (positive, negative, boundary):

```
SPEC-002: Reset link expires after 1 hour
  -> TEST-005: Link works at 59 minutes (positive boundary)
  -> TEST-006: Link rejected at 61 minutes (negative boundary)
  -> TEST-007: Link rejected at 24 hours (far future)
```

### Step 4: Map Code to Specs

Record the file and function/method that implements each specification:

```
SPEC-001 -> src/auth/password-reset.ts:sendResetEmail()
SPEC-002 -> src/auth/password-reset.ts:validateResetToken()
```

---

## Coverage Metrics

### Spec Coverage (most important)

```
Spec Coverage = Specs with at least one passing test / Total specs

Example: 42 specs tested / 50 total specs = 84% spec coverage
```

This is more meaningful than code coverage because it measures requirements satisfied, not lines executed.

### Requirement Coverage

```
Requirement Coverage = Requirements with all specs tested / Total requirements

Example: 18 requirements fully covered / 20 total = 90% requirement coverage
```

### Gap Analysis

| Gap Type | Count | Action |
|----------|-------|--------|
| Requirements with no specs | 3 | Mine specifications from each |
| Specs with no tests | 5 | Generate test cases |
| Tests with no spec | 8 | Link to spec or mark as implementation test |
| Specs with failing tests | 2 | Fix implementation or update spec |

---

## Keeping the Matrix Current

### Triggers for Matrix Update

| Event | Matrix Action |
|-------|--------------|
| New feature planned | Add requirements |
| Sprint planning | Add specs for upcoming requirements |
| Test written | Link test to spec |
| Code merged | Update code locations |
| Bug found | Check if a spec exists; if not, add one |
| Requirement changed | Update spec, flag tests for re-verification |
| Code refactored | Verify code locations still accurate |

### Automation

**Tag-based traceability:** Add spec IDs to test descriptions.

```javascript
// @spec SPEC-042
it('should expire reset link after 1 hour', () => { ... });
```

Then run a script that:
1. Scans all tests for `@spec` tags.
2. Scans the spec registry for all spec IDs.
3. Produces a coverage report showing matched, unmatched, and missing entries.

---

## Reporting

### Dashboard Format

```
SADD Coverage Dashboard
========================
Requirements: 50 total | 45 with specs (90%) | 5 need spec mining
Specifications: 120 total | 108 with tests (90%) | 12 need tests
Tests: 150 total | 140 linked to specs (93%) | 10 unlinked
Implementation: 108 specs with code | 12 pending

Overall Spec Coverage: 90%
Trend: +3% from last sprint
```
