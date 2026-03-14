# Express Security

## Security Headers with Helmet

Helmet sets HTTP response headers to protect against common web vulnerabilities.

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
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  hsts: {
    maxAge: 31536000,       // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,  // X-Content-Type-Options: nosniff
  xFrameOptions: { action: 'deny' },
}));

// Remove X-Powered-By (Helmet does this, but belt and suspenders)
app.disable('x-powered-by');
```

## CORS Configuration

```typescript
import cors from 'cors';

// Production: explicit allow-list
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,             // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-Response-Time', 'RateLimit-Remaining'],
  maxAge: 86400,                 // Cache preflight for 24 hours
  optionsSuccessStatus: 204,     // Some legacy browsers choke on 204
}));
```

**Never use `origin: '*'` with `credentials: true`** -- browsers will reject the response. And `origin: '*'` gives every website access to your API responses, which is rarely what you want in production.

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 100,                      // 100 requests per window
  standardHeaders: true,         // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,          // Disable X-RateLimit-* headers
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
  keyGenerator: (req) => {
    // Use forwarded IP if behind trusted proxy
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                        // Only 5 attempts per 15 minutes
  skipSuccessfulRequests: true,  // Don't count successful logins
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:auth:',
  }),
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts, please try again later',
  },
});

app.use(globalLimiter);
app.post('/api/v1/auth/login', authLimiter, loginHandler);
app.post('/api/v1/auth/reset-password', authLimiter, resetPasswordHandler);
```

## Input Sanitization

### Body Size Limits

```typescript
// Limit JSON body to 100kb
app.use(express.json({ limit: '100kb' }));

// Limit form data to 100kb
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Stricter limit for file upload endpoints
app.post('/api/v1/upload', express.raw({ limit: '10mb', type: 'image/*' }), uploadHandler);
```

### NoSQL Injection Prevention

```typescript
import mongoSanitize from 'express-mongo-sanitize';

// Remove keys starting with $ or containing .
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized ${key} in request to ${req.originalUrl}`);
  },
}));
```

### Parameter Pollution Prevention

```typescript
import hpp from 'hpp';

// Prevent HTTP parameter pollution
app.use(hpp({
  whitelist: ['sort', 'filter', 'fields'], // Allow duplicates for these params
}));
```

## Authentication Security

### JWT Best Practices

```typescript
import jwt from 'jsonwebtoken';

// Token creation
function createTokenPair(user: User): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: '15m',          // Short-lived access tokens
      issuer: 'api.example.com',
      audience: 'app.example.com',
    }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    config.jwtRefreshSecret,
    {
      algorithm: 'HS256',
      expiresIn: '7d',
      issuer: 'api.example.com',
    }
  );

  return { accessToken, refreshToken };
}

// Token verification with full validation
function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],       // Prevent algorithm confusion attacks
    issuer: 'api.example.com',
    audience: 'app.example.com',
    clockTolerance: 30,          // 30-second clock skew tolerance
  }) as JwtPayload;
}
```

### Cookie Security

```typescript
// Secure cookie settings for sessions or refresh tokens
res.cookie('refreshToken', token, {
  httpOnly: true,        // No JavaScript access
  secure: true,          // HTTPS only
  sameSite: 'strict',    // Prevent CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',  // Only sent to auth endpoints
  domain: '.example.com',
});
```

## HTTPS and HSTS

```typescript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
    }
    next();
  });
}

// HSTS header (also handled by Helmet)
app.use((req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  next();
});
```

## Trust Proxy

Configure Express to trust proxy headers correctly when behind a reverse proxy.

```typescript
// Trust first proxy (e.g., nginx, load balancer)
app.set('trust proxy', 1);

// Trust specific subnets
app.set('trust proxy', 'loopback, 10.0.0.0/8');

// Custom trust function
app.set('trust proxy', (ip: string) => {
  return ip === '127.0.0.1' || ip.startsWith('10.');
});
```

When `trust proxy` is enabled, `req.ip` and `req.hostname` use `X-Forwarded-*` headers from trusted proxies. Without it, `req.ip` returns the proxy's IP instead of the client's.

## Security Checklist

| Area | Check |
| --- | --- |
| Headers | Helmet with explicit CSP directives |
| CORS | Allow-list origins, no wildcard with credentials |
| Rate Limiting | Global + stricter per auth endpoints, Redis store |
| Body Limits | express.json limit set, express.urlencoded limit set |
| X-Powered-By | Disabled |
| HTTPS | HSTS enabled, HTTP redirected |
| JWT | Short expiry, algorithm pinned, issuer/audience verified |
| Cookies | httpOnly, secure, sameSite, path-scoped |
| Input | Sanitized for NoSQL injection, parameter pollution prevented |
| Trust Proxy | Configured for deployment topology |
| Errors | Stack traces never sent to clients |
| Dependencies | No known CVEs (`npm audit`) |
