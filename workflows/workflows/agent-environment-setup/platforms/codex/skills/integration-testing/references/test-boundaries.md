# Test Boundaries

## Defining Integration Scope

Integration tests verify that components work together correctly. The critical first step is defining which components are inside the test boundary and which are outside.

### Narrow Integration Tests

Test the interaction between two directly connected components. One real, one real (or one real, one controlled).

```
[Service A] <---> [Database]         # Narrow: service-to-database
[Service A] <---> [Message Queue]    # Narrow: service-to-queue
[Controller] <---> [Service Layer]   # Narrow: HTTP-to-business logic
```

**Advantages:**
- Fast execution (seconds, not minutes).
- Precise failure diagnosis (only two components to inspect).
- Easy to set up and maintain.

**Limitations:**
- Cannot catch wiring issues across multiple layers.
- May miss configuration problems that only appear in full assembly.

### Broad Integration Tests

Test a full vertical slice from entry point to data store.

```
[HTTP Request] -> [Controller] -> [Service] -> [Repository] -> [Database]
```

**Advantages:**
- High confidence that the full path works end-to-end.
- Catches middleware, serialization, and configuration issues.

**Limitations:**
- Slower execution.
- Failures harder to diagnose (more components to investigate).
- More complex setup and teardown.

## Boundary Classification

### Internal Boundaries

Interactions between components you own and control:

| Boundary | Example | Test Approach |
|----------|---------|--------------|
| Service to Repository | `OrderService -> OrderRepository` | Narrow integration with real DB |
| Controller to Service | `UserController -> UserService` | Broad integration with HTTP client |
| Event Producer to Consumer | `OrderCreated -> InventoryUpdater` | Narrow integration with real queue |

### External Boundaries

Interactions with third-party services, APIs, or infrastructure you do not control:

| Boundary | Example | Test Approach |
|----------|---------|--------------|
| Service to Payment API | `OrderService -> Stripe` | Contract test + stub in integration |
| Service to Email Provider | `NotificationService -> SendGrid` | Contract test + stub in integration |
| Service to Cloud Storage | `FileService -> S3` | LocalStack or MinIO container |

**Rule:** Never call real external services in automated tests. Use contract tests to verify the interface and stubs/containers to simulate the behavior.

## Choosing the Right Scope

### Decision Framework

```
Q: Does the interaction cross a network boundary?
  Yes -> Use contract test for the interface + stub for integration test
  No  -> Continue

Q: Does the interaction involve data persistence?
  Yes -> Use a real database (container) for integration test
  No  -> Continue

Q: Does the interaction involve serialization/deserialization?
  Yes -> Use broad integration test to verify the full path
  No  -> Unit test is sufficient
```

### The Testing Pyramid Applied

```
         /  E2E  \          Few, slow, expensive
        /----------\
       / Integration \      Moderate count, moderate speed
      /----------------\
     /    Unit Tests     \  Many, fast, cheap
    /____________________\
```

Integration tests sit in the middle. They should be:
- More numerous than E2E tests (10x).
- Less numerous than unit tests (0.1x).
- Fast enough to run on every PR (< 5 minutes total).

## Boundary Anti-Patterns

### Testing Too Deep

```
# Bad: integration test that mocks everything
def test_create_order():
    mock_repo = Mock()
    mock_payment = Mock()
    mock_email = Mock()
    service = OrderService(mock_repo, mock_payment, mock_email)
    # This is a unit test pretending to be an integration test
```

If all dependencies are mocked, it is a unit test. Integration tests must have at least one real collaborator.

### Testing Too Broad

```
# Bad: integration test that depends on 5 external services
def test_checkout_flow():
    # Requires: database, payment API, email service, inventory service, shipping API
    # Flaky, slow, hard to diagnose
```

Keep the number of real dependencies to 1-3 per integration test. More than that belongs in an E2E test.

### Missing Boundary

```
# Bad: no test at the boundary between services
# Service A serializes data and sends over HTTP
# Service B deserializes and processes
# But nobody tests that the serialization formats match
```

Every boundary where data crosses a serialization/deserialization step needs a test. This is where contract tests are essential.

## Documenting Boundaries

Maintain a boundary map for your system:

```markdown
## System Integration Boundaries

| Source        | Target          | Protocol | Contract    | Test Type          |
|--------------|----------------|----------|-------------|-------------------|
| frontend     | user-service    | HTTP/REST | user.pact   | Consumer contract |
| order-service | payment-service | HTTP/REST | payment.pact | Consumer contract |
| order-service | PostgreSQL      | SQL      | migrations   | Container test    |
| order-service | RabbitMQ       | AMQP     | event schema | Container test    |
| inventory-svc | order-events   | AMQP     | event schema | Consumer contract |
```

This map serves as the test planning document. Every row needs at least one integration test.

## Versioning Boundaries

When boundaries evolve (new fields, deprecated endpoints, changed schemas):

1. **Add the new contract** alongside the old one.
2. **Verify both contracts** in the provider's CI.
3. **Migrate consumers** to the new contract.
4. **Remove the old contract** only after all consumers have migrated.

This prevents the "big bang" migration that breaks all consumers simultaneously.
