# TypeScript Configuration (5.9+)

## Recommended tsconfig.json

```jsonc
{
  "compilerOptions": {
    // --- Strict safety ---
    "strict": true,                          // Enables all strict checks
    "noUncheckedIndexedAccess": true,        // Array/record index returns T | undefined
    "exactOptionalPropertyTypes": true,      // Distinguishes undefined from missing
    "noFallthroughCasesInSwitch": true,      // Prevents switch fallthrough bugs

    // --- Module system ---
    "module": "ESNext",                      // Or "NodeNext" for Node.js libraries
    "moduleResolution": "bundler",           // Or "nodenext" for Node.js
    "esModuleInterop": true,                 // Fixes CJS/ESM interop
    "isolatedModules": true,                 // Required by most bundlers/transpilers
    "verbatimModuleSyntax": true,            // Enforces import type for type-only imports

    // --- Output ---
    "target": "ES2022",                      // Supports top-level await, cause on Error
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "declaration": true,                     // Emit .d.ts files
    "declarationMap": true,                  // Source maps for declarations
    "sourceMap": true,

    // --- TS 6 readiness ---
    "erasableSyntaxOnly": true,              // TS 5.8+: forbids runtime-semantic TS syntax

    // --- Code quality ---
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,

    // --- Paths ---
    "rootDir": "src",
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## What `strict: true` Activates

| Flag | What it catches |
| --- | --- |
| `strictNullChecks` | Prevents `undefined is not an object` at runtime |
| `noImplicitAny` | Forces type annotations where TS cannot infer |
| `strictFunctionTypes` | Catches contravariance bugs in function assignments |
| `strictBindCallApply` | Types `bind`, `call`, `apply` correctly |
| `strictPropertyInitialization` | Catches uninitialized class properties |
| `noImplicitThis` | Prevents `this` from being `any` in functions |
| `useUnknownInCatchVariables` | `catch(e)` gives `unknown` instead of `any` |
| `alwaysStrict` | Emits `"use strict"` in every file |

## Module Resolution Explained

### `"bundler"` (for bundled projects)

```jsonc
"moduleResolution": "bundler"
```

- Understands `exports` maps in package.json.
- Allows extensionless imports (`import { foo } from './utils'`).
- Does NOT require `.js` extensions in import paths.
- Use for: Vite, webpack, esbuild, turbopack, Next.js.

### `"nodenext"` (for Node.js)

```jsonc
"module": "NodeNext",
"moduleResolution": "nodenext"
```

- Requires `.js` extensions in relative imports (even for `.ts` source files).
- Reads `exports` and `imports` from package.json.
- Distinguishes `.mjs`/`.cjs` from `.mts`/`.cts`.
- Use for: Node.js libraries, CLIs, servers without a bundler.

### `"node"` (legacy — avoid)

- Does NOT read `exports` maps.
- Cannot find packages that only export via `exports`.
- Many modern packages are broken under this resolution mode.

## `verbatimModuleSyntax` (TS 5.0+)

Replaces `importsNotUsedAsValues` and `preserveValueImports`.

```typescript
// This import is used as a type only:
import type { Config } from './config';  // Erased — correct

// This import has both value and type usage:
import { createConfig, type Config } from './config';  // Mixed — correct

// ERROR: importing a type without `type` keyword
import { Config } from './config';  // Error if Config is only a type
```

## `erasableSyntaxOnly` (TS 5.8+)

Forbids TypeScript-only syntax that has runtime semantics. This prepares for Node.js native TS stripping (which can only erase, not transform).

### Forbidden under erasableSyntaxOnly

| Feature | Alternative |
| --- | --- |
| `enum` | `as const` objects |
| `namespace` (value-producing) | ES modules |
| `constructor(public x: number)` | Explicit field + assignment |
| `const enum` | `as const` objects |

### Allowed (erasable)

- `interface`, `type`
- `import type`, type annotations
- `satisfies`, `as` assertions
- `declare` blocks
- TC39 decorators (not legacy decorators)

## `exactOptionalPropertyTypes` (TS 4.4+)

Distinguishes between "property is missing" and "property is `undefined`."

```typescript
interface Options {
  color?: string;  // color can be missing, but if present, must be string
}

const a: Options = {};               // OK: color is missing
const b: Options = { color: "red" }; // OK: color is string
const c: Options = { color: undefined }; // ERROR with exactOptionalPropertyTypes
```

## Project References (Monorepo)

```jsonc
// tsconfig.json (root)
{
  "references": [
    { "path": "packages/core" },
    { "path": "packages/api" },
    { "path": "packages/web" }
  ]
}

// packages/core/tsconfig.json
{
  "compilerOptions": {
    "composite": true,  // Required for project references
    "outDir": "dist",
    "rootDir": "src"
  }
}

// packages/api/tsconfig.json
{
  "references": [{ "path": "../core" }],
  "compilerOptions": {
    "composite": true
  }
}
```

Build with `tsc --build` for incremental cross-package compilation.

## Migration Strategy: Loose to Strict

1. Enable `strict: true` and fix all errors. Alternatively, enable individual flags incrementally.
2. Add `noUncheckedIndexedAccess: true` second — this produces the most errors.
3. Add `exactOptionalPropertyTypes: true` last — this is the strictest.
4. Use `// @ts-expect-error` (not `// @ts-ignore`) for temporary suppressions because `@ts-expect-error` errors when the suppressed error is fixed.
