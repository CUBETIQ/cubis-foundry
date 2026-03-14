# Example: Migrating to Strict TypeScript with noUncheckedIndexedAccess

## Scenario

You inherit a TypeScript project with `strict: false` and pervasive `any` usage. Migrate it to full strict mode with `noUncheckedIndexedAccess`.

## tsconfig.json Changes

```jsonc
{
  "compilerOptions": {
    // Strict baseline — activates all strict flags
    "strict": true,
    // Indexed access returns T | undefined
    "noUncheckedIndexedAccess": true,
    // Module resolution matching modern Node.js
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    // Additional safety
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    // Erase-only syntax for TS 6 readiness
    "erasableSyntaxOnly": true
  }
}
```

## Before (Loose)

```typescript
interface Config {
  features: Record<string, boolean>;
  endpoints: string[];
}

function isFeatureEnabled(config: Config, feature: string) {
  return config.features[feature]; // returns boolean (wrong: could be undefined)
}

function getFirstEndpoint(config: Config) {
  return config.endpoints[0]; // returns string (wrong: could be undefined)
}

function processApiResponse(data: any) {
  return data.users.map((u: any) => u.name.toUpperCase());
}

const defaultConfig = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
} as Config; // silently drops extra type checking
```

## After (Strict with noUncheckedIndexedAccess)

```typescript
import { z } from "zod";

interface Config {
  features: Record<string, boolean>;
  endpoints: string[];
}

function isFeatureEnabled(config: Config, feature: string): boolean {
  // With noUncheckedIndexedAccess, config.features[feature] is boolean | undefined
  return config.features[feature] ?? false;
}

function getFirstEndpoint(config: Config): string | undefined {
  // With noUncheckedIndexedAccess, config.endpoints[0] is string | undefined
  const first = config.endpoints[0];
  return first; // caller must handle undefined
}

// Runtime schema for external API data
const ApiResponseSchema = z.object({
  users: z.array(
    z.object({
      name: z.string(),
      email: z.string().email(),
    })
  ),
});

type ApiResponse = z.infer<typeof ApiResponseSchema>;

function processApiResponse(data: unknown): string[] {
  const parsed = ApiResponseSchema.parse(data);
  return parsed.users.map((u) => u.name.toUpperCase());
}

// satisfies validates shape; preserves literal types from as const
const defaultConfig = {
  apiUrl: "https://api.example.com" as const,
  timeout: 5000,
  retries: 3,
} satisfies Partial<Config> & Record<string, unknown>;
// defaultConfig.apiUrl is "https://api.example.com", not string
```

## Key Changes Explained

1. **`noUncheckedIndexedAccess`** forces handling `undefined` on every `Record` and array index access.
2. **`z.infer<typeof schema>`** derives TypeScript types from runtime schemas — one source of truth.
3. **`satisfies`** validates without widening, preserving `as const` literal types.
4. **`unknown` instead of `any`** at API boundaries forces type narrowing before use.
5. **`erasableSyntaxOnly`** prepares for TS 6 where non-erasable syntax may be restricted.
