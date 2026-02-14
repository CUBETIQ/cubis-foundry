# Fastify Performance Optimization

> Reference for: Fastify Patterns
> Load when: Benchmarking, optimization, caching, JSON serialization, schema validation

---

## Overview

Fastify achieves ~30,000 requests/second compared to Express's ~17,000 req/sec (approximately 2x faster). This guide covers optimization techniques to maximize Fastify's performance in NestJS applications.

---

## Performance Comparison

| Metric             | Express | Fastify | Improvement |
| ------------------ | ------- | ------- | ----------- |
| Requests/sec       | ~17,000 | ~30,000 | ~76% faster |
| Latency (avg)      | 5.8ms   | 3.3ms   | ~43% lower  |
| Memory usage       | Higher  | Lower   | ~20% less   |
| JSON serialization | Slow    | Fast    | 2-3x faster |

---

## JSON Serialization Optimization

### Schema-Based Serialization

Fastify's biggest performance gain comes from schema-based JSON serialization using `fast-json-stringify`.

```typescript
// src/modules/users/dto/user-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  createdAt: Date;
}

// Controller with response schema
@Controller("users")
export class UsersController {
  @Get(":id")
  @ApiResponse({ type: UserResponseDto })
  async findOne(@Param("id") id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }
}
```

### Manual Schema Definition

For maximum performance, define JSON schemas explicitly:

```typescript
// src/modules/users/schemas/user-response.schema.ts
export const userResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    username: { type: "string" },
    role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN", "STAFF"] },
    enabled: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "username", "role", "enabled"],
};

export const usersListSchema = {
  type: "array",
  items: userResponseSchema,
};
```

### Using Nestia for 10-30x Performance

[Nestia](https://github.com/samchon/nestia) provides compile-time optimization:

```bash
npm install @nestia/core @nestia/sdk
```

```typescript
// With Nestia - automatic schema generation and fast serialization
import { TypedRoute } from "@nestia/core";

@Controller("users")
export class UsersController {
  @TypedRoute.Get(":id")
  async findOne(@Param("id") id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }
}
```

---

## Request Validation Optimization

### Use class-validator Efficiently

```typescript
// Disable implicit conversion for faster validation
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: false, // Faster without implicit conversion
    },
  }),
);
```

### Schema-Based Validation (Fastest)

```typescript
// Use Fastify's built-in schema validation
import { FastifyAdapter } from "@nestjs/platform-fastify";

const adapter = new FastifyAdapter();

// Register route with schema validation
adapter.getInstance().route({
  method: "POST",
  url: "/users",
  schema: {
    body: {
      type: "object",
      required: ["username", "password"],
      properties: {
        username: { type: "string", minLength: 3, maxLength: 50 },
        password: { type: "string", minLength: 8 },
        role: { type: "string", enum: ["ADMIN", "STAFF"] },
      },
    },
    response: {
      201: userResponseSchema,
    },
  },
  handler: async (request, reply) => {
    // Handler logic
  },
});
```

---

## Caching Strategies

### In-Memory Caching with @nestjs/cache-manager

```typescript
// app.module.ts
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    CacheModule.register({
      ttl: 60000, // 60 seconds
      max: 100, // Maximum items in cache
      isGlobal: true,
    }),
  ],
})
export class AppModule {}

// Service with caching
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async findById(id: string): Promise<UserResponseDto> {
    const cacheKey = `user:${id}`;

    // Check cache first
    const cached = await this.cache.get<UserResponseDto>(cacheKey);
    if (cached) return cached;

    // Fetch from database
    const user = await this.usersRepository.findById(id);

    // Cache result
    await this.cache.set(cacheKey, user, 60000);

    return user;
  }
}
```

### Redis Caching for Distributed Systems

```typescript
// app.module.ts
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-store";

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || "6379"),
          },
          ttl: 60,
        }),
      }),
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

### Cache Interceptor for Automatic Caching

```typescript
// src/common/interceptors/cache.interceptor.ts
import { CacheInterceptor, CacheKey, CacheTTL } from "@nestjs/cache-manager";

@Controller("users")
@UseInterceptors(CacheInterceptor)
export class UsersController {
  @Get()
  @CacheKey("users-list")
  @CacheTTL(30000) // 30 seconds
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }
}
```

---

## Connection Pooling

### MongoDB Connection Pool

```typescript
// app.module.ts
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: process.env.MONGO_URL,
    maxPoolSize: 10,           // Connections per server
    minPoolSize: 2,            // Minimum connections
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxIdleTimeMS: 30000,      // Close idle connections after 30s
  }),
}),
```

### Redis Connection Pool

```typescript
// src/config/redis.config.ts
import Redis from "ioredis";

export const createRedisClient = () => {
  return new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    // Connection pool settings
    family: 4,
    keepAlive: 10000,
  });
};
```

---

## Compression

### Enable Compression for Large Responses

```typescript
// main.ts
import compression from "@fastify/compress";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(compression, {
    encodings: ["gzip", "deflate"],
    threshold: 1024, // Only compress responses > 1KB
  });

  await app.listen(3000, "0.0.0.0");
}
```

---

## Logging Optimization

### Disable Logging in Production (or use async)

```typescript
// main.ts
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({
    logger:
      process.env.NODE_ENV === "production"
        ? {
            level: "warn",
            transport: {
              target: "pino-pretty",
              options: { colorize: false },
            },
          }
        : true,
  }),
);
```

### Use Pino for Fast Logging

```typescript
// Pino is Fastify's default logger - already optimized
// For custom logging:
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty" }
      : undefined,
});
```

---

## Benchmarking

### Using autocannon

```bash
# Install autocannon
npm install -g autocannon

# Basic benchmark
autocannon -c 100 -d 10 http://localhost:3000/api/users

# With authentication header
autocannon -c 100 -d 10 -H "Authorization=Bearer <token>" http://localhost:3000/api/users

# POST request with body
autocannon -c 100 -d 10 -m POST -H "Content-Type=application/json" \
  -b '{"username":"test","password":"test123"}' \
  http://localhost:3000/api/auth/login
```

### Benchmark Script

```typescript
// scripts/benchmark.ts
import autocannon from "autocannon";

async function runBenchmark() {
  const result = await autocannon({
    url: "http://localhost:3000/api/users",
    connections: 100,
    duration: 10,
    headers: {
      Authorization: `Bearer ${process.env.TEST_TOKEN}`,
    },
  });

  console.log("Results:");
  console.log(`Requests/sec: ${result.requests.average}`);
  console.log(`Latency (avg): ${result.latency.average}ms`);
  console.log(`Throughput: ${result.throughput.average} bytes/sec`);
}

runBenchmark();
```

### Using clinic.js for Profiling

```bash
# Install clinic
npm install -g clinic

# Profile with autocannon
clinic doctor -- node dist/main.js

# In another terminal
autocannon -c 100 -d 10 http://localhost:3000/api/users

# Stop the server (Ctrl+C) to generate report
```

---

## Memory Optimization

### Avoid Memory Leaks

```typescript
// Use WeakMap for caching objects
const cache = new WeakMap<object, any>();

// Clear intervals and timeouts
@Injectable()
export class SchedulerService implements OnModuleDestroy {
  private intervalId: NodeJS.Timeout;

  onModuleInit() {
    this.intervalId = setInterval(() => this.cleanup(), 60000);
  }

  onModuleDestroy() {
    clearInterval(this.intervalId);
  }
}
```

### Stream Large Responses

```typescript
// Stream large datasets instead of loading into memory
@Get('export')
async exportData(@Res() reply: FastifyReply) {
  const cursor = this.attendanceRepository.findAllCursor();

  reply.header('Content-Type', 'application/json');
  reply.send(cursor.stream());
}
```

---

## Production Checklist

### DO

- [ ] Enable JSON schema serialization
- [ ] Use connection pooling (MongoDB, Redis)
- [ ] Enable compression for large responses
- [ ] Implement caching for frequently accessed data
- [ ] Use `lean()` for read-only Mongoose queries
- [ ] Set appropriate timeouts
- [ ] Use async logging (Pino)
- [ ] Run benchmarks before deployment

### DON'T

- [ ] Log every request in production
- [ ] Use synchronous operations in request handlers
- [ ] Load entire collections into memory
- [ ] Skip connection pool configuration
- [ ] Use `transform: true` without need
- [ ] Ignore memory leaks in long-running processes

---

## Performance Targets

| Endpoint Type     | Target Latency | Target RPS |
| ----------------- | -------------- | ---------- |
| Health check      | < 5ms          | > 50,000   |
| Simple CRUD       | < 20ms         | > 10,000   |
| Complex query     | < 100ms        | > 2,000    |
| Report generation | < 500ms        | > 500      |
| File upload       | < 2s           | > 100      |

---

## Related Steering Files

- `secure-sessions.md` - Session management
- `plugin-config.md` - Plugin configuration
- `express-migration.md` - Migration guide
