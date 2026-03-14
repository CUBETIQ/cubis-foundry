# Example: Database Integration Tests with Testcontainers

## Context

A `UserRepository` performs CRUD operations against PostgreSQL. Integration tests must run in CI without a shared database, using ephemeral containers for isolation.

## User Prompt

> Set up integration tests for my UserRepository. It has createUser, getUserById, updateEmail, and deleteUser methods. I need real PostgreSQL queries tested, not mocks. Must work in GitHub Actions CI.

## Skill Response

### Infrastructure Setup with Testcontainers

```typescript
// tests/integration/setup/database.ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { migrate } from '../../../src/database/migrator';

let container: StartedPostgreSqlContainer;
let pool: Pool;

export async function startDatabase(): Promise<Pool> {
  // Spin up an ephemeral PostgreSQL container
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('testdb')
    .withUsername('testuser')
    .withPassword('testpass')
    .start();

  pool = new Pool({
    connectionString: container.getConnectionUri(),
  });

  // Run migrations to match production schema
  await migrate(pool);

  return pool;
}

export async function stopDatabase(): Promise<void> {
  await pool.end();
  await container.stop();
}

export function getPool(): Pool {
  return pool;
}
```

### Fixture Seeding

```typescript
// tests/integration/fixtures/users.ts
import { Pool } from 'pg';

export interface TestUser {
  id: string;
  name: string;
  email: string;
  created_at: Date;
}

export async function seedUsers(pool: Pool): Promise<TestUser[]> {
  const users: TestUser[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      created_at: new Date('2025-01-15'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Bob Smith',
      email: 'bob@example.com',
      created_at: new Date('2025-02-20'),
    },
  ];

  for (const user of users) {
    await pool.query(
      'INSERT INTO users (id, name, email, created_at) VALUES ($1, $2, $3, $4)',
      [user.id, user.name, user.email, user.created_at]
    );
  }

  return users;
}

export async function clearUsers(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM users');
}
```

### Test Suite with Per-Test Isolation

```typescript
// tests/integration/user-repository.test.ts
import { Pool, PoolClient } from 'pg';
import { UserRepository } from '../../src/repositories/UserRepository';
import { startDatabase, stopDatabase, getPool } from './setup/database';
import { seedUsers, clearUsers, TestUser } from './fixtures/users';

describe('UserRepository Integration Tests', () => {
  let pool: Pool;
  let client: PoolClient;
  let repo: UserRepository;
  let seededUsers: TestUser[];

  // Container lifecycle: once per suite
  beforeAll(async () => {
    pool = await startDatabase();
  }, 60_000); // container startup can take up to 60s

  afterAll(async () => {
    await stopDatabase();
  });

  // Transaction isolation: per test
  beforeEach(async () => {
    client = await pool.connect();
    await client.query('BEGIN');
    await seedUsers(pool);
    seededUsers = (await pool.query('SELECT * FROM users ORDER BY name'))
      .rows;
    repo = new UserRepository(client);
  });

  afterEach(async () => {
    // Rollback ensures no test data leaks to the next test
    await client.query('ROLLBACK');
    client.release();
  });

  describe('getUserById', () => {
    test('returns user when ID exists', async () => {
      const user = await repo.getUserById(seededUsers[0].id);

      expect(user).not.toBeNull();
      expect(user!.name).toBe('Alice Johnson');
      expect(user!.email).toBe('alice@example.com');
    });

    test('returns null when ID does not exist', async () => {
      const user = await repo.getUserById(
        '00000000-0000-0000-0000-000000000000'
      );

      expect(user).toBeNull();
    });
  });

  describe('createUser', () => {
    test('inserts new user and returns it with generated fields', async () => {
      const newUser = await repo.createUser({
        name: 'Carol Davis',
        email: 'carol@example.com',
      });

      expect(newUser.id).toBeDefined();
      expect(newUser.name).toBe('Carol Davis');
      expect(newUser.created_at).toBeInstanceOf(Date);

      // Verify it persisted in the database
      const fetched = await repo.getUserById(newUser.id);
      expect(fetched).not.toBeNull();
    });

    test('rejects duplicate email', async () => {
      await expect(
        repo.createUser({ name: 'Duplicate', email: 'alice@example.com' })
      ).rejects.toThrow(/unique constraint/i);
    });
  });

  describe('updateEmail', () => {
    test('updates email for existing user', async () => {
      await repo.updateEmail(seededUsers[0].id, 'newalice@example.com');

      const updated = await repo.getUserById(seededUsers[0].id);
      expect(updated!.email).toBe('newalice@example.com');
    });

    test('throws when user does not exist', async () => {
      await expect(
        repo.updateEmail(
          '00000000-0000-0000-0000-000000000000',
          'nobody@example.com'
        )
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('deleteUser', () => {
    test('removes user from database', async () => {
      await repo.deleteUser(seededUsers[1].id);

      const deleted = await repo.getUserById(seededUsers[1].id);
      expect(deleted).toBeNull();
    });

    test('is idempotent for already-deleted user', async () => {
      await repo.deleteUser(seededUsers[1].id);

      // Second delete should not throw
      await expect(
        repo.deleteUser(seededUsers[1].id)
      ).resolves.not.toThrow();
    });
  });
});
```

### CI Configuration

```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests
on: [pull_request]

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:integration
        env:
          TESTCONTAINERS_RYUK_DISABLED: 'false'
```

### Test Lifecycle Summary

```
Container Start (beforeAll)
  -> Run Migrations
    -> BEGIN Transaction (beforeEach)
      -> Seed Fixtures
        -> Run Test
      -> ROLLBACK Transaction (afterEach)
    -> BEGIN Transaction (next test)
      -> ...
  -> Container Stop (afterAll)
```

### Key Decisions

1. **Testcontainers over shared DB** -- Each CI run gets its own PostgreSQL instance, eliminating cross-run contamination.
2. **Transaction rollback for isolation** -- Faster than truncating tables and guarantees no data leaks between tests.
3. **Real migrations** -- The test schema matches production, catching migration-related bugs.
4. **60s timeout on beforeAll** -- Container pull and startup needs generous timeout in CI.
