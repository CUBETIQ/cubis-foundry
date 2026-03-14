# Example: Extracting Requirements from Acceptance Criteria

## Context

A product manager has written acceptance criteria for a password reset feature. The developer needs to extract testable requirements and build a traceability matrix before writing any code.

## User Prompt

> Here are the acceptance criteria for our password reset feature: (1) User clicks "Forgot Password" and enters their email. (2) System sends a reset link valid for 1 hour. (3) Link contains a unique token. (4) User sets a new password that must be at least 8 characters with one number. (5) After reset, all existing sessions are invalidated. Extract requirements and create a test plan.

## Skill Response

### Specification Source

- **Type:** Semi-formal (acceptance criteria)
- **Location:** Product brief, Sprint 12
- **Version:** v1.0 (initial)

### Requirements Registry

| REQ ID | Requirement Text | Type | Priority |
|--------|-----------------|------|----------|
| REQ-001 | System sends a password reset email when user submits a registered email address | Functional | Must |
| REQ-002 | Reset link expires after 1 hour from generation | Functional | Must |
| REQ-003 | Reset link contains a cryptographically unique token | Functional | Must |
| REQ-004 | New password must be at least 8 characters | Functional | Must |
| REQ-005 | New password must contain at least one numeric character | Functional | Must |
| REQ-006 | All existing sessions are invalidated after successful password reset | Functional | Must |
| REQ-007 | System does not reveal whether an email is registered (security) | Non-Functional | Should |
| REQ-008 | Reset token is single-use (cannot be reused after successful reset) | Functional | Should |

### Specification Gaps Identified

| # | Gap Description | Decision Made | Test Added |
|---|----------------|---------------|------------|
| 1 | What happens if email is not registered? Spec says "enters their email" but not what happens for unknown emails. | Show same success message for registered and unregistered emails to prevent email enumeration. | TEST-007 |
| 2 | Can a reset token be used more than once? Spec does not mention single-use. | Token should be single-use and invalidated after successful reset. | TEST-008 |
| 3 | Rate limiting on reset requests not specified. | Limit to 3 reset requests per email per hour. | TEST-009 |

### Test Cases

| TEST ID | REQ ID | Test Description | Type |
|---------|--------|-----------------|------|
| TEST-001 | REQ-001 | Submit registered email; verify reset email is sent | Positive |
| TEST-002 | REQ-002 | Use reset link after 61 minutes; verify it is rejected | Negative/Boundary |
| TEST-003 | REQ-002 | Use reset link at 59 minutes; verify it works | Positive/Boundary |
| TEST-004 | REQ-003 | Generate two reset tokens; verify they are different | Positive |
| TEST-005 | REQ-004 | Submit 7-character password; verify rejection | Negative |
| TEST-006 | REQ-005 | Submit all-letter password; verify rejection | Negative |
| TEST-007 | REQ-007 | Submit unregistered email; verify same response as registered | Security |
| TEST-008 | REQ-008 | Use reset token twice; verify second use is rejected | Negative |
| TEST-009 | GAP-003 | Submit 4 reset requests in 1 hour; verify 4th is rate-limited | Negative |
| TEST-010 | REQ-006 | Reset password; verify existing session tokens are invalidated | Positive |

### Traceability Matrix

| REQ ID | Test IDs | Implementation | Status |
|--------|----------|---------------|--------|
| REQ-001 | TEST-001 | Pending | Not started |
| REQ-002 | TEST-002, TEST-003 | Pending | Not started |
| REQ-003 | TEST-004 | Pending | Not started |
| REQ-004 | TEST-005 | Pending | Not started |
| REQ-005 | TEST-006 | Pending | Not started |
| REQ-006 | TEST-010 | Pending | Not started |
| REQ-007 | TEST-007 | Pending | Not started |
| REQ-008 | TEST-008 | Pending | Not started |

### Key Decisions

1. **Mined 8 requirements from 5 acceptance criteria** -- The original 5 criteria contained compound statements. Splitting them into atomic requirements (REQ-004 and REQ-005 from a single criterion) ensures each is independently testable.
2. **Added 3 specification gaps** -- Security-critical features like password reset commonly under-specify error handling and abuse prevention. Documenting gaps upfront prevents them from becoming production incidents.
3. **Boundary tests for time-based requirements** -- REQ-002 gets both a 59-minute (should work) and 61-minute (should fail) test to verify the exact boundary.
