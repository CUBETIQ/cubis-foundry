# Express to Fastify Migration Guide

> Reference for: Fastify Patterns
> Load when: Converting Express middleware, migrating from Express, NestJS adapter switch

---

## Overview

Migrating from Express to Fastify in NestJS is straightforward since NestJS abstracts most HTTP layer differences. This guide covers the key changes needed when switching adapters.

---

## Quick Migration Steps

1. Install Fastify adapter
2. Update bootstrap file
3. Convert Express middleware to Fastify plugins
4. Update request/response access patterns
5. Test and benchmark

---

## Step 1: Install Dependencies

```bash
# Remove Express (optional, can keep for compatibility)
npm uninstall @nestjs/platform-express

# Install Fastify
npm install @nestjs/platform-fastify fastify

# Install Fastify plugins (equivalents to Express middleware)
npm install @fastify/helmet @fastify/cors @fastify/rate-limit @fastify/cookie @fastify/secure-session @fastify/compress @fastify/static
```

---

## Step 2: Update Bootstrap

### Before (Express)

```typescript
// main.ts - Express
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Express middleware
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN }));
  app.use(rateLimit({ windowMs: 60000, max: 100 }));

  await app.listen(3000);
}
bootstrap();
```

### After (Fastify)

```typescript
// main.ts - Fastify
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // Fastify plugins (use register instead of use)
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
      },
    },
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") || [],
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // IMPORTANT: Use 0.0.0.0 for Docker/containers
  await app.listen(3000, "0.0.0.0");
}
bootstrap();
```

---

## Step 3: Middleware to Plugin Conversion

### Express Middleware Pattern

```typescript
// Express middleware
function expressMiddleware(req, res, next) {
  req.customData = "value";
  next();
}

app.use(expressMiddleware);
```

### Fastify Plugin Pattern

```typescript
// Fastify plugin
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const customPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest("customData", null);

  fastify.addHook("onRequest", async (request) => {
    request.customData = "value";
  });
};

export default fp(customPlugin, { name: "custom-plugin" });

// Register in main.ts
await app.register(customPlugin);
```

### Common Middleware Conversions

| Express              | Fastify                   | Notes             |
| -------------------- | ------------------------- | ----------------- |
| `helmet`             | `@fastify/helmet`         | Same options      |
| `cors`               | `@fastify/cors`           | Same options      |
| `express-rate-limit` | `@fastify/rate-limit`     | Different options |
| `cookie-parser`      | `@fastify/cookie`         | Different API     |
| `express-session`    | `@fastify/secure-session` | Different API     |
| `compression`        | `@fastify/compress`       | Same concept      |
| `serve-static`       | `@fastify/static`         | Different options |
| `body-parser`        | Built-in                  | Not needed        |
| `multer`             | `@fastify/multipart`      | Different API     |

---

## Step 4: Request/Response Differences

### Request Object

```typescript
// Express
@Get()
handler(@Req() req: Request) {
  const ip = req.ip;
  const headers = req.headers;
  const body = req.body;
  const query = req.query;
  const params = req.params;
}

// Fastify - mostly the same with NestJS decorators
@Get()
handler(@Req() request: FastifyRequest) {
  const ip = request.ip;           // Same
  const headers = request.headers; // Same
  const body = request.body;       // Same
  const query = request.query;     // Same
  const params = request.params;   // Same
}
```

### Response Object

```typescript
// Express
@Get()
handler(@Res() res: Response) {
  res.status(200).json({ data: 'value' });
  res.cookie('name', 'value', { httpOnly: true });
  res.redirect('/other');
}

// Fastify
@Get()
handler(@Res() reply: FastifyReply) {
  reply.status(200).send({ data: 'value' });
  reply.setCookie('name', 'value', { httpOnly: true });
  reply.redirect('/other');
}
```

### Prefer NestJS Decorators (Platform Agnostic)

```typescript
// Best practice - works with both Express and Fastify
@Get()
@HttpCode(200)
handler(
  @Query() query: QueryDto,
  @Param('id') id: string,
  @Body() body: CreateDto,
): ResponseDto {
  return this.service.handle(query, id, body);
}
```

---

## Step 5: File Upload Migration

### Express (Multer)

```typescript
// Express with Multer
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Post('upload')
@UseInterceptors(FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
}))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  return { filename: file.filename };
}
```

### Fastify (Multipart)

```typescript
// main.ts - Register multipart
import multipart from '@fastify/multipart';

await app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Controller
@Post('upload')
async uploadFile(@Req() request: FastifyRequest) {
  const data = await request.file();

  if (!data) {
    throw new BadRequestException('No file uploaded');
  }

  const buffer = await data.toBuffer();
  const filename = `${Date.now()}-${data.filename}`;

  // Save file
  await fs.promises.writeFile(`./uploads/${filename}`, buffer);

  return { filename };
}
```

### Platform-Agnostic File Upload

```typescript
// Works with both Express and Fastify
import { FileInterceptor } from '@nestjs/platform-express';

@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  // NestJS handles the abstraction
  return { filename: file.originalname };
}
```

---

## Step 6: Session Migration

### Express Session

```typescript
// Express
import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true },
}));

// Access session
@Get()
handler(@Session() session: Record<string, any>) {
  session.userId = '123';
  return session.userId;
}
```

### Fastify Secure Session

```typescript
// main.ts
import cookie from '@fastify/cookie';
import secureSession from '@fastify/secure-session';

await app.register(cookie);
await app.register(secureSession, {
  key: Buffer.from(process.env.SESSION_SECRET!, 'hex'),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  },
});

// Access session
@Get()
handler(@Req() request: FastifyRequest) {
  request.session.set('userId', '123');
  return request.session.get('userId');
}
```

---

## Step 7: Error Handling

### Express Error Handler

```typescript
// Express error middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    code: err.code,
  });
});
```

### Fastify Error Handler

```typescript
// Fastify error handler (in main.ts)
const fastifyInstance = app.getHttpAdapter().getInstance();

fastifyInstance.setErrorHandler((error, request, reply) => {
  reply.status(error.statusCode || 500).send({
    message: error.message,
    code: error.code,
  });
});

// Or use NestJS exception filters (recommended - platform agnostic)
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    response.status(status).send({
      statusCode: status,
      message:
        exception instanceof Error ? exception.message : "Internal error",
    });
  }
}
```

---

## Step 8: Testing Updates

### E2E Test Setup

```typescript
// test/app.e2e-spec.ts
import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "../src/app.module";

describe("AppController (e2e)", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("/GET users", () => {
    return app
      .inject({
        method: "GET",
        url: "/users",
      })
      .then((result) => {
        expect(result.statusCode).toBe(200);
      });
  });
});
```

---

## Migration Checklist

### Pre-Migration

- [ ] Audit all Express middleware in use
- [ ] Identify Fastify equivalents for each middleware
- [ ] Review custom middleware for conversion
- [ ] Check file upload handling
- [ ] Review session management approach

### During Migration

- [ ] Update package.json dependencies
- [ ] Convert main.ts bootstrap
- [ ] Convert middleware to plugins
- [ ] Update request/response access if using raw objects
- [ ] Update file upload handlers
- [ ] Update session handling
- [ ] Update E2E tests

### Post-Migration

- [ ] Run full test suite
- [ ] Benchmark performance
- [ ] Test in staging environment
- [ ] Monitor for errors after deployment
- [ ] Remove unused Express dependencies

---

## Common Issues

### Issue: `app.use()` Not Working

```typescript
// Wrong - Express pattern
app.use(someMiddleware);

// Correct - Fastify pattern
await app.register(somePlugin);
```

### Issue: `req.ip` Returns Wrong Value

```typescript
// Configure trust proxy
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({ trustProxy: true }),
);
```

### Issue: Cookies Not Setting

```typescript
// Ensure @fastify/cookie is registered before secure-session
await app.register(cookie);
await app.register(secureSession, {
  /* options */
});
```

### Issue: CORS Preflight Failing

```typescript
// Ensure CORS is registered early
await app.register(cors, {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});
```

---

## Related Steering Files

- `secure-sessions.md` - Session management
- `plugin-config.md` - Plugin configuration
- `performance.md` - Performance optimization
