# TypeScript Advanced Types

## Conditional Types

Conditional types select one of two types based on a condition: `T extends U ? A : B`.

### Basic Conditional Types

```typescript
// Extract the element type of an array, or the type itself
type Flatten<T> = T extends Array<infer U> ? U : T;

type A = Flatten<string[]>;   // string
type B = Flatten<number>;     // number

// Extract the return type of a function
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;

type C = ReturnOf<() => string>;          // string
type D = ReturnOf<(x: number) => boolean>; // boolean
```

### Distributive Conditional Types

When a conditional type acts on a union, it distributes over each member:

```typescript
type ToArray<T> = T extends unknown ? T[] : never;

type E = ToArray<string | number>;  // string[] | number[]
// NOT (string | number)[]

// Prevent distribution by wrapping in tuple
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;

type F = ToArrayNonDist<string | number>;  // (string | number)[]
```

### Recursive Conditional Types

```typescript
// Deep readonly: makes all nested properties readonly
type DeepReadonly<T> = T extends Function
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

type Config = {
  db: { host: string; port: number };
  features: string[];
};

type ReadonlyConfig = DeepReadonly<Config>;
// { readonly db: { readonly host: string; readonly port: number }; readonly features: readonly string[] }
```

## Mapped Types

Transform object types by iterating over their keys.

### Basic Mapped Types

```typescript
// Make all properties optional
type Partial<T> = { [K in keyof T]?: T[K] };

// Make all properties required
type Required<T> = { [K in keyof T]-?: T[K] };

// Make all properties readonly
type Readonly<T> = { readonly [K in keyof T]: T[K] };
```

### Key Remapping with `as` (TS 4.1+)

```typescript
// Filter keys by type
type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
};

// Prefix all keys
type Prefixed<T, P extends string> = {
  [K in keyof T as `${P}${Capitalize<string & K>}`]: T[K]
};

interface User {
  name: string;
  age: number;
  email: string;
}

type StringFields = OnlyStrings<User>;
// { name: string; email: string }

type GetUser = Prefixed<User, "get">;
// { getName: string; getAge: number; getEmail: string }
```

### Mapped Type Modifiers

```typescript
// Remove readonly
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// Remove optional
type Concrete<T> = { [K in keyof T]-?: T[K] };
```

## Template Literal Types

String manipulation at the type level.

### Basic Template Literals

```typescript
type EventName = `on${Capitalize<"click" | "focus" | "blur">}`;
// "onClick" | "onFocus" | "onBlur"

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
type APIRoute = `/api/${string}`;
type TypedRoute = `/api/${"users" | "products"}`;
```

### Intrinsic String Manipulation

```typescript
type Upper = Uppercase<"hello">;       // "HELLO"
type Lower = Lowercase<"HELLO">;       // "hello"
type Cap = Capitalize<"hello">;        // "Hello"
type Uncap = Uncapitalize<"Hello">;    // "hello"
```

### Parsing Strings with infer

```typescript
// Extract path parameters from a URL pattern
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<Rest>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type Params = ExtractParams<"/users/:userId/posts/:postId">;
// "userId" | "postId"
```

## Variadic Tuple Types (TS 4.0+)

```typescript
// Typed concat function
function concat<T extends unknown[], U extends unknown[]>(
  a: [...T],
  b: [...U]
): [...T, ...U] {
  return [...a, ...b];
}

const result = concat([1, "two"] as const, [true, 4] as const);
// type: [1, "two", true, 4]

// Typed head/tail
type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;
type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : never;
```

## `infer` Keyword Patterns

```typescript
// Extract promise value type
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// Extract constructor parameter types
type ConstructorParams<T> = T extends new (...args: infer P) => any ? P : never;

// Extract second parameter of a function
type SecondParam<T> = T extends (a: any, b: infer B, ...args: any[]) => any ? B : never;

// Extract object values
type ValueOf<T> = T[keyof T];
```

## Const Type Parameters (TS 5.0+)

```typescript
// Without const: paths inferred as string[]
function createRoutes<T extends readonly string[]>(paths: T): T {
  return paths;
}
const routes1 = createRoutes(["home", "about"]); // string[]

// With const: paths inferred as readonly tuple of literals
function createRoutes2<const T extends readonly string[]>(paths: T): T {
  return paths;
}
const routes2 = createRoutes2(["home", "about"]); // readonly ["home", "about"]
```

## When NOT to Use Advanced Types

1. **Application code**: conditional types make error messages unreadable. Use discriminated unions.
2. **Deeply nested generics**: if a type needs 4+ type parameters, break it apart.
3. **Performance**: deeply recursive types slow down the compiler. Limit recursion depth.
4. **Team readability**: if the team cannot read the type, simplify it. Type safety that no one understands provides no safety.
