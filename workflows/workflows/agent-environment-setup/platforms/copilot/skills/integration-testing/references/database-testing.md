# Database Testing

## Why Test Against a Real Database

Mocking the database in integration tests hides critical categories of bugs:

- SQL syntax errors and typos.
- Query performance issues (missing indexes, full table scans).
- Schema mismatches between code and migrations.
- Transaction isolation and deadlock behavior.
- Database-specific behavior (NULL handling, collation, type coercion).
- Constraint violations (unique, foreign key, check constraints).

## Test Database Strategies

### Testcontainers (Recommended for CI)

Spin up a fresh database instance per test suite using Docker containers.

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('testdb')
    .start();
  // container.getConnectionUri() returns the connection string
}, 60_000);

afterAll(async () => {
  await container.stop();
});
```

**Advantages:** Complete isolation, production-like fidelity, works in CI.
**Disadvantages:** Container startup time (5-15 seconds), requires Docker.

### In-Memory Databases (SQLite for Local Development)

Use SQLite in-memory mode for fast local development testing.

```python
# pytest conftest.py
@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = Session(engine)
    yield session
    session.close()
```

**Advantages:** Instant startup, no Docker required.
**Disadvantages:** Behavior differs from production database (e.g., no JSONB, different locking).

### Shared Test Database (Discouraged)

A persistent database instance shared across developers and CI runs.

**Disadvantages:** State pollution, ordering dependencies, "works for me" failures, contention.

Use only as a last resort when containers are not available.

## Schema Management in Tests

### Always Run Migrations

Tests must use the same schema creation path as production:

```typescript
// GOOD: run the actual migration scripts
await runMigrations(connectionString);

// BAD: create tables manually in test setup
await db.query('CREATE TABLE users (id SERIAL, name TEXT)');
// This will drift from the real schema over time
```

### Migration Order

```
1. Start container
2. Connect to database
3. Run all pending migrations
4. Seed test data (fixtures)
5. Run tests
6. Teardown
```

## Test Data Isolation

### Transaction Rollback (Fastest)

Wrap each test in a transaction and roll back after:

```typescript
let client: PoolClient;

beforeEach(async () => {
  client = await pool.connect();
  await client.query('BEGIN');
});

afterEach(async () => {
  await client.query('ROLLBACK');
  client.release();
});
```

**Advantages:** Extremely fast, zero cleanup needed.
**Limitations:** Cannot test code that manages its own transactions. Cannot test commit/rollback behavior.

### Truncate Tables (Moderate)

Delete all data between tests:

```typescript
afterEach(async () => {
  await db.query('TRUNCATE users, orders, products RESTART IDENTITY CASCADE');
});
```

**Advantages:** Works with code that manages transactions.
**Disadvantages:** Slower than rollback, must list all tables, must handle foreign keys.

### Unique Identifiers (Most Flexible)

Generate unique test data per test using UUIDs or timestamps:

```python
def test_create_user():
    unique_email = f"test-{uuid4()}@example.com"
    user = create_user(name="Test", email=unique_email)
    assert user.email == unique_email
```

**Advantages:** No cleanup needed, tests can run in parallel.
**Disadvantages:** Orphaned data accumulates, harder to debug with random data.

## Testing Specific Database Features

### Query Correctness

Verify that queries return the expected data:

```typescript
test('findActiveUsers returns only non-deleted users', async () => {
  await seed([
    { name: 'Active', deleted_at: null },
    { name: 'Deleted', deleted_at: new Date() },
  ]);

  const result = await repo.findActiveUsers();

  expect(result).toHaveLength(1);
  expect(result[0].name).toBe('Active');
});
```

### Constraint Enforcement

Verify that database constraints work:

```typescript
test('rejects duplicate email', async () => {
  await repo.createUser({ email: 'alice@test.com' });

  await expect(
    repo.createUser({ email: 'alice@test.com' })
  ).rejects.toThrow(/unique constraint/i);
});
```

### Transaction Behavior

Verify that operations are atomic:

```typescript
test('transfers funds atomically', async () => {
  await seedAccounts([
    { id: 'A', balance: 100 },
    { id: 'B', balance: 50 },
  ]);

  // Simulate failure mid-transfer
  jest.spyOn(repo, 'credit').mockRejectedValueOnce(new Error('DB error'));

  await expect(
    repo.transfer('A', 'B', 30)
  ).rejects.toThrow();

  // Both balances should be unchanged (transaction rolled back)
  expect(await repo.getBalance('A')).toBe(100);
  expect(await repo.getBalance('B')).toBe(50);
});
```

### Migration Testing

Verify that migrations apply and rollback cleanly:

```typescript
test('migration 003 adds email_verified column', async () => {
  await runMigrationsUpTo(2);  // Apply first two migrations

  // Verify column does not exist
  const before = await db.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified'"
  );
  expect(before.rows).toHaveLength(0);

  await runMigration(3);  // Apply third migration

  // Verify column exists with default value
  const after = await db.query(
    "SELECT column_default FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified'"
  );
  expect(after.rows).toHaveLength(1);
  expect(after.rows[0].column_default).toBe('false');
});
```

## Performance Considerations

| Strategy | Setup Time | Per-Test Time | Parallelizable |
|----------|-----------|---------------|----------------|
| Testcontainers | 5-15s (once) | 0ms (rollback) | Yes (separate containers) |
| SQLite in-memory | 0s | 1-5ms | Yes (separate instances) |
| Shared database | 0s | 10-50ms (truncate) | No (contention) |
| Unique IDs | 0s | 1-5ms | Yes |

For a suite of 100 database tests, target under 60 seconds total. If it exceeds that, parallelize or reduce the number of broad tests.
