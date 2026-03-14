# Traceability Matrices Reference

Load this when building and maintaining requirement traceability.

---

## What Is a Traceability Matrix?

A traceability matrix is a table that maps every requirement to its corresponding tests, implementation locations, and verification status. It answers three questions:

1. **Is every requirement tested?** (Forward traceability: spec -> test)
2. **Does every test trace back to a requirement?** (Backward traceability: test -> spec)
3. **Is every requirement implemented?** (Implementation traceability: spec -> code)

---

## Matrix Structure

### Minimal Matrix

```markdown
| REQ ID | Test ID | Status |
|--------|---------|--------|
| REQ-001 | TEST-001 | Pass |
| REQ-002 | TEST-002, TEST-003 | Pass |
| REQ-003 | — | No test |
```

### Full Matrix

```markdown
| REQ ID | Requirement | Test IDs | Test Status | Code Location | Verified By | Date |
|--------|------------|----------|-------------|---------------|-------------|------|
| REQ-001 | User can register with email | TEST-001, TEST-002 | Pass | auth.ts:45 | @dev | 2026-03-01 |
```

---

## Building the Matrix

### Step 1: Populate Requirements Column

List every requirement from the specification with its unique ID. If requirements don't have IDs, assign them sequentially (REQ-001, REQ-002, ...).

### Step 2: Map Tests to Requirements

For each test in the test suite, identify which requirement it validates. A single test may cover multiple requirements; a single requirement may need multiple tests.

### Step 3: Identify Gaps

- **Requirements with no tests:** These need test creation.
- **Tests with no requirements:** These might test implementation details (consider removing) or might reveal undocumented requirements (consider adding to the spec).
- **Requirements with no implementation:** These are unimplemented features.

### Step 4: Add Implementation Locations

For each requirement, record the file and line where the behavior is implemented. This enables quick navigation during reviews and debugging.

---

## Maintaining the Matrix

### When to Update

| Event | Matrix Action |
|-------|--------------|
| New requirement added | Add row with REQ ID, mark tests as "Pending" |
| Requirement changed | Update requirement text, mark tests as "Needs re-verification" |
| Requirement removed | Mark row as "Deprecated" with date and reason |
| New test added | Link test to requirement(s) it validates |
| Test removed | Remove test link, flag requirement if now untested |
| Code moved | Update implementation location |
| Code refactored | Re-verify that tests still pass for affected requirements |

### Staleness Indicators

A matrix is going stale when:

- More than 10% of entries have "Pending" status for more than one sprint.
- Implementation locations point to files that no longer exist.
- Test IDs reference tests that have been deleted or renamed.

---

## Using the Matrix in Code Review

### Reviewer Checklist

1. Does the PR change any requirement in the matrix?
2. If yes, are the corresponding tests updated?
3. If new code is added, is there a requirement for it?
4. If a test is modified, does it still validate its linked requirement?
5. Is the matrix updated in the same PR?

### Common Review Findings

| Finding | Severity | Action |
|---------|----------|--------|
| New feature with no requirement | Medium | Add requirement to spec, then to matrix |
| Changed behavior with unchanged test | High | Update test to validate new behavior |
| Deleted test with active requirement | High | Restore test or provide replacement |
| Matrix not updated | Low | Update matrix before merge |

---

## Automation Opportunities

| Opportunity | Tool | Impact |
|------------|------|--------|
| Auto-generate matrix from test tags | Custom script parsing @req annotations | Eliminates manual mapping |
| Matrix freshness check in CI | Script that verifies all files in matrix exist | Catches stale entries |
| Coverage report by requirement | Map code coverage data to matrix rows | Requirement-level coverage metrics |
| PR template with matrix check | GitHub PR template with matrix checklist | Process enforcement |
