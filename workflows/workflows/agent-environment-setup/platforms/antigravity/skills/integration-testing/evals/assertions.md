# Integration Testing -- Eval Assertions

## Eval 001: API Contract Verification Between Services

| # | Assertion Type | Value | Rationale |
|---|---------------|-------|-----------|
| 1 | contains | `contract` | The response must recommend consumer-driven contract testing as the primary approach to prevent field-rename breakages between services. |
| 2 | contains | `consumer` | The response must identify the frontend as the consumer that defines the expected response shape, since the consumer knows what fields it needs. |
| 3 | contains | `provider` | The response must describe provider-side verification where the backend validates its responses against the consumer contract. |
| 4 | contains | `CI` | The response must integrate contract verification into the CI/CD pipeline so breaking changes are caught before deployment. |
| 5 | contains | `schema` | The response must define a contract schema specifying expected field names and types, directly preventing the `role` to `userRole` rename issue. |

### What a Passing Response Looks Like

A passing response designs a contract testing strategy that:
- Uses a consumer-driven approach (e.g., Pact, Spring Cloud Contract) where the frontend defines expected fields.
- Includes a contract file that specifies `id`, `name`, `email`, and `role` as required fields with types.
- Describes how the provider (user-service) runs verification against the contract on every build.
- Integrates into CI so a rename like `role` -> `userRole` fails the provider build before merge.
- Explains the workflow: consumer publishes contract, provider verifies, both run in CI.

---

## Eval 002: Database Integration Test Setup with Containers

| # | Assertion Type | Value | Rationale |
|---|---------------|-------|-----------|
| 1 | contains | `container` | The response must recommend Testcontainers or equivalent ephemeral container approach for CI-compatible database provisioning. |
| 2 | contains | `migrat` | The response must include running database migrations in the test setup to ensure schema matches production. |
| 3 | contains | `rollback` | The response must use transaction rollback or equivalent mechanism for per-test data isolation. |
| 4 | contains | `seed` | The response must describe a fixture seeding strategy for populating test data in a controlled manner. |
| 5 | contains | `cleanup` | The response must include a teardown or cleanup phase that removes test artifacts and stops containers. |

### What a Passing Response Looks Like

A passing response designs a database integration test environment that:
- Spins up a PostgreSQL container using Testcontainers in the beforeAll/setup phase.
- Runs schema migrations against the ephemeral database.
- Seeds known test data (fixtures) for predictable assertions.
- Wraps each test in a transaction that rolls back, ensuring isolation.
- Tears down the container after all tests complete.
- Shows the complete lifecycle: container start -> migrate -> seed -> test (in transaction) -> rollback -> container stop.
