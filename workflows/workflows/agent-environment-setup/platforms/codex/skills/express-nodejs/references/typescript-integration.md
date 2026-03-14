# Express TypeScript Integration

## Project Setup

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Required Dependencies

```json
{
  "dependencies": {
    "express": "^5.0.0",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.0.0",
    "zod": "^3.22.0",
    "pino": "^8.0.0",
    "pino-http": "^9.0.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "tsx": "^4.0.0",
    "vitest": "^1.0.0",
    "supertest": "^6.0.0",
    "@types/supertest": "^6.0.0"
  }
}
```

## Typed Request Handlers

Express provides generic types for `Request` that allow typing params, body, query, and response.

```typescript
import { Request, Response, RequestHandler } from 'express';

// Type parameters: Request<Params, ResBody, ReqBody, ReqQuery>
interface CreateUserBody {
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

const createUser: RequestHandler<{}, UserResponse, CreateUserBody> = async (req, res) => {
  // req.body is typed as CreateUserBody
  const { email, name, role } = req.body;

  const user = await userService.create({ email, name, role });

  // res.json expects UserResponse
  res.status(201).json(user);
};
```

### Typed Path Parameters

```typescript
interface UserParams {
  id: string;
}

const getUser: RequestHandler<UserParams> = async (req, res) => {
  const { id } = req.params; // typed as string
  const user = await userService.findById(id);
  res.json(user);
};

// With multiple params
interface OrgRepoParams {
  orgId: string;
  repoId: string;
}

const getRepo: RequestHandler<OrgRepoParams> = async (req, res) => {
  const { orgId, repoId } = req.params;
  // Both typed as string
};
```

### Typed Query Parameters

```typescript
interface SearchQuery {
  q?: string;
  page?: string;
  limit?: string;
  sort?: 'asc' | 'desc';
}

const searchUsers: RequestHandler<{}, unknown, unknown, SearchQuery> = async (req, res) => {
  const { q, page = '1', limit = '20', sort = 'asc' } = req.query;
  // All typed correctly
};
```

## Declaration Merging

Extend the Express `Request` interface to add custom properties set by middleware.

```typescript
// src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'admin' | 'editor' | 'viewer';
      };
      requestId: string;
      log: import('pino').Logger;
    }
  }
}

export {};
```

Now middleware and handlers can access `req.user`, `req.requestId`, and `req.log` with full type safety.

```typescript
// In middleware
const authenticate: RequestHandler = async (req, res, next) => {
  const payload = jwt.verify(token, secret) as JwtPayload;
  req.user = {
    id: payload.sub!,
    email: payload.email,
    role: payload.role,
  };
  next();
};

// In handler -- no casting needed
const getProfile: RequestHandler = async (req, res) => {
  const userId = req.user!.id; // TypeScript knows the shape
  const profile = await profileService.get(userId);
  res.json(profile);
};
```

## App/Server Separation

Separate app construction from listening for testability.

```typescript
// src/app.ts -- exports the configured app
import express from 'express';
import { errorHandler } from './middleware/error-handler';
import { usersRouter } from './routes/users';

export function createApp(deps: Dependencies) {
  const app = express();

  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1/users', usersRouter(deps));
  app.use(errorHandler);

  return app;
}

// src/server.ts -- starts listening
import { createApp } from './app';
import { loadConfig } from './config';

async function main() {
  const config = loadConfig();
  const deps = await initDependencies(config);
  const app = createApp(deps);

  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => {
      deps.db.end();
      process.exit(0);
    });
  });
}

main().catch(console.error);
```

## Typed Router Factory

Create routers as factory functions that receive dependencies.

```typescript
// src/routes/users.ts
import { Router } from 'express';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../schemas/user';

export function usersRouter(deps: Dependencies): Router {
  const router = Router();
  const { userService, authMiddleware, authorize } = deps;

  router.use(authMiddleware);

  router.get('/', async (req, res) => {
    const users = await userService.list(req.query);
    res.json(users);
  });

  router.post('/', validate({ body: createUserSchema }), async (req, res) => {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  });

  router.get('/:id', async (req, res) => {
    const user = await userService.findById(req.params.id);
    res.json(user);
  });

  router.put('/:id', validate({ body: updateUserSchema }), async (req, res) => {
    const user = await userService.update(req.params.id, req.body);
    res.json(user);
  });

  router.delete('/:id', authorize('admin'), async (req, res) => {
    await userService.delete(req.params.id);
    res.status(204).end();
  });

  return router;
}
```

## Zod Schema Integration

Use Zod for runtime validation that also provides TypeScript types.

```typescript
import { z } from 'zod';

// Define schema
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'editor', 'viewer']),
});

// Extract TypeScript type from schema
export type CreateUserDto = z.infer<typeof createUserSchema>;
// { email: string; name: string; role: 'admin' | 'editor' | 'viewer' }

// Use in service layer
class UserService {
  async create(data: CreateUserDto): Promise<User> {
    // data is typed from the zod schema
    return this.repo.insert(data);
  }
}
```

## Typed Error Middleware

```typescript
import { ErrorRequestHandler } from 'express';

// Express requires all 4 parameters to be declared
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // TypeScript ensures proper typing
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
    return;
  }

  req.log?.error({ err }, 'Unhandled error');
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
};
```

## Environment Configuration with Type Safety

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().transform((s) => s.split(',')),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}
```

## Common TypeScript Patterns

| Pattern | When to Use |
| --- | --- |
| `RequestHandler<Params, ResBody, ReqBody, Query>` | Typed route handlers |
| `ErrorRequestHandler` | Error middleware (4 params) |
| `declare global { namespace Express {} }` | Declaration merging for req extensions |
| `z.infer<typeof schema>` | Derive types from Zod schemas |
| Factory functions for routers | Dependency injection in routes |
| App/server separation | Testability with supertest |
