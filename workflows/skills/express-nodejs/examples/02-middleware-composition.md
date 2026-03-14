# Example: Middleware Composition with AsyncLocalStorage

## Prompt

> Create an Express 5.x middleware composition layer in TypeScript with timing, JWT auth with declaration merging, role-based authorization factory, and AsyncLocalStorage-based request-scoped logger. Compose into a reusable admin middleware stack and test it.

## Expected Output

The skill should produce composable middleware with tests:

### TypeScript Declaration Merging

```typescript
// types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'admin' | 'editor' | 'viewer';
      };
    }
  }
}
export {};
```

### Timing Middleware

```typescript
export function timing(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    try {
      await next();
    } finally {
      // Set header even when handler throws
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
      }
    }
  };
}
```

### JWT Auth Middleware

```typescript
import jwt from 'jsonwebtoken';
import { AppError } from '../errors';

export function authenticate(secret: string): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid Authorization header', 401, 'UNAUTHORIZED');
    }

    try {
      const token = header.slice(7);
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      req.user = {
        id: payload.sub!,
        email: payload.email,
        role: payload.role,
      };
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid token', 401, 'UNAUTHORIZED');
    }
  };
}
```

### Role Authorization Factory

```typescript
export function authorize(...allowedRoles: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        `Role '${req.user.role}' is not authorized for this resource`,
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
}
```

### AsyncLocalStorage Logger

```typescript
import { AsyncLocalStorage } from 'node:async_hooks';
import pino from 'pino';

interface RequestContext {
  requestId: string;
  logger: pino.Logger;
}

const als = new AsyncLocalStorage<RequestContext>();

export function requestContext(baseLogger: pino.Logger): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    const logger = baseLogger.child({ requestId });

    als.run({ requestId, logger }, () => {
      next();
    });
  };
}

export function getLogger(): pino.Logger {
  const ctx = als.getStore();
  if (!ctx) {
    throw new Error('getLogger() called outside request context');
  }
  return ctx.logger;
}

export function getRequestId(): string {
  return als.getStore()?.requestId ?? 'unknown';
}
```

### Composed Admin Middleware Stack

```typescript
export function adminStack(jwtSecret: string, baseLogger: pino.Logger) {
  return [
    timing(),
    requestContext(baseLogger),
    authenticate(jwtSecret),
    authorize('admin'),
  ];
}

// Usage in routes
const adminRouter = express.Router();
adminRouter.use(...adminStack(config.jwtSecret, logger));
adminRouter.get('/dashboard', dashboardHandler);
adminRouter.post('/settings', updateSettingsHandler);
app.use('/admin', adminRouter);
```

### Tests

```typescript
import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import pino from 'pino';

const SECRET = 'test-secret';
const logger = pino({ level: 'silent' });

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(...adminStack(SECRET, logger));

  app.get('/admin/test', async (req, res) => {
    // Use AsyncLocalStorage logger inside handler
    const log = getLogger();
    log.info('handler executed');
    // Simulate async work to test ALS propagation
    await new Promise((resolve) => setTimeout(resolve, 10));
    const reqId = getRequestId();
    res.json({ user: req.user, requestId: reqId });
  });

  app.use(errorHandler);
  return app;
}

describe('Admin middleware stack', () => {
  const app = buildApp();
  const adminToken = jwt.sign(
    { sub: 'user-1', email: 'admin@test.com', role: 'admin' },
    SECRET,
    { expiresIn: '1h' }
  );
  const editorToken = jwt.sign(
    { sub: 'user-2', email: 'editor@test.com', role: 'editor' },
    SECRET,
    { expiresIn: '1h' }
  );
  const expiredToken = jwt.sign(
    { sub: 'user-3', email: 'old@test.com', role: 'admin' },
    SECRET,
    { expiresIn: '-1s' }
  );

  it('allows admin access and sets timing header', async () => {
    const res = await request(app)
      .get('/admin/test')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.headers['x-response-time']).toMatch(/^\d+\.\d+ms$/);
    expect(res.body.user.role).toBe('admin');
    expect(res.body.requestId).toBeDefined();
  });

  it('rejects expired tokens with structured error', async () => {
    const res = await request(app)
      .get('/admin/test')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(res.body.code).toBe('TOKEN_EXPIRED');
    // Timing header should still be set even on error
    expect(res.headers['x-response-time']).toBeDefined();
  });

  it('returns 403 for non-admin roles', async () => {
    const res = await request(app)
      .get('/admin/test')
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(403);

    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('propagates request ID through AsyncLocalStorage', async () => {
    const res = await request(app)
      .get('/admin/test')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Request-Id', 'trace-abc-123')
      .expect(200);

    // Request ID from ALS matches the one sent in the header
    expect(res.body.requestId).toBe('trace-abc-123');
  });
});
```

## Key Observations

- Declaration merging adds `user` to the Express Request interface for type-safe access.
- Timing middleware uses `try/finally` around `await next()` so the header is set even on errors.
- Role authorization is a factory function that returns middleware, enabling `authorize('admin', 'editor')`.
- AsyncLocalStorage replaces the need to thread a logger through every function call.
- The composed stack is a simple array spread onto a router, making it reusable.
- Tests verify end-to-end: timing on errors, token expiry, role rejection, and ALS propagation across async boundaries.
