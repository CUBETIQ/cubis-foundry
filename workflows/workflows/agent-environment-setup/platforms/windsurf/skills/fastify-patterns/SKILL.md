---
name: "fastify-patterns"
description: "NestJS + Fastify integration patterns including secure sessions, cookie authentication, performance optimization, and plugin configuration. Use for high-performance API development."
---


# Fastify Patterns

## Overview

Expert guidance for building high-performance NestJS applications with Fastify adapter. Covers secure session management, cookie-based authentication, plugin configuration, and performance optimization patterns.

## Role Definition

You are a backend performance specialist with deep expertise in Fastify and NestJS integration. You optimize for throughput, security, and maintainability while leveraging Fastify's plugin architecture.

## When to Use This Power

- Setting up NestJS with Fastify adapter
- Implementing cookie-based session authentication
- Configuring Fastify plugins (helmet, cors, rate-limit)
- Optimizing API performance
- Migrating from Express to Fastify
- Implementing secure stateless sessions

## Core Workflow

1. **Bootstrap** - Configure Fastify adapter with NestJS
2. **Security** - Register security plugins (helmet, cors, secure-session)
3. **Performance** - Configure rate limiting and caching
4. **Validation** - Set up global validation pipes
5. **Test** - Benchmark and verify performance gains

## Available Steering Files

| Topic                | Reference                       | Load When                                     |
| -------------------- | ------------------------------- | --------------------------------------------- |
| Secure Sessions      | `references/secure-sessions.md`   | Cookie auth, session management, key rotation |
| Plugin Configuration | `references/plugin-config.md`     | Helmet, CORS, rate limiting, compression      |
| Performance Tuning   | `references/performance.md`       | Benchmarking, optimization, caching           |
| Migration Guide      | `references/express-migration.md` | Converting Express middleware to Fastify      |

## Quick Reference

### Bootstrap with Fastify

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  await app.listen(3000, "0.0.0.0");
}
bootstrap();
```

### Register Fastify Plugins

```typescript
// main.ts - Security plugins
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  });

  // CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") || [],
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.listen(3000, "0.0.0.0");
}
```

### Secure Session Setup

```typescript
import cookie from "@fastify/cookie";
import secureSession from "@fastify/secure-session";

// Register cookie and session plugins
await app.register(cookie);
await app.register(secureSession, {
  cookieName: process.env.SESSION_COOKIE_NAME || "session",
  key: Buffer.from(process.env.SESSION_SECRET!, "hex"),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
});
```

## Constraints

### MUST DO

- Use `@nestjs/platform-fastify` adapter
- Register security plugins before routes
- Use `0.0.0.0` for Docker/container deployments
- Generate session keys with `npx @fastify/secure-session`
- Set `httpOnly: true` for session cookies
- Enable `secure: true` in production

### MUST NOT DO

- Mix Express and Fastify middleware
- Use Express-specific `req.ip` (use `request.ip` instead)
- Hardcode session secrets
- Skip rate limiting on auth endpoints
- Use `localhost` in containerized environments

## Performance Comparison

| Metric        | Express | Fastify | Improvement |
| ------------- | ------- | ------- | ----------- |
| Requests/sec  | ~17,000 | ~30,000 | ~76% faster |
| Latency (avg) | 5.8ms   | 3.3ms   | ~43% lower  |
| Memory        | Higher  | Lower   | ~20% less   |

## Related Powers

- **NestJS Expert** - Core NestJS patterns
- **Security Reviewer** - Security auditing
- **DevOps Engineer** - Container deployment
