# Express Testing

## Testing Strategy

Express testing uses `supertest` for integration tests against the app module and `vitest` or `jest` as the test runner. The app must be separated from the server listener so tests can import it without binding a port.

## Setup

### Project Structure

```
src/
  app.ts              # Express app (exported)
  server.ts           # Calls app.listen() (not imported in tests)
  routes/
    users.ts
  middleware/
    auth.ts
    validate.ts
    error-handler.ts
  services/
    user-service.ts
tests/
  integration/
    users.test.ts
    auth.test.ts
  unit/
    user-service.test.ts
    validate.test.ts
```

### Test Configuration (vitest)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts'],
    },
  },
});
```

## Integration Tests with Supertest

```typescript
import request from 'supertest';
import { createApp } from '../src/app';

describe('Users API', () => {
  let app: Express;

  beforeAll(async () => {
    const deps = await createTestDependencies();
    app = createApp(deps);
  });

  afterAll(async () => {
    await cleanupTestDependencies();
  });

  describe('POST /api/v1/users', () => {
    it('creates a user with valid input', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'new@example.com',
          name: 'New User',
          role: 'editor',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe('new@example.com');
      expect(res.body.name).toBe('New User');
      expect(res.body.role).toBe('editor');
      expect(res.body).not.toHaveProperty('password');
    });

    it('returns 400 with field errors for invalid input', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'not-an-email',
          name: '',
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: expect.stringContaining('email') }),
          expect.objectContaining({ field: expect.stringContaining('name') }),
        ])
      );
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .send({ email: 'test@example.com', name: 'Test', role: 'viewer' })
        .expect(401);

      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('returns 409 for duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'dupe@example.com', name: 'First', role: 'viewer' })
        .expect(201);

      // Attempt duplicate
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'dupe@example.com', name: 'Second', role: 'viewer' })
        .expect(409);

      expect(res.body.code).toBe('CONFLICT');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('returns the user for a valid ID', async () => {
      const createRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'fetch@example.com', name: 'Fetch Me', role: 'viewer' })
        .expect(201);

      const res = await request(app)
        .get(`/api/v1/users/${createRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.email).toBe('fetch@example.com');
    });

    it('returns 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.code).toBe('NOT_FOUND');
    });
  });
});
```

## Testing Middleware

### Testing Auth Middleware in Isolation

```typescript
import request from 'supertest';
import express from 'express';
import { authenticate } from '../src/middleware/auth';
import { errorHandler } from '../src/middleware/error-handler';

function buildAuthTestApp() {
  const app = express();
  app.use(express.json());
  app.use(authenticate('test-secret'));
  app.get('/test', (req, res) => {
    res.json({ user: req.user });
  });
  app.use(errorHandler);
  return app;
}

describe('Auth middleware', () => {
  const app = buildAuthTestApp();

  it('passes with valid token', async () => {
    const token = jwt.sign({ sub: 'user-1', role: 'admin' }, 'test-secret');
    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.user.id).toBe('user-1');
  });

  it('rejects missing Authorization header', async () => {
    await request(app)
      .get('/test')
      .expect(401);
  });

  it('rejects expired tokens', async () => {
    const token = jwt.sign({ sub: 'user-1' }, 'test-secret', { expiresIn: '-1s' });
    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });
});
```

### Testing Validation Middleware

```typescript
describe('Validation middleware', () => {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
  });

  const app = express();
  app.use(express.json());
  app.post('/test', validate({ body: schema }), (req, res) => {
    res.status(201).json(req.body);
  });
  app.use(errorHandler);

  it('passes valid input through', async () => {
    await request(app)
      .post('/test')
      .send({ email: 'valid@test.com', name: 'Test' })
      .expect(201);
  });

  it('returns structured field errors for invalid input', async () => {
    const res = await request(app)
      .post('/test')
      .send({ email: 'bad', name: '' })
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details.length).toBeGreaterThanOrEqual(2);
  });
});
```

## Testing Error Handling

```typescript
describe('Error handler', () => {
  const app = express();

  app.get('/not-found', async () => {
    throw new NotFoundError('Widget');
  });

  app.get('/validation', async () => {
    throw new ValidationError([
      { field: 'email', message: 'Invalid email' },
    ]);
  });

  app.get('/unexpected', async () => {
    throw new Error('Something broke');
  });

  app.use(errorHandler);

  it('formats NotFoundError as 404 JSON', async () => {
    const res = await request(app).get('/not-found').expect(404);
    expect(res.body).toEqual({
      code: 'NOT_FOUND',
      message: 'Widget not found',
    });
  });

  it('formats ValidationError with field details', async () => {
    const res = await request(app).get('/validation').expect(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toHaveLength(1);
  });

  it('returns generic 500 for unexpected errors without stack traces', async () => {
    const res = await request(app).get('/unexpected').expect(500);
    expect(res.body).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
    expect(res.body).not.toHaveProperty('stack');
  });
});
```

## Testing Headers and Security

```typescript
describe('Security headers', () => {
  it('sets Helmet security headers', async () => {
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  it('sets CORS headers for allowed origins', async () => {
    const res = await request(app)
      .options('/api/v1/users')
      .set('Origin', 'https://allowed.example.com')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBe('https://allowed.example.com');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects CORS from disallowed origins', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Origin', 'https://evil.example.com')
      .set('Authorization', `Bearer ${token}`);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
```

## Test Utilities

```typescript
// tests/helpers.ts
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret-for-testing-only';

export function createTestToken(overrides: Partial<JwtPayload> = {}): string {
  return jwt.sign(
    {
      sub: 'test-user-1',
      email: 'test@example.com',
      role: 'admin',
      ...overrides,
    },
    TEST_SECRET,
    { expiresIn: '1h' }
  );
}

export function createExpiredToken(): string {
  return jwt.sign(
    { sub: 'test-user-1', email: 'test@example.com', role: 'admin' },
    TEST_SECRET,
    { expiresIn: '-1s' }
  );
}

export function expectError(res: request.Response, status: number, code: string) {
  expect(res.status).toBe(status);
  expect(res.body.code).toBe(code);
  expect(res.body.message).toBeDefined();
}
```

## Testing Checklist

| Area | What to Test |
| --- | --- |
| Routes | Success path, validation errors, auth errors, not found |
| Middleware | Each middleware in isolation + combined stack |
| Error handler | All error types, no stack trace leakage |
| Security | Headers present, CORS enforcement, rate limiting |
| Edge cases | Large payloads, malformed JSON, concurrent requests |
| Database | Create/read consistency, unique constraint handling |
