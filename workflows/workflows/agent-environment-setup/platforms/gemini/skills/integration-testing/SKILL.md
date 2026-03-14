---
name: integration-testing
description: "Integration testing patterns for verifying component interactions across test boundaries, databases, APIs, test containers, and fixture management. Use when testing how components work together."
---
# Integration Testing Patterns

## Purpose

Provide a structured methodology for writing integration tests that verify correct interaction between components, services, and infrastructure. This skill ensures integration tests are reliable, maintainable, and catch defects that unit tests cannot reach -- particularly at boundaries between systems.

## When to Use

- Testing interactions between services, modules, or layers.
- Verifying database queries return correct results against real schemas.
- Validating API contracts between producer and consumer services.
- Setting up test containers for reproducible infrastructure in CI.
- Designing fixture strategies for complex test data.
- Investigating failures that only appear when components are assembled.
- Establishing integration test suites for a new microservices architecture.
- Validating middleware, authentication, and authorization pipelines.

## Instructions

1. **Define the integration boundary** -- Identify which components interact and where the boundary lies (e.g., service-to-database, API-to-API). Clear boundaries prevent tests from becoming end-to-end tests in disguise.

2. **Choose the right scope** -- Decide whether to test a narrow integration (two components) or a broad integration (full slice). Narrow tests are faster and more diagnostic; broad tests catch wiring issues.

3. **Use real dependencies where practical** -- Prefer real databases and message brokers over mocks when testing data access logic. Mocking the database hides query bugs, schema mismatches, and transaction issues.

4. **Adopt test containers for infrastructure** -- Use Testcontainers or similar tools to spin up ephemeral database, cache, and queue instances. Containers provide production-like fidelity without polluting shared environments.

5. **Design idempotent test fixtures** -- Create fixtures that can be set up and torn down without leaving residue. Leftover state from one test run corrupts subsequent runs and produces false failures.

6. **Implement contract tests for API boundaries** -- Use consumer-driven contract testing (Pact, Spring Cloud Contract) to verify API shapes independently. Contract tests catch breaking changes before deployment without requiring full integration environments.

7. **Isolate test data per test case** -- Use unique identifiers, transactions that roll back, or per-test database schemas. Shared test data creates ordering dependencies and intermittent failures.

8. **Test the unhappy paths at boundaries** -- Verify timeout handling, connection failures, malformed responses, and partial failures. Integration points are where most production incidents originate.

9. **Keep integration tests focused on behavior** -- Assert on observable outcomes (HTTP status, response body, database state), not internal implementation. Behavior-focused tests survive refactoring.

10. **Manage test environment configuration explicitly** -- Use environment variables, test profiles, or configuration files to separate test settings from production. Accidental production calls from tests cause real damage.

11. **Implement retry-aware assertions for async systems** -- Use polling or event-driven waits instead of fixed sleeps when testing message queues or eventual consistency. Fixed sleeps are slow and still flaky.

12. **Sequence database migrations in test setup** -- Run migrations before test execution to ensure the schema matches production. Schema drift between test and production is a common source of false confidence.

13. **Tag and separate integration tests from unit tests** -- Use test tags, directories, or naming conventions so integration tests can be run independently. Mixed suites slow down developer feedback loops.

14. **Monitor integration test execution time** -- Track test duration over time and investigate regressions. Slow integration suites get skipped by developers, reducing their value.

15. **Clean up external side effects in teardown** -- Remove created records, uploaded files, and published messages after each test. Orphaned side effects accumulate and cause cascading failures.

16. **Document test assumptions and prerequisites** -- Record required services, seed data, and environment setup. Missing documentation causes onboarding friction and CI pipeline failures.

## Output Format

```markdown
## Integration Test Plan

### Integration Boundary
- **Producer:** <component/service>
- **Consumer:** <component/service>
- **Protocol:** <HTTP/gRPC/SQL/Message Queue>
- **Scope:** Narrow / Broad

### Test Cases
| # | Scenario | Setup | Action | Expected Outcome | Teardown |
|---|----------|-------|--------|------------------|----------|
| 1 | ...      | ...   | ...    | ...              | ...      |

### Infrastructure Requirements
| Service      | Provider        | Configuration         |
|-------------|----------------|-----------------------|
| Database    | Testcontainers | PostgreSQL 15, schema v3 |
| ...         | ...            | ...                   |

### Contract Verification
| Endpoint       | Consumer        | Contract File     | Status |
|---------------|-----------------|-------------------|--------|
| GET /users/:id | frontend-app    | user-contract.json | ...   |

### Fixture Strategy
| Fixture        | Scope     | Cleanup Method     |
|---------------|-----------|-------------------|
| ...           | Per-test  | Transaction rollback |
```

## References

| Topic              | File                                | Load When                                       |
|--------------------|-------------------------------------|-------------------------------------------------|
| Test Boundaries    | `references/test-boundaries.md`     | Defining integration scope and component edges  |
| Database Testing   | `references/database-testing.md`    | Testing queries, migrations, transactions       |
| Contract Testing   | `references/contract-testing.md`    | Verifying API contracts between services        |
| Test Containers    | `references/test-containers.md`     | Setting up ephemeral infrastructure for tests   |
| Fixture Management | `references/fixtures.md`            | Designing, seeding, and cleaning up test data   |

## Gemini Platform Notes

- Use `activate_skill` to invoke skills by name from Gemini CLI or Gemini Code Assist.
- Skill files are stored under `.gemini/skills/` in the project root.
- Gemini does not support `context: fork` — all skill execution is inline.
- User arguments are passed as natural language in the activation prompt.
- Reference files are loaded relative to the skill directory under `.gemini/skills/<skill-id>/`.
