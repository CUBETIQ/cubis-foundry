# Example: Secure TypeScript API

## Prompt

> Build a secure Express 5.x API in TypeScript for user management with helmet, CORS, rate limiting, zod validation, custom error classes, and supertest tests.

## Expected Output

The skill should produce a TypeScript Express application with full security and testing:

### Application Setup (app.ts)

```typescript
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import { usersRouter } from './routes/users';
import { errorHandler } from './middleware/error-handler';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();

// Security headers with explicit CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

// CORS with allow-list
app.use(cors({
  origin: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Body parsing with size limit
app.use(express.json({ limit: '100kb' }));

// Request logging with ID
app.use(pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] as string || uuidv4(),
}));

// Rate limiting with Redis store
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
});
app.use(limiter);

// Routes
app.use('/api/v1/users', usersRouter);

// Error handler MUST be last
app.use(errorHandler);

export { app };
```

### Custom Error Classes

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  public readonly fields: Array<{ field: string; message: string }>;

  constructor(fields: Array<{ field: string; message: string }>) {
    super('Validation failed', 400, 'VALIDATION_ERROR');
    this.fields = fields;
  }
}
```

### Zod Validation Middleware

```typescript
import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new ValidationError(fields);
    }
    req.body = result.data;
    next();
  };
}

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'editor', 'viewer']),
});
```

### Centralized Error Handler

```typescript
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.fields,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
    return;
  }

  // Unexpected error -- log full stack, send generic message
  req.log.error({ err }, 'Unhandled error');
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}
```

### Integration Tests

```typescript
import request from 'supertest';
import { app } from '../app';

describe('POST /api/v1/users', () => {
  it('creates a user with valid input', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({ email: 'test@example.com', name: 'Test User', role: 'editor' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('test@example.com');
  });

  it('returns 400 with field errors for invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({ email: 'not-an-email', name: '' })
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'name' }),
      ])
    );
  });

  it('returns 429 when rate limit is exceeded', async () => {
    // Send requests up to the limit
    for (let i = 0; i < 100; i++) {
      await request(app).get('/api/v1/users');
    }

    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(429);
  });
});
```

## Key Observations

- App is exported separately from server listening for testability.
- Helmet CSP directives are explicit, not just defaults.
- CORS uses a split-and-filter pattern for environment-based allow-lists.
- Rate limiter uses Redis store for distributed correctness.
- Zod validation middleware is reusable across routes.
- Error handler maps typed errors to structured responses and never leaks stack traces.
- Tests cover success, validation failure, and rate limiting without a running server.
