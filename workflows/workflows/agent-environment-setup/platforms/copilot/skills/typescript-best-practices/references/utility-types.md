# TypeScript Utility Types

## Built-in Utility Types

### Object Manipulation

```typescript
// Partial<T> — all properties optional
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string }

// Required<T> — all properties required
type RequiredConfig = Required<Config>;
// Removes all ? modifiers

// Readonly<T> — all properties readonly
type FrozenState = Readonly<AppState>;

// Pick<T, K> — select specific properties
type UserSummary = Pick<User, "id" | "name">;
// { id: number; name: string }

// Omit<T, K> — remove specific properties
type CreateUserInput = Omit<User, "id" | "createdAt">;
// { name: string; email: string }

// Record<K, V> — construct object type from keys and values
type StatusMap = Record<"active" | "inactive" | "suspended", User[]>;
// { active: User[]; inactive: User[]; suspended: User[] }
```

### Union Manipulation

```typescript
// Exclude<T, U> — remove members from union
type NonNullString = Exclude<string | null | undefined, null | undefined>;
// string

// Extract<T, U> — keep members that match
type NumbersOnly = Extract<string | number | boolean, number>;
// number

// NonNullable<T> — remove null and undefined
type Defined = NonNullable<string | null | undefined>;
// string
```

### Function Types

```typescript
// ReturnType<T>
type FetchResult = ReturnType<typeof fetchUser>;

// Parameters<T>
type FetchParams = Parameters<typeof fetchUser>;
// [id: string, options?: FetchOptions]

// Awaited<T> — unwrap Promise
type UserData = Awaited<ReturnType<typeof fetchUser>>;
// User (unwrapped from Promise<User>)

// ConstructorParameters<T>
type ErrorArgs = ConstructorParameters<typeof Error>;
// [message?: string, options?: ErrorOptions]

// InstanceType<T>
type ErrorInstance = InstanceType<typeof Error>;
// Error
```

### String Manipulation Types

```typescript
type Upper = Uppercase<"hello">;       // "HELLO"
type Lower = Lowercase<"HELLO">;       // "hello"
type Cap = Capitalize<"hello">;        // "Hello"
type Uncap = Uncapitalize<"Hello">;    // "hello"
```

## Custom Utility Types

### DeepPartial

```typescript
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

// Usage: config overrides
function mergeConfig(base: Config, overrides: DeepPartial<Config>): Config {
  return deepMerge(base, overrides);
}
```

### DeepReadonly

```typescript
type DeepReadonly<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;
```

### StrictOmit (safer Omit)

```typescript
// Built-in Omit does not error on non-existent keys
type Bad = Omit<User, "nonExistent">; // No error!

// StrictOmit constrains K to actual keys of T
type StrictOmit<T, K extends keyof T> = Omit<T, K>;
type Good = StrictOmit<User, "nonExistent">; // Error!
```

### RequireAtLeastOne

```typescript
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

interface Filter {
  name?: string;
  email?: string;
  role?: string;
}

// At least one filter field must be provided
type ValidFilter = RequireAtLeastOne<Filter>;
```

### Prettify (Flatten Intersections)

```typescript
type Prettify<T> = { [K in keyof T]: T[K] } & {};

// Before: hover shows `Pick<User, "name"> & { age: number }`
// After:  hover shows `{ name: string; age: number }`
type Pretty = Prettify<Pick<User, "name"> & { age: number }>;
```

### PathKeys (Dot-Notation Access)

```typescript
type PathKeys<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? PathKeys<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

interface Config {
  db: { host: string; port: number };
  cache: { ttl: number };
}

type ConfigPath = PathKeys<Config>;
// "db" | "db.host" | "db.port" | "cache" | "cache.ttl"
```

### MergeTypes (Deep Merge Two Object Types)

```typescript
type MergeTypes<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? K extends keyof A
      ? A[K] extends object
        ? B[K] extends object
          ? MergeTypes<A[K], B[K]>
          : B[K]
        : B[K]
      : B[K]
    : K extends keyof A
      ? A[K]
      : never;
};
```

## Patterns with Utility Types

### Builder Pattern with Generics

```typescript
class QueryBuilder<T extends Record<string, unknown> = {}> {
  private conditions: Partial<T> = {};

  where<K extends string, V>(
    key: K,
    value: V
  ): QueryBuilder<T & Record<K, V>> {
    (this.conditions as any)[key] = value;
    return this as unknown as QueryBuilder<T & Record<K, V>>;
  }

  build(): T {
    return this.conditions as T;
  }
}

const query = new QueryBuilder()
  .where("name", "Alice")
  .where("age", 30)
  .build();
// type: { name: string; age: number }
```

### Discriminated Union from Config

```typescript
// Generate a union from an object definition
const EventConfig = {
  click: { x: 0, y: 0 },
  keydown: { key: "" },
  scroll: { offset: 0 },
} as const;

type EventMap = typeof EventConfig;
type EventType = keyof EventMap;

type AppEvent = {
  [K in EventType]: { type: K } & { [P in keyof EventMap[K]]: EventMap[K][P] extends number ? number : string };
}[EventType];
// { type: "click"; x: number; y: number } | { type: "keydown"; key: string } | { type: "scroll"; offset: number }
```

### Type-Safe Event Emitter

```typescript
type EventListener<T> = (data: T) => void;

class TypedEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<string, Set<Function>>();

  on<K extends keyof Events & string>(
    event: K,
    listener: EventListener<Events[K]>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  emit<K extends keyof Events & string>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }
}

// Usage
interface AppEvents {
  userCreated: { id: string; name: string };
  orderPlaced: { orderId: string; total: number };
}

const emitter = new TypedEmitter<AppEvents>();
emitter.on("userCreated", (data) => {
  console.log(data.name); // Fully typed
});
emitter.emit("userCreated", { id: "1", name: "Alice" }); // Validated
```

## Anti-Patterns

1. **Overusing `Omit` chains** — `Omit<Omit<User, "id">, "email">` is hard to read. Create a named type.
2. **`Record<string, any>`** — use `Record<string, unknown>` or a specific value type.
3. **Deeply nested utility compositions** — if the type is unreadable, refactor into named intermediate types.
4. **Using utility types where a new interface suffices** — `Pick<User, "name" | "email">` is fine; but if this shape is a real concept, name it `UserContactInfo`.
