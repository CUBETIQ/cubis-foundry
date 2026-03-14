# Unit Testing -- Eval Assertions

## Eval 001: Mock Strategy for External Payment Service

| # | Assertion Type | Value | Rationale |
|---|---------------|-------|-----------|
| 1 | contains | `stub` | The response must recommend stubs or test doubles for the external payment gateway to ensure test isolation from the real HTTP service. |
| 2 | contains | `timeout` | The response must include a test case that covers network timeout handling, since timeout is a critical error path for external service calls. |
| 3 | contains | `assert` | The response must include explicit assertions for each scenario (success, decline, timeout, idempotency conflict) to verify correct behavior. |
| 4 | contains | `arrange` | The response must demonstrate the Arrange-Act-Assert (AAA) pattern or equivalent structured test layout, ensuring consistent test organization. |
| 5 | contains | `idempoten` | The response must address the idempotency key conflict scenario, which is a real-world edge case specific to payment integrations. |

### What a Passing Response Looks Like

A passing response designs a complete mock strategy that:
- Creates a stub or fake for `PaymentGateway.charge()` rather than calling the real service.
- Defines four distinct test cases: successful charge, declined card, network timeout, and idempotency conflict.
- Uses the Arrange-Act-Assert structure in each test.
- Includes specific assertions (e.g., `expect(result.status).toBe('declined')`) rather than vague checks.
- Explains why each mock behavior is configured (e.g., timeout stub simulates network failure).

---

## Eval 002: TDD Red-Green-Refactor Cycle for Validator

| # | Assertion Type | Value | Rationale |
|---|---------------|-------|-----------|
| 1 | contains | `red` | The response must explicitly identify the Red phase where a failing test is written before any implementation code exists. |
| 2 | contains | `green` | The response must explicitly identify the Green phase where the minimum code is written to make the test pass. |
| 3 | contains | `refactor` | The response must explicitly identify the Refactor phase where code is improved while tests remain green. |
| 4 | contains | `fail` | The response must show or describe the test failing before implementation, proving the test is valid and exercises the intended behavior. |
| 5 | contains | `edge` | The response must address edge cases (consecutive dots, unusual formats) as part of the TDD cycle. |

### What a Passing Response Looks Like

A passing response walks through a complete TDD cycle that:
- Starts with a failing test for the simplest case (e.g., valid email returns true).
- Shows the test failing (Red) before any implementation.
- Writes minimal implementation to pass (Green).
- Iterates the cycle for each requirement: no `@`, spaces, consecutive dots.
- Refactors the validation logic while all tests stay green.
- Clearly labels each phase (Red, Green, Refactor) in the walkthrough.
