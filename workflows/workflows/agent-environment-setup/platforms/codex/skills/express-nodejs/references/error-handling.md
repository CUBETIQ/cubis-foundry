# Express Error Handling

## Error Handling Strategy

Express 5.x automatically catches errors thrown in async route handlers and passes them to the error-handling middleware. This eliminates the need for try/catch wrappers or libraries like `express-async-errors`.

```typescript
// Express 5: async errors are caught automatically
router.get('/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('User'); // Automatically caught by error handler
  }
  res.json(user);
});

// Express 4: required manual error forwarding
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) throw new NotFoundError('User');
    res.json(user);
  } catch (err) {
    next(err); // Must manually forward
  }
});
```

## Custom Error Classes

Define a hierarchy of error classes that carry HTTP status codes and error codes.

```typescript
// Base application error
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 Bad Request
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

// 401 Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(resource: string, field: string) {
    super(`${resource} with this ${field} already exists`, 409, 'CONFLICT');
  }
}

// 422 Validation Error
export class ValidationError extends AppError {
  public readonly fields: Array<{ field: string; message: string }>;

  constructor(fields: Array<{ field: string; message: string }>) {
    super('Validation failed', 422, 'VALIDATION_ERROR');
    this.fields = fields;
  }
}

// 429 Rate Limited
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}
```

## Centralized Error Handler

The error handler must be the last middleware registered. It must have exactly four parameters to be recognized by Express as an error handler.

```typescript
import { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Validation errors (from zod, joi, etc.)
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.fields,
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      code: err.code,
      message: err.message,
    };

    if (err instanceof RateLimitError) {
      res.setHeader('Retry-After', String(err.retryAfter));
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // Zod validation errors (if thrown directly)
  if (err.name === 'ZodError') {
    const zodErr = err as import('zod').ZodError;
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: zodErr.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({
      code: 'INVALID_JSON',
      message: 'Request body contains invalid JSON',
    });
    return;
  }

  // Payload too large
  if (err.type === 'entity.too.large') {
    res.status(413).json({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request body exceeds the size limit',
    });
    return;
  }

  // Unexpected errors -- log full details, send generic response
  req.log?.error({ err }, 'Unhandled error');
  console.error('Unhandled error:', err);

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    // NEVER send err.stack or err.message to the client for unexpected errors
  });
};
```

## 404 Not Found Handler

Register before the error handler but after all routes.

```typescript
const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

// Registration order
app.use('/api', apiRouter);
app.use(notFoundHandler);  // After routes
app.use(errorHandler);     // After 404
```

## Validation Middleware with Zod

Create a reusable validation middleware that transforms Zod errors into structured responses.

```typescript
import { ZodSchema } from 'zod';

interface ValidateOptions {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidateOptions): RequestHandler {
  return (req, _res, next) => {
    const errors: Array<{ field: string; message: string }> = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((i) => ({
            field: `body.${i.path.join('.')}`,
            message: i.message,
          }))
        );
      } else {
        req.body = result.data; // Replace with parsed/coerced data
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((i) => ({
            field: `params.${i.path.join('.')}`,
            message: i.message,
          }))
        );
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((i) => ({
            field: `query.${i.path.join('.')}`,
            message: i.message,
          }))
        );
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    next();
  };
}

// Usage
router.post(
  '/users',
  validate({ body: createUserSchema }),
  createUser
);

router.get(
  '/users/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  getUser
);
```

## Error Response Envelope

All error responses must follow a consistent structure.

```typescript
interface ErrorEnvelope {
  code: string;                              // Machine-readable error code
  message: string;                           // Human-readable message
  details?: Array<{ field: string; message: string }>; // Field-level errors
}
```

Example responses:

```json
// 400 Validation Error
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    { "field": "body.email", "message": "Invalid email" },
    { "field": "body.name", "message": "Required" }
  ]
}

// 401 Unauthorized
{
  "code": "UNAUTHORIZED",
  "message": "Authentication required"
}

// 404 Not Found
{
  "code": "NOT_FOUND",
  "message": "User not found"
}

// 500 Internal Error
{
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

## Async Error Patterns

```typescript
// Express 5: just throw
router.get('/data', async (req, res) => {
  const data = await riskyOperation(); // If this rejects, error handler catches it
  res.json(data);
});

// Service layer: throw typed errors
class UserService {
  async findById(id: string): Promise<User> {
    const user = await this.repo.find(id);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async create(data: CreateUserDto): Promise<User> {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) throw new ConflictError('User', 'email');
    return this.repo.insert(data);
  }
}
```
