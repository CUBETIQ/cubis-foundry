# TypeScript Best Practices — Eval Assertions

## Eval 1: Strict Migration (typescript-strict-migration)

This eval tests whether the skill correctly migrates a loose TypeScript project to strict mode with proper null safety.

### Assertions

1. **Strict mode enabled with explanation** — The response must enable `strict: true` in tsconfig.json and explain what flags it activates (at minimum: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`). Understanding what strict mode enables is essential for migration.

2. **noUncheckedIndexedAccess enabled** — The response must add `noUncheckedIndexedAccess: true` and demonstrate handling the resulting `T | undefined` return types. This flag is the most impactful strict addition beyond the `strict` umbrella.

3. **Explicit parameter types and null handling** — The `id` parameter in `getUser` must receive an explicit type annotation (e.g., `number`), and the return type `User | undefined` must be handled properly by the caller rather than assumed to be non-null.

4. **Runtime validation for external data** — The `processUsers` function's `any` parameter must be replaced with either a properly typed interface or runtime validation using Zod, Valibot, or a similar schema validator. Trusting `as` assertions on external data is a common source of runtime crashes.

5. **satisfies for config objects** — The `config` object should use the `satisfies` operator (e.g., `satisfies AppConfig`) to validate the shape while preserving the `as const` literal types, or an equivalent approach that does not widen the types through assertion.

## Eval 2: Discriminated Union Design (typescript-discriminated-union)

This eval tests whether the skill produces a type-safe state machine with proper exhaustiveness checking.

### Assertions

1. **Literal discriminant field** — Each payment state must have a literal string field (e.g., `status: 'pending'`, `status: 'authorized'`) that TypeScript can use as a discriminant for union narrowing.

2. **State-specific data** — Each variant must carry its own fields. Authorized should have an authorization code, Captured should have a capture ID, etc. States should not share a flat bag of optional fields.

3. **Exhaustiveness checking with never** — The response must include a `switch` statement (or equivalent) whose default case assigns to `never`, so the compiler errors if a new state is added but not handled. This is the core safety guarantee of discriminated unions.

4. **Type-safe transitions** — The transition function must use type narrowing to ensure only valid transitions compile. For example, `Refunded` can only come from `Captured`, not from `Pending`.

5. **Compile-time invalid transition rejection** — The response must demonstrate (through types, not runtime checks) that attempting an invalid transition is a compiler error. This proves the state machine is enforced at the type level.
