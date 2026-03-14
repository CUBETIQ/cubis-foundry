# Example: Eval and Iterate on a Skill

## User Request

> Run evals on the typescript-best-practices skill and improve any failing assertions.

## Skill Creator Output

### Step 1: Load Evals

Reading `workflows/skills/typescript-best-practices/evals/evals.json`:

```json
{
  "evals": [
    {
      "prompt": "Migrate a JavaScript project to strict TypeScript with proper type safety...",
      "assertions": [
        "recommends strict: true in tsconfig.json",
        "uses unknown instead of any at boundaries",
        "implements discriminated unions for domain modeling",
        "configures import type for type-only imports",
        "sets up tsc --noEmit in CI pipeline"
      ]
    }
  ]
}
```

### Step 2: Run Eval 1

**Prompt:** "Migrate a JavaScript project to strict TypeScript..."

**Output analysis:**

| # | Assertion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | recommends strict: true | PASS | Output includes `"strict": true` in tsconfig example |
| 2 | uses unknown instead of any | PASS | States "Use unknown over any at boundaries" |
| 3 | implements discriminated unions | PASS | Shows tagged union example with exhaustive switch |
| 4 | configures import type | FAIL | Mentions `import type` but doesn't show configuration |
| 5 | sets up tsc --noEmit in CI | PASS | Includes CI script example |

### Step 3: Diagnose Failure

**Assertion 4 failed** because the skill's instruction #11 says "Use `import type` for type-only imports" but doesn't explain HOW to configure the TypeScript compiler to enforce this.

### Step 4: Improve Instruction

**Before:**
> 11. Use `import type` for type-only imports because it prevents runtime import of type-only modules.

**After:**
> 11. Use `import type` for type-only imports and enable `verbatimModuleSyntax: true` in tsconfig.json because this compiler flag enforces that type-only imports use the `import type` syntax, preventing accidental runtime imports of type-only modules and improving tree-shaking.

### Step 5: Re-run Eval

After updating the instruction, re-run the eval:

| # | Assertion | Result | Evidence |
|---|-----------|--------|----------|
| 4 | configures import type | PASS | Now includes `verbatimModuleSyntax: true` in tsconfig |

### Step 6: Benchmark (3 runs)

| Assertion | Run 1 | Run 2 | Run 3 | Pass Rate |
|-----------|-------|-------|-------|-----------|
| strict: true | PASS | PASS | PASS | 100% |
| unknown over any | PASS | PASS | PASS | 100% |
| discriminated unions | PASS | PASS | PASS | 100% |
| import type config | PASS | PASS | PASS | 100% |
| tsc --noEmit in CI | PASS | PASS | PASS | 100% |

All assertions now pass consistently across 3 runs. Skill iteration complete.
