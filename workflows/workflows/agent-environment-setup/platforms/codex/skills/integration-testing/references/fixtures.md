# Fixture Management

## What Are Test Fixtures

Fixtures are the known data and state that tests rely on. They include database records, file system content, configuration values, and any preconditions required for a test to execute meaningfully.

Well-designed fixtures make tests readable, reliable, and maintainable. Poorly designed fixtures create hidden dependencies, slow tests, and mysterious failures.

## Fixture Strategies

### Inline Fixtures

Define test data directly in the test:

```typescript
test('calculateTotal applies discount', () => {
  const items = [
    { name: 'Widget', price: 10.00, quantity: 2 },
    { name: 'Gadget', price: 25.00, quantity: 1 },
  ];
  const discount = { code: 'SAVE10', percentage: 10 };

  const total = calculateTotal(items, discount);

  expect(total).toBe(40.50); // (20 + 25) * 0.9
});
```

**Advantages:** Everything visible in one place. No hunting for fixture definitions.
**Disadvantages:** Repetitive across tests. Verbose for complex objects.

### Factory Functions

Encapsulate object creation with sensible defaults:

```typescript
function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: randomUUID(),
    name: 'Test User',
    email: `test-${randomUUID()}@example.com`,
    role: 'member',
    createdAt: new Date(),
    ...overrides,
  };
}

// Usage: override only what matters for this test
test('admin can delete other users', async () => {
  const admin = buildUser({ role: 'admin' });
  const target = buildUser({ role: 'member' });

  await deleteUser(admin, target.id);

  expect(await findUser(target.id)).toBeNull();
});
```

**Advantages:** Concise tests, sensible defaults, easy to customize.
**Disadvantages:** Factory logic can become complex for deeply nested objects.

### Fixture Files

Store complex fixtures as JSON, YAML, or SQL files:

```
tests/
  fixtures/
    users.json
    orders.json
    products.sql
```

```typescript
import usersFixture from '../fixtures/users.json';

beforeEach(async () => {
  await db.users.insertMany(usersFixture);
});
```

**Advantages:** Separates data from test logic, reusable across test files.
**Disadvantages:** Changes to fixture files affect all dependent tests. Harder to see what data a specific test depends on.

### Builder Pattern

For complex objects with many optional fields:

```typescript
class UserBuilder {
  private user: Partial<User> = {
    name: 'Default User',
    email: 'default@test.com',
    role: 'member',
  };

  withName(name: string): this { this.user.name = name; return this; }
  withEmail(email: string): this { this.user.email = email; return this; }
  withRole(role: string): this { this.user.role = role; return this; }
  asAdmin(): this { this.user.role = 'admin'; return this; }

  build(): User {
    return {
      id: randomUUID(),
      createdAt: new Date(),
      ...this.user,
    } as User;
  }
}

// Usage
const admin = new UserBuilder().withName('Alice').asAdmin().build();
```

## Database Fixture Strategies

### Seed and Teardown

```typescript
beforeEach(async () => {
  await seedDatabase();   // Insert known records
});

afterEach(async () => {
  await cleanDatabase();  // Remove all test data
});
```

### Transaction Wrapper

```typescript
let transaction;

beforeEach(async () => {
  transaction = await db.beginTransaction();
  await seedWithin(transaction);
});

afterEach(async () => {
  await transaction.rollback();  // Instant cleanup
});
```

### Fixture Scoping

Match fixture lifecycle to test scope:

| Scope | Fixture Lifecycle | Use Case |
|-------|------------------|----------|
| Per-test | beforeEach/afterEach | Default. Maximum isolation. |
| Per-suite | beforeAll/afterAll | Expensive setup (container start, large data load). |
| Per-module | Module-level setup | Shared across multiple describe blocks. |
| Global | Global setup/teardown | Infrastructure only (container lifecycle). |

**Rule:** Use the narrowest scope possible. Broader scopes save time but risk state leakage.

## Fixture Anti-Patterns

### Shared Mutable Fixtures

```typescript
// BAD: shared object modified by tests
const user = { name: 'Alice', balance: 100 };

test('debit reduces balance', () => {
  debit(user, 30);
  expect(user.balance).toBe(70); // Passes
});

test('balance starts at 100', () => {
  expect(user.balance).toBe(100); // FAILS: balance is 70 from previous test
});
```

**Fix:** Create fresh fixtures per test or use immutable data.

### The God Fixture

```typescript
// BAD: one massive fixture file used by every test
beforeEach(async () => {
  await loadFixture('everything.json'); // 500 records across 20 tables
});
```

**Problems:** Slow setup, unclear which records each test needs, changes break unrelated tests.

**Fix:** Use factory functions that create only what each test needs.

### Fixture Duplication

```typescript
// BAD: same user data copy-pasted across 30 test files
const testUser = {
  id: '123',
  name: 'Alice',
  email: 'alice@test.com',
  role: 'admin',
  createdAt: '2025-01-15T00:00:00Z',
};
```

**Fix:** Extract into a shared factory or fixture module.

### Implicit Dependencies

```typescript
// BAD: test relies on fixture from a different test file
test('order total includes user discount', async () => {
  // Where is user 123 created? In another test's fixture? In global setup?
  const order = await createOrderForUser('123');
  expect(order.total).toBe(90);
});
```

**Fix:** Each test should create or reference its own data explicitly.

## Fixture Naming Conventions

Use names that indicate the fixture's purpose:

```
// Good: descriptive, indicates the state
const activeSubscription = buildSubscription({ status: 'active', expiresAt: futureDate() });
const expiredSubscription = buildSubscription({ status: 'expired', expiresAt: pastDate() });
const trialUser = buildUser({ plan: 'trial', trialEndsAt: futureDate() });

// Bad: generic, unclear
const sub1 = buildSubscription({ status: 'active' });
const sub2 = buildSubscription({ status: 'expired' });
const user1 = buildUser({ plan: 'trial' });
```

## Fixture Maintenance

### Version Fixtures with Schema Changes

When a database migration adds or changes a column, update factory functions and fixture files to include the new field. Stale fixtures that don't match the current schema cause confusing test failures.

### Audit Fixture Usage

Periodically check which fixtures are actually used:

```bash
# Find unused fixture files
grep -rL "fixtures/" tests/ | head -20
```

Remove unused fixtures to reduce maintenance burden.

### Document Fixture Dependencies

For complex test suites, document which tests depend on which fixtures:

```markdown
## Fixture Map

| Fixture | Used By | Purpose |
|---------|---------|---------|
| buildUser() | auth tests, profile tests, admin tests | Creates user records |
| buildOrder() | checkout tests, reporting tests | Creates order with line items |
| seedProducts() | catalog tests, search tests | Loads product catalog |
```
