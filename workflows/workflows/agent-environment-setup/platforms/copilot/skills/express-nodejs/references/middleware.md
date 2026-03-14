# Express Middleware

## Middleware Fundamentals

Express middleware functions receive `(req, res, next)`. They can execute code, modify the request/response, end the request-response cycle, or call `next()` to pass control downstream. Error-handling middleware uses `(err, req, res, next)`.

```typescript
// Basic middleware
const requestLogger: RequestHandler = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

// Async middleware (Express 5 catches rejected promises)
const asyncMiddleware: RequestHandler = async (req, res, next) => {
  const data = await fetchSomeData();
  req.data = data;
  next();
};

// Error-handling middleware (must have 4 parameters)
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  res.status(err.statusCode || 500).json({ error: err.message });
};
```

## Middleware Execution Order

Middleware runs in registration order. The sequence matters for correctness and security.

```typescript
const app = express();

// 1. Security headers (first to protect all responses)
app.use(helmet());

// 2. CORS (before body parsing, handles preflight)
app.use(cors(corsConfig));

// 3. Body parsing (before any route that reads req.body)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 4. Request logging (after parsing, before routes)
app.use(requestLogger);

// 5. Rate limiting (before routes, after logging so rejected requests are logged)
app.use(globalRateLimiter);

// 6. Routes
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/products', productsRouter);

// 7. 404 handler (after all routes)
app.use(notFoundHandler);

// 8. Error handler (MUST be last, MUST have 4 parameters)
app.use(errorHandler);
```

## Built-in Middleware

### express.json()

Parses JSON request bodies.

```typescript
app.use(express.json({
  limit: '100kb',        // Reject bodies larger than 100kb
  strict: true,          // Only accept arrays and objects
  type: 'application/json',
}));
```

### express.urlencoded()

Parses URL-encoded form data.

```typescript
app.use(express.urlencoded({
  extended: true,   // Use qs library for rich objects
  limit: '100kb',
  parameterLimit: 1000,
}));
```

### express.static()

Serves static files.

```typescript
app.use('/assets', express.static('public', {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  index: false,         // Disable directory index
  dotfiles: 'ignore',   // Reject dotfiles
}));
```

## Common Third-Party Middleware

### Helmet (Security Headers)

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

### CORS

```typescript
import cors from 'cors';

const allowedOrigins = process.env.CORS_ORIGINS?.split(',') ?? [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Request-Id', 'X-Response-Time'],
  maxAge: 86400,
}));
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
  message: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts' },
});

app.use(globalLimiter);
app.post('/api/v1/auth/login', authLimiter, loginHandler);
```

## Custom Middleware Patterns

### Request ID Middleware

```typescript
import { v4 as uuidv4 } from 'uuid';

function requestId(): RequestHandler {
  return (req, res, next) => {
    const id = (req.headers['x-request-id'] as string) || uuidv4();
    req.id = id;
    res.setHeader('X-Request-Id', id);
    next();
  };
}
```

### Request Timing

```typescript
function timing(): RequestHandler {
  return async (req, res, next) => {
    const start = process.hrtime.bigint();
    try {
      await next();
    } finally {
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
      }
    }
  };
}
```

### Authentication

```typescript
function authenticate(secret: string): RequestHandler {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing Authorization header');
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = { id: payload.sub!, email: payload.email, role: payload.role };
    next();
  };
}
```

### Authorization Factory

```typescript
function authorize(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Role '${req.user.role}' not authorized`);
    }
    next();
  };
}

// Usage
router.delete('/users/:id', authorize('admin'), deleteUser);
```

## Router-Level Middleware

Apply middleware to specific route groups.

```typescript
const usersRouter = express.Router();

// Middleware for all user routes
usersRouter.use(authenticate(config.jwtSecret));

// Route-specific middleware
usersRouter.get('/', listUsers);
usersRouter.post('/', validate(createUserSchema), createUser);
usersRouter.delete('/:id', authorize('admin'), deleteUser);

app.use('/api/v1/users', usersRouter);
```

## Middleware Composition

Combine middleware into reusable stacks.

```typescript
function protectedRoute(...extraMiddleware: RequestHandler[]) {
  return [
    authenticate(config.jwtSecret),
    ...extraMiddleware,
  ];
}

function adminRoute() {
  return protectedRoute(authorize('admin'));
}

// Usage
router.get('/dashboard', ...adminRoute(), dashboardHandler);
router.post('/reports', ...protectedRoute(validate(reportSchema)), createReport);
```

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Error handler with 3 params | Must have `(err, req, res, next)` -- all 4 |
| Error handler before routes | Place error handlers AFTER all routes |
| Calling `next()` after `res.send()` | Only call `next()` OR send a response |
| Forgetting `await` on async `next()` | Use `await next()` in async middleware |
| Not calling `next()` at all | Request hangs until timeout |
| Sending response twice | Check `res.headersSent` before writing |
