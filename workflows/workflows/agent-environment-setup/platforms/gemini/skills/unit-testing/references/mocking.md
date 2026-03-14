# Mocking Strategies

## Test Double Taxonomy

Understanding the distinction between test double types prevents overuse and misuse.

### Stubs

Stubs provide canned answers to calls made during the test. They do not record interactions.

```typescript
// Stub: provides a fixed return value
const priceServiceStub = {
  getPrice: (productId: string) => 29.99,
};
```

**When to use:** The collaborator's return value drives the unit's behavior, and you need to control that value for your test scenario.

### Mocks

Mocks are pre-programmed with expectations about how they will be called. They verify interaction behavior.

```typescript
// Mock: verifies the call was made correctly
const emailServiceMock = jest.fn();
// ... run the unit ...
expect(emailServiceMock).toHaveBeenCalledWith('user@test.com', expect.any(String));
```

**When to use:** The important behavior is that the unit *calls* the collaborator correctly (e.g., sends the right message to a queue).

### Fakes

Fakes have working implementations but are simplified. They replace complex dependencies with lightweight alternatives.

```typescript
// Fake: simplified in-memory implementation
class FakeUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
}
```

**When to use:** Multiple tests need a realistic collaborator without I/O overhead. Fakes are especially useful for repositories and caches.

### Spies

Spies wrap real implementations and record calls while still executing the original code.

```typescript
// Spy: wraps real implementation, records calls
const spy = jest.spyOn(logger, 'warn');
// ... run the unit ...
expect(spy).toHaveBeenCalledTimes(1);
// The real logger.warn was also called
```

**When to use:** You want to verify a call happened but still need the real behavior (e.g., logging, analytics).

## Decision Framework

| Question | If Yes | If No |
|----------|--------|-------|
| Do I need to control the return value? | Stub | -- |
| Do I need to verify the call was made? | Mock | Stub |
| Do I need realistic behavior across many tests? | Fake | Stub or Mock |
| Do I need the real behavior plus verification? | Spy | Mock |

## Mocking Best Practices

### Mock Only Direct Collaborators

The unit under test should only interact with its immediate dependencies. Mocking transitive dependencies creates brittle tests.

```
GOOD: OrderService -> mock(PaymentGateway)
BAD:  OrderService -> mock(PaymentGateway) -> mock(HttpClient) -> mock(TlsSocket)
```

### Prefer Stubs Over Mocks by Default

Stubs are simpler, less coupled, and focus tests on outcomes rather than interactions. Use mocks only when the interaction itself is the behavior being tested.

```typescript
// Prefer: assert on the return value (uses stub)
const discount = calculateDiscount(stubPriceService);
expect(discount).toBe(5.00);

// Only when needed: verify interaction (uses mock)
await sendNotification(user, mockEmailService);
expect(mockEmailService.send).toHaveBeenCalledWith(user.email, expect.any(String));
```

### Avoid Mocking What You Don't Own

Wrapping third-party libraries in your own adapter and mocking the adapter gives you:
- Control over the interface (it matches your domain language).
- A single place to update when the library changes.
- Tests that don't break when the library updates its internal API.

```typescript
// Own adapter
class PaymentAdapter {
  constructor(private stripe: Stripe) {}
  async charge(amount: number, token: string): Promise<ChargeResult> {
    const result = await this.stripe.charges.create({ amount, source: token });
    return { id: result.id, status: result.status };
  }
}

// Mock your adapter, not Stripe directly
const mockPayment = { charge: jest.fn().mockResolvedValue({ id: 'ch_1', status: 'succeeded' }) };
```

## Common Mocking Pitfalls

### Over-Specification

Setting up mocks with exact argument matchers when the specific arguments are irrelevant to the test:

```typescript
// Over-specified: breaks if argument order changes
expect(mock).toHaveBeenCalledWith('user@test.com', 'Welcome', { html: true, priority: 'normal' });

// Better: assert only what matters for this test
expect(mock).toHaveBeenCalledWith('user@test.com', expect.any(String), expect.anything());
```

### Mock Drift

When the real dependency changes its API but the mock still uses the old shape, tests pass but production breaks.

**Prevention:**
- Use TypeScript interfaces for mocks (compiler catches drift).
- Run integration tests alongside unit tests.
- Use contract tests for external service boundaries.

### Testing the Mock Instead of the Unit

```typescript
// BAD: this just tests that Jest mocking works
const mock = jest.fn().mockReturnValue(42);
expect(mock()).toBe(42); // Of course it returns 42, you told it to.

// GOOD: this tests that the unit uses the dependency correctly
const unit = new Calculator(mockTaxService);
const result = unit.calculateTotal(100);
expect(result).toBe(142); // Unit added tax from mock to its calculation
```

## Framework-Specific Patterns

### Jest (JavaScript/TypeScript)

```typescript
jest.mock('../services/EmailService'); // Auto-mock entire module
jest.spyOn(object, 'method');          // Spy on existing method
jest.fn().mockResolvedValue(data);     // Async stub
jest.fn().mockRejectedValue(error);    // Async error stub
```

### pytest (Python)

```python
from unittest.mock import Mock, patch, MagicMock

@patch('services.email.send')
def test_notification(mock_send):
    mock_send.return_value = True
    # ...

mock_repo = Mock(spec=UserRepository)  # Spec prevents calling non-existent methods
mock_repo.find_by_id.return_value = User(name="Alice")
```

### Go

```go
// Interface-based mocking (no framework needed)
type MockUserStore struct {
    FindByIDFn func(id string) (*User, error)
}

func (m *MockUserStore) FindByID(id string) (*User, error) {
    return m.FindByIDFn(id)
}

// In test:
store := &MockUserStore{
    FindByIDFn: func(id string) (*User, error) {
        return &User{Name: "Alice"}, nil
    },
}
```

## Reset and Cleanup

Always reset mocks between tests to prevent state leakage:

```typescript
afterEach(() => {
  jest.restoreAllMocks();   // Restores spied methods to originals
  jest.clearAllMocks();     // Clears call history and return values
});
```

Not resetting mocks is the most common cause of test interdependence in mock-heavy suites.
