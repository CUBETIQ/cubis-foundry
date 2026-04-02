# TypeScript Architecture Patterns

## Discriminated Unions for State Machines

The core pattern for modeling states with different data shapes:

```typescript
// Each state carries only its relevant data
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading"; startedAt: number }
  | { status: "success"; data: T; completedAt: number }
  | { status: "error"; error: Error; failedAt: number; retryCount: number };

// Transitions are functions that accept valid source states
function startFetching(state: Extract<FetchState<unknown>, { status: "idle" | "error" }>): FetchState<unknown> {
  return { status: "loading", startedAt: Date.now() };
}
```

### Exhaustiveness Helper

```typescript
function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unexpected value: ${JSON.stringify(value)}`);
}

function renderState(state: FetchState<User>): string {
  switch (state.status) {
    case "idle": return "Ready";
    case "loading": return "Loading...";
    case "success": return `User: ${state.data.name}`;
    case "error": return `Error: ${state.error.message}`;
    default: return assertNever(state);
  }
}
```

## Result Type Pattern

Replace thrown exceptions with typed results for expected failures:

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Constructor helpers
function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Usage
function parseJSON(input: string): Result<unknown, SyntaxError> {
  try {
    return Ok(JSON.parse(input));
  } catch (e) {
    return Err(e as SyntaxError);
  }
}

const result = parseJSON('{"key": "value"}');
if (result.ok) {
  console.log(result.value); // unknown
} else {
  console.error(result.error.message); // SyntaxError
}
```

## Module Design

### Barrel Exports (index.ts)

```typescript
// src/users/index.ts — public API surface
export type { User, CreateUserInput, UserFilter } from "./types.js";
export { UserService } from "./service.js";
export { UserRepository } from "./repository.js";
// Do NOT re-export internal types or utilities
```

### Internal Module Convention

```typescript
// Without private packages, use naming convention:
// src/users/_internal.ts — not re-exported from index.ts
// src/users/_cache.ts — module-private implementation detail

// Or use package.json exports map:
{
  "exports": {
    ".": "./dist/index.js",
    "./testing": "./dist/testing.js"
  }
}
// Only "." and "./testing" are importable by consumers
```

## Dependency Injection (Without a Framework)

```typescript
// Define interfaces at the consumer
interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error): void;
}

interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
}

// Service depends on interfaces, not implementations
class UserService {
  constructor(
    private readonly repo: UserRepository,
    private readonly logger: Logger,
  ) {}

  async getUser(id: UserId): Promise<Result<User, AppError>> {
    const user = await this.repo.findById(id);
    if (!user) {
      return Err(new NotFoundError("User", id));
    }
    this.logger.info("user_fetched", { userId: id });
    return Ok(user);
  }
}

// Wire at the composition root
function createApp(config: AppConfig): App {
  const logger = new StructuredLogger(config.logLevel);
  const db = new PostgresPool(config.dbUrl);
  const userRepo = new PostgresUserRepository(db);
  const userService = new UserService(userRepo, logger);
  return new App(userService);
}
```

## Builder Pattern with Type Accumulation

```typescript
interface RequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

class RequestBuilder<Config extends Partial<RequestConfig> = {}> {
  private config: Partial<RequestConfig> = {};

  url<U extends string>(url: U): RequestBuilder<Config & { url: U }> {
    this.config.url = url;
    return this as any;
  }

  method<M extends string>(method: M): RequestBuilder<Config & { method: M }> {
    this.config.method = method;
    return this as any;
  }

  header(key: string, value: string): this {
    this.config.headers = { ...this.config.headers, [key]: value };
    return this;
  }

  // Only available when url and method are set
  build(
    this: RequestBuilder<{ url: string; method: string }>
  ): RequestConfig {
    return this.config as RequestConfig;
  }
}

// Compile error if url or method is missing
const request = new RequestBuilder()
  .url("https://api.example.com/users")
  .method("POST")
  .header("Content-Type", "application/json")
  .build(); // OK

// const bad = new RequestBuilder().method("GET").build(); // Error: url missing
```

## Async Patterns

### Type-Safe Middleware Chain

```typescript
type Middleware<Ctx> = (ctx: Ctx, next: () => Promise<void>) => Promise<void>;

function compose<Ctx>(middlewares: Middleware<Ctx>[]): Middleware<Ctx> {
  return async (ctx, next) => {
    let index = -1;

    async function dispatch(i: number): Promise<void> {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      const fn = i < middlewares.length ? middlewares[i] : next;
      await fn(ctx, () => dispatch(i + 1));
    }

    await dispatch(0);
  };
}
```

### Typed Async Cache

```typescript
class AsyncCache<K extends string, V> {
  private cache = new Map<K, { value: V; expiresAt: number }>();
  private pending = new Map<K, Promise<V>>();

  async get(key: K, fetcher: () => Promise<V>, ttlMs: number): Promise<V> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Deduplicate in-flight requests
    const existing = this.pending.get(key);
    if (existing) return existing;

    const promise = fetcher().then((value) => {
      this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      this.pending.delete(key);
      return value;
    });

    this.pending.set(key, promise);
    return promise;
  }
}
```

## Testing Type-Level Code

```typescript
import { expectTypeOf } from "vitest";

test("Result narrows correctly", () => {
  const result: Result<string, Error> = Ok("hello");

  if (result.ok) {
    expectTypeOf(result.value).toEqualTypeOf<string>();
  } else {
    expectTypeOf(result.error).toEqualTypeOf<Error>();
  }
});

test("branded types are incompatible", () => {
  type A = Brand<string, "A">;
  type B = Brand<string, "B">;

  expectTypeOf<A>().not.toEqualTypeOf<B>();
  expectTypeOf<A>().not.toEqualTypeOf<string>();
});
```
