# SADD Eval Assertions

## Eval 1: Spec Extraction from Requirements

This eval tests whether the skill can mine structured, testable specifications from a natural language requirements document.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                          |
|---|----------|-------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| 1 | contains | `GIVEN` — GIVEN-WHEN-THEN format usage           | The structured format makes specs testable. Free-form specs cannot be directly mapped to test cases.    |
| 2 | contains | `unique` — Email uniqueness constraint            | This is a data integrity constraint that requires database-level enforcement and a specific test.       |
| 3 | contains | `24 hours` — Time-bound expiry spec              | Time-bound requirements are frequently missed in spec extraction and require explicit test setup.       |
| 4 | contains | `rate limit` — Rate limiting as non-functional   | The 3-per-hour limit is a non-functional requirement that needs its own test with time manipulation.    |
| 5 | contains | `unverified` — Access restriction spec            | Security specs must be extracted separately because they require negative testing (denied access).      |

### What a passing response looks like

- 7+ specifications extracted (one per bullet in the requirements, plus implicit edge cases).
- Each spec has a unique ID (e.g., SPEC-001, SPEC-002).
- Each spec uses GIVEN-WHEN-THEN format with concrete conditions.
- Specs are classified as functional, non-functional, or security.
- At least one gap is identified (e.g., "What happens when an expired link is clicked?").
- Ambiguous requirements are flagged with clarifying questions.

---

## Eval 2: Verification Workflow

This eval tests whether the skill can systematically verify an implementation against specifications and identify gaps.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                          |
|---|----------|-------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| 1 | contains | `SPEC-003` — Identifies missing quantity-to-zero | The Cart class has no method to set quantity. This gap must be explicitly identified.                   |
| 2 | contains | `SPEC-005` — Identifies missing checkout guard   | There is no checkout method at all. This is a complete implementation gap.                              |
| 3 | contains | `SPEC-001` — Confirms add item works             | The addItem method correctly increments itemCount. Must confirm satisfied specs, not only gaps.         |
| 4 | contains | `SPEC-004` — Confirms duplicate handling          | The existing item check in addItem satisfies the deduplication spec. Must verify positive cases too.   |
| 5 | contains | `gap` — Explicit gap identification              | Must clearly label gaps and recommend specific implementation changes, not just note them.              |

### What a passing response looks like

- A specification-by-specification verification report.
- SPEC-001 and SPEC-002 marked as satisfied with evidence from the code.
- SPEC-004 marked as satisfied, pointing to the `existing` item check.
- SPEC-003 marked as NOT satisfied, with recommendation to add `setQuantity` or `updateQuantity` method.
- SPEC-005 marked as NOT satisfied, with recommendation to add `checkout` method with empty cart validation.
- A summary table showing 3/5 specs satisfied (60% spec coverage).
- Suggested test cases for the two missing implementations.
