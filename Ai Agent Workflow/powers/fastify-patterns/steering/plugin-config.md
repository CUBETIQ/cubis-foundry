# Fastify Plugin Configuration

> Reference for: Fastify Patterns
> Load when: Helmet, CORS, rate limiting, compression, static files, multipart

---

## Plugin Registration Order

**Critical:** Register plugins in this order for proper functionality:

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // 1. Security headers (first)
  await app.register(helmet);

  // 2. CORS (before routes)
  await app.register(cors, corsOptions);

  // 3. Rate limiting
  await app.register(rateLimit, rateLimitOptions);

  // 4. Cookie & Session
  await app.register(cookie);
  await app.register(secureSession, sessionOptions);

  // 5. Compression (optional)
  await app.register(compress);

  // 6. Static files (if needed)
  await app.register(fastifyStatic, staticOptions);

  // 7. Multipart (if needed)
  await app.register(multipart);

  // 8. Global pipes and filters
  app.useGlobalPipes(new ValidationPipe({ ... }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(3000, '0.0.0.0');
}
```

---

## Helmet (Security Headers)

```bash
npm install @fastify/helmet
```

```typescript
import helmet from "@fastify/helmet";

await app.register(helmet, {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Other headers
  referrerPolicy: { policy: "same-origin" },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
});
```

### Disable CSP for Swagger UI

```typescript
// If using Swagger UI, you may need to relax CSP
await app.register(helmet, {
  contentSecurityPolicy:
    process.env.NODE_ENV === "production"
      ? {
          /* strict policy */
        }
      : false, // Disable in development for Swagger
});
```

---

## CORS Configuration

```bash
npm install @fastify/cors
```

```typescript
import cors from "@fastify/cors";

await app.register(cors, {
  // Origins
  origin: (origin, cb) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];

    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) {
      cb(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      cb(null, true);
      return;
    }

    cb(new Error("Not allowed by CORS"), false);
  },

  // Credentials (required for cookies)
  credentials: true,

  // Methods
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // Headers
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Timezone",
    "X-Request-ID",
  ],

  // Expose headers to client
  exposedHeaders: ["X-Request-ID"],

  // Preflight cache
  maxAge: 86400, // 24 hours
});
```

### Development CORS

```typescript
// For development, allow all origins
await app.register(cors, {
  origin: true,
  credentials: true,
});
```

---

## Rate Limiting

```bash
npm install @fastify/rate-limit
```

### Global Rate Limiting

```typescript
import rateLimit from "@fastify/rate-limit";

await app.register(rateLimit, {
  // Requests per window
  max: 100,

  // Time window
  timeWindow: "1 minute",

  // Key generator (identify client)
  keyGenerator: (request) => {
    // Use user ID if authenticated, otherwise IP
    return (request as any).user?.userId || request.ip;
  },

  // Error response
  errorResponseBuilder: (request, context) => ({
    statusCode: 429,
    error: "Too Many Requests",
    message: `Rate limit exceeded. Try again in ${context.after}`,
    retryAfter: context.after,
  }),

  // Skip certain routes
  skipOnError: true,

  // Add headers
  addHeaders: {
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
    "retry-after": true,
  },
});
```

### Route-Specific Rate Limits

```typescript
// Create custom decorator
import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (max: number, timeWindow: string) =>
  SetMetadata(RATE_LIMIT_KEY, { max, timeWindow });

// Use in controller
@Controller('auth')
export class AuthController {
  @Post('login')
  @RateLimit(5, '1 minute') // Stricter limit for login
  async login() { ... }
}
```

### Redis Store for Distributed Rate Limiting

```typescript
import rateLimit from "@fastify/rate-limit";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  redis,
});
```

---

## Compression

```bash
npm install @fastify/compress
```

```typescript
import compress from "@fastify/compress";

await app.register(compress, {
  // Encoding priority
  encodings: ["gzip", "deflate"],

  // Minimum size to compress
  threshold: 1024, // 1KB

  // Compression level (1-9)
  zlibOptions: {
    level: 6,
  },

  // Skip compression for certain content types
  customTypes: /^text\/|application\/json/,
});
```

---

## Static Files

```bash
npm install @fastify/static
```

```typescript
import fastifyStatic from "@fastify/static";
import * as path from "path";

await app.register(fastifyStatic, {
  root: path.join(__dirname, "..", "public"),
  prefix: "/public/",

  // Caching
  maxAge: "1d",
  immutable: true,

  // Security
  dotfiles: "ignore",

  // Index file
  index: false,
});
```

---

## Multipart/File Upload

```bash
npm install @fastify/multipart
```

```typescript
import multipart from "@fastify/multipart";

await app.register(multipart, {
  limits: {
    fieldNameSize: 100,
    fieldSize: 1000000, // 1MB
    fields: 10,
    fileSize: 10000000, // 10MB
    files: 5,
    headerPairs: 2000,
  },

  // Attach files to request
  attachFieldsToBody: true,
});
```

### File Upload Controller

```typescript
import { Controller, Post, Req } from "@nestjs/common";
import { FastifyRequest } from "fastify";

@Controller("upload")
export class UploadController {
  @Post()
  async uploadFile(@Req() request: FastifyRequest) {
    const data = await request.file();

    if (!data) {
      throw new BadRequestException("No file uploaded");
    }

    // Process file
    const buffer = await data.toBuffer();
    const filename = data.filename;
    const mimetype = data.mimetype;

    // Save file...
    return { filename, size: buffer.length };
  }

  @Post("multiple")
  async uploadMultiple(@Req() request: FastifyRequest) {
    const files = request.files();
    const results = [];

    for await (const file of files) {
      const buffer = await file.toBuffer();
      results.push({
        filename: file.filename,
        size: buffer.length,
      });
    }

    return results;
  }
}
```

---

## Cookie Configuration

```bash
npm install @fastify/cookie
```

```typescript
import cookie from "@fastify/cookie";

await app.register(cookie, {
  secret: process.env.COOKIE_SECRET, // For signed cookies
  parseOptions: {
    // Default cookie parsing options
  },
});
```

### Setting Cookies in Controllers

```typescript
import { Controller, Get, Res } from "@nestjs/common";
import { FastifyReply } from "fastify";

@Controller("example")
export class ExampleController {
  @Get("set-cookie")
  setCookie(@Res() reply: FastifyReply) {
    reply
      .setCookie("preference", "dark-mode", {
        path: "/",
        httpOnly: false, // Accessible by JS
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
      .send({ status: "ok" });
  }

  @Get("clear-cookie")
  clearCookie(@Res() reply: FastifyReply) {
    reply.clearCookie("preference", { path: "/" }).send({ status: "ok" });
  }
}
```

---

## Complete Bootstrap Example

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe, Logger } from "@nestjs/common";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import secureSession from "@fastify/secure-session";
import compress from "@fastify/compress";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./core/filters/global-exception.filter";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV !== "production",
    }),
  );

  // 1. Security headers
  await app.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === "production",
  });

  // 2. CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") || [],
    credentials: true,
  });

  // 3. Rate limiting
  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
    timeWindow: process.env.RATE_LIMIT_WINDOW || "1 minute",
  });

  // 4. Cookie & Session
  await app.register(cookie);

  if (process.env.SESSION_SECRET) {
    await app.register(secureSession, {
      cookieName: process.env.SESSION_COOKIE_NAME || "oneup.sid",
      key: Buffer.from(process.env.SESSION_SECRET, "hex"),
      expiry: parseInt(process.env.SESSION_EXPIRY || "86400"),
      cookie: {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    });
  }

  // 5. Compression
  await app.register(compress, { threshold: 1024 });

  // 6. Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 7. Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 8. API prefix
  app.setGlobalPrefix("api");

  const port = parseInt(process.env.PORT || "3000");
  await app.listen(port, "0.0.0.0");

  logger.log(`Application running on port ${port}`);
}

bootstrap();
```

---

## Environment Variables Reference

```bash
# Server
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://app.oneup.com,https://admin.oneup.com

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=1 minute

# Session
SESSION_SECRET=<64-char-hex>
SESSION_COOKIE_NAME=oneup.sid
SESSION_EXPIRY=86400

# Cookie (for signed cookies)
COOKIE_SECRET=<random-string>
```
