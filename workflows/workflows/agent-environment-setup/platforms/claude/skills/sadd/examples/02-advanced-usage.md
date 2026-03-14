# Example: Mining Specifications from Legacy Code and Verifying a Rewrite

## Context

A team is rewriting a payment processing module from Python 2 to Python 3. The original code has no formal specification, only inline comments and existing tests. The team needs to extract behavioral specifications from the legacy code before rewriting.

## User Prompt

> We're rewriting our payment processing module. The legacy code has no spec -- just 47 tests and scattered comments. I need to: (1) mine the implicit specification from the existing code and tests, (2) create a traceability matrix for the rewrite, and (3) verify the new implementation covers everything the old one did. Walk me through the full SADD workflow.

## Skill Response

### Phase 1: Specification Mining (Spec-Miner Agent)

#### Step 1: Extract Behavioral Specs from Existing Tests

Analyze each test to derive the requirement it implicitly validates:

```markdown
| Legacy Test | Mined Requirement | REQ ID |
|-------------|-------------------|--------|
| test_charge_success | System processes a valid charge and returns a transaction ID | REQ-001 |
| test_charge_declined | System returns decline reason when card is rejected | REQ-002 |
| test_charge_insufficient_funds | System distinguishes insufficient funds from other declines | REQ-003 |
| test_refund_full | System processes full refund for a completed charge | REQ-004 |
| test_refund_partial | System processes partial refund up to original charge amount | REQ-005 |
| test_refund_exceeds_charge | System rejects refund exceeding original charge amount | REQ-006 |
| test_idempotency_key | System returns same result for duplicate requests with same idempotency key | REQ-007 |
| test_currency_conversion | System converts currencies using rates from rate provider | REQ-008 |
| test_webhook_delivery | System delivers payment event webhooks to registered endpoints | REQ-009 |
| test_retry_on_timeout | System retries gateway calls up to 3 times on timeout | REQ-010 |
```

#### Step 2: Mine Implicit Specs from Code Contracts

```python
# Legacy code patterns that imply specifications:

def charge(amount, currency, token, idempotency_key=None):
    """Process a payment charge."""
    if amount <= 0:                    # REQ-011: Amount must be positive
        raise ValueError("Amount must be positive")
    if currency not in SUPPORTED:      # REQ-012: Currency must be in supported list
        raise ValueError(f"Unsupported currency: {currency}")
    if len(token) != 32:               # REQ-013: Token must be exactly 32 characters
        raise ValueError("Invalid token format")
```

#### Step 3: Mine from Inline Comments

```python
# Legacy comments that imply specifications:
# NOTE: Always log PCI-sensitive data as masked  -> REQ-014: PCI data masking in logs
# HACK: Rate limit to 100 req/s per merchant    -> REQ-015: Rate limiting at 100 req/s
# TODO: Add support for 3D Secure               -> NOT a requirement (future work)
```

### Phase 2: Traceability Matrix for Rewrite

| REQ ID | Requirement | Legacy Test | Legacy Code Location | New Test ID | New Code Location | Status |
|--------|------------|-------------|---------------------|-------------|-------------------|--------|
| REQ-001 | Process valid charge, return tx ID | test_charge_success | charge.py:45 | TEST-001 | — | Pending |
| REQ-002 | Return decline reason on rejection | test_charge_declined | charge.py:72 | TEST-002 | — | Pending |
| REQ-003 | Distinguish insufficient funds | test_charge_insufficient_funds | charge.py:89 | TEST-003 | — | Pending |
| REQ-004 | Full refund for completed charge | test_refund_full | refund.py:23 | TEST-004 | — | Pending |
| REQ-005 | Partial refund up to original | test_refund_partial | refund.py:41 | TEST-005 | — | Pending |
| REQ-006 | Reject over-refund | test_refund_exceeds_charge | refund.py:58 | TEST-006 | — | Pending |
| REQ-007 | Idempotency key dedup | test_idempotency_key | charge.py:110 | TEST-007 | — | Pending |
| REQ-008 | Currency conversion | test_currency_conversion | fx.py:15 | TEST-008 | — | Pending |
| REQ-009 | Webhook delivery | test_webhook_delivery | events.py:30 | TEST-009 | — | Pending |
| REQ-010 | Retry on timeout (3x) | test_retry_on_timeout | charge.py:130 | TEST-010 | — | Pending |
| REQ-011 | Amount must be positive | (code contract) | charge.py:46 | TEST-011 | — | Pending |
| REQ-012 | Currency must be supported | (code contract) | charge.py:48 | TEST-012 | — | Pending |
| REQ-013 | Token must be 32 chars | (code contract) | charge.py:50 | TEST-013 | — | Pending |
| REQ-014 | PCI data masking in logs | (comment) | logging.py:12 | TEST-014 | — | Pending |
| REQ-015 | Rate limit 100 req/s/merchant | (comment) | middleware.py:8 | TEST-015 | — | Pending |

### Phase 3: Verification (Verifier Agent)

After the rewrite is complete, run verification:

```markdown
## Verification Report

### Coverage Summary
| Metric | Count |
|--------|-------|
| Total requirements | 15 |
| Requirements with passing tests | 13 |
| Requirements with failing tests | 1 |
| Requirements with no test | 1 |

### Failures
| REQ ID | Issue |
|--------|-------|
| REQ-010 | New implementation retries 2 times, not 3. Legacy code used `for i in range(3)` (3 retries after initial attempt = 4 total). New code uses `max_retries=2`. |

### Gaps
| REQ ID | Issue |
|--------|-------|
| REQ-015 | Rate limiting test (TEST-015) exists but is skipped in CI. No integration test validates the 100 req/s threshold under load. |

### Recommendation
1. Fix REQ-010: Change `max_retries=2` to `max_retries=3` in the new gateway client.
2. Fix REQ-015: Add a load test that verifies rate limiting engages at 100 req/s.
3. After fixes, all 15 requirements will have passing tests and verified implementations.
```

### Key Decisions

1. **Three mining sources** -- Tests, code contracts, and comments each reveal different types of implicit specifications. Using all three provides the most complete picture.
2. **Legacy-to-new mapping** -- The traceability matrix includes both legacy and new locations, enabling side-by-side verification during the rewrite.
3. **Verifier catches subtle discrepancy** -- The retry count difference (3 vs 2) is exactly the kind of behavioral regression that code review misses but spec-aware verification catches.
4. **Excluded TODO comments** -- "TODO: Add 3D Secure" is future work, not an existing behavioral spec. Including it would inflate the requirement set with unimplemented features.
