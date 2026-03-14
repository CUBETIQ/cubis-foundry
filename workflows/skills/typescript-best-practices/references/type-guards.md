# TypeScript Type Guards and Narrowing

## Built-in Narrowing

TypeScript narrows types automatically in control flow:

### typeof Guards

```typescript
function formatValue(value: string | number | boolean): string {
  if (typeof value === "string") {
    return value.toUpperCase(); // string
  }
  if (typeof value === "number") {
    return value.toFixed(2); // number
  }
  return value ? "yes" : "no"; // boolean
}
```

### instanceof Guards

```typescript
function getArea(shape: Circle | Rectangle): number {
  if (shape instanceof Circle) {
    return Math.PI * shape.radius ** 2; // Circle
  }
  return shape.width * shape.height; // Rectangle
}
```

### in Operator

```typescript
interface Dog { bark(): void; legs: number; }
interface Fish { swim(): void; fins: number; }

function move(animal: Dog | Fish): void {
  if ("bark" in animal) {
    animal.bark(); // Dog
  } else {
    animal.swim(); // Fish
  }
}
```

### Truthiness Narrowing

```typescript
function processName(name: string | null | undefined): string {
  if (name) {
    return name.trim(); // string (excludes null, undefined, "")
  }
  return "anonymous";
}
```

## Custom Type Guard Functions

### Basic Type Predicates

```typescript
interface User { type: "user"; name: string; }
interface Admin { type: "admin"; name: string; permissions: string[]; }

// Return type `is Admin` narrows the parameter
function isAdmin(person: User | Admin): person is Admin {
  return person.type === "admin";
}

function greet(person: User | Admin): string {
  if (isAdmin(person)) {
    return `Admin ${person.name} with ${person.permissions.length} permissions`;
  }
  return `User ${person.name}`; // Narrowed to User
}
```

### Array Filter with Type Guards

```typescript
function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

const items: (string | null)[] = ["a", null, "b", null, "c"];
const defined: string[] = items.filter(isDefined);
// Without the type guard, filter returns (string | null)[]
```

### Assertion Functions (TS 3.7+)

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }
}

function processInput(input: unknown): string {
  assertIsString(input);
  // input is now string — no if/else needed
  return input.toUpperCase();
}

// Assert non-null
function assertDefined<T>(value: T | null | undefined, msg?: string): asserts value is T {
  if (value == null) {
    throw new Error(msg ?? "Value is null or undefined");
  }
}
```

## Discriminated Union Narrowing

The most powerful narrowing pattern for complex state:

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function handleResult(result: Result<string>): string {
  if (result.ok) {
    return result.value; // { ok: true; value: string }
  }
  throw result.error; // { ok: false; error: Error }
}

// Exhaustiveness with never
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rect":
      return shape.width * shape.height;
    case "triangle":
      return 0.5 * shape.base * shape.height;
    default: {
      const _exhaustive: never = shape;
      throw new Error(`Unhandled shape: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
```

## `satisfies` Operator (TS 4.9+)

`satisfies` validates that an expression matches a type without widening it.

```typescript
type ColorMap = Record<string, [number, number, number] | string>;

// Using `as ColorMap` — widens, loses literal info
const colors1 = {
  red: [255, 0, 0],
  green: "#00ff00",
} as ColorMap;
// colors1.red is [number, number, number] | string — lost tuple info

// Using `satisfies` — validates without widening
const colors2 = {
  red: [255, 0, 0],
  green: "#00ff00",
} satisfies ColorMap;
// colors2.red is [number, number, number] — preserved!
// colors2.green is string — preserved!
```

### satisfies vs type annotation

```typescript
// Type annotation: widens to Config
const config1: Config = { timeout: 5000 }; // config1.timeout is number

// satisfies: validates against Config, preserves literal
const config2 = { timeout: 5000 } satisfies Config; // config2.timeout is 5000
```

## Branded Types

Prevent mixing structurally identical types:

```typescript
// Approach 1: unique symbol brand
declare const UserIdBrand: unique symbol;
declare const PostIdBrand: unique symbol;

type UserId = string & { readonly [UserIdBrand]: typeof UserIdBrand };
type PostId = string & { readonly [PostIdBrand]: typeof PostIdBrand };

// Constructor functions validate and brand at the boundary
function UserId(id: string): UserId {
  if (!id.startsWith("usr_")) throw new Error("Invalid user ID format");
  return id as UserId;
}

function PostId(id: string): PostId {
  if (!id.startsWith("pst_")) throw new Error("Invalid post ID format");
  return id as PostId;
}

function getUser(id: UserId): User { /* ... */ }

const userId = UserId("usr_123");
const postId = PostId("pst_456");

getUser(userId); // OK
getUser(postId); // ERROR: PostId is not assignable to UserId
getUser("usr_789"); // ERROR: string is not assignable to UserId

// Approach 2: generic Brand utility
type Brand<T, B extends string> = T & { readonly __brand: B };

type Email = Brand<string, "Email">;
type URL = Brand<string, "URL">;

function Email(value: string): Email {
  if (!value.includes("@")) throw new Error("Invalid email");
  return value as Email;
}
```

## Narrowing Pitfalls

### Closure Narrowing Limitation

```typescript
let value: string | null = "hello";

// TS narrows here
if (value !== null) {
  // value is string
  setTimeout(() => {
    // value could be null again — TS does NOT narrow inside closures
    // because the outer scope may reassign before the closure runs
    value.toUpperCase(); // Error in strict mode
  }, 100);
}
```

**Fix**: capture the narrowed value in a `const`:

```typescript
if (value !== null) {
  const captured = value; // string
  setTimeout(() => {
    captured.toUpperCase(); // OK — const cannot be reassigned
  }, 100);
}
```

### Object Property Narrowing

```typescript
interface Options {
  callback?: () => void;
}

function run(options: Options) {
  if (options.callback) {
    // options.callback is () => void here
    options.callback(); // OK

    // But in a nested function:
    function later() {
      options.callback(); // Error: possibly undefined
      // TS cannot guarantee the property was not deleted/reassigned
    }
  }
}
```

**Fix**: destructure to a local `const`:

```typescript
function run(options: Options) {
  const { callback } = options;
  if (callback) {
    callback(); // OK
    function later() {
      callback(); // OK — local const
    }
  }
}
```
