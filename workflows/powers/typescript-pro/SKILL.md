---
name: typescript-pro
description: "Use for TypeScript architecture and implementation with TS 5.9+ production baselines and TS 6/7 transition readiness. Use when designing type-safe APIs, refactoring to strict TypeScript, reducing type regressions in monorepos, or preparing for TS 6/7 behavior shifts."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# TypeScript Pro

## Purpose

Language-layer specialist for TypeScript architecture, type design, and production implementation. Provides the type-system foundation before loading framework skills like `nextjs-developer` or `nestjs-expert`. Covers strict compiler configuration, domain modeling with discriminated unions, generic patterns, module structure, and tooling selection for TS 5.9+ codebases with awareness of TS 6/7 transitions.

## When to Use

- Designing type-safe APIs and shared contracts.
- Refactoring codebases to strict TypeScript.
- Reducing type regressions in monorepos.
- Preparing for upcoming TS 6/7 behavior shifts.
- Acting as the language-layer foundation before loading framework skills.

## Instructions

1. Confirm runtime and module target (Node, browser, edge) because compiler settings and polyfill requirements differ.
2. Lock strict compiler baseline (`strict: true`) before feature work because weak defaults hide implicit `any`.
3. Model domain types first with discriminated unions and `satisfies`/`as const`, then implement behavior — type design is the primary design feedback loop.
4. Use `unknown` over `any` at boundaries because `any` silently defeats type checking.
5. Narrow with type guards (`x is T`) instead of `as` assertions because guards provide runtime safety while assertions only silence the compiler.
6. Encode state machines with discriminated unions and exhaustive `switch`/`assertNever` checks because unhandled variants become compile errors.
7. Use schema validation (Zod/Valibot) for external input because runtime validation must match declared types at system boundaries.
8. Keep public API types stable and explicit — do not rely on inferred return types for exported functions.
9. Use project references (`composite: true` + `references`) for large repos because they enable incremental builds and cross-package type awareness.
10. Keep barrel exports (`index.ts`) thin — re-export only the public API because deep barrels cause circular dependency pain and slow IDE resolution.
11. Use `import type` for type-only imports because it prevents runtime import of type-only modules and improves tree-shaking.
12. Use constrained generics to express input/output relationships — do not exceed 3 type parameters without splitting the abstraction.
13. Prefer mapped types and template literal types for systematic type transformations — extract complex conditional types into named types for readability.
14. Run `tsc --noEmit` in CI separately from bundling because type errors should fail CI even when the bundler succeeds.
15. Use Biome or ESLint + `typescript-eslint` for linting; `tsup` for library builds; Vitest for tests with native TS support.
16. Do not use library-facing `any` — it poisons downstream callers.
17. Do not use broad `as` casts to silence errors — treat type errors as design feedback, not noise.
18. Do not mix runtime and type-only imports carelessly — use `import type` consistently.

## Output Format

Provide type definitions, implementation code, and compiler configuration as fenced TypeScript code blocks. Include `tsconfig.json` excerpts when configuration changes are part of the solution. Explain type-level design decisions inline with brief comments.

## References

| File                           | Load when                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `references/configuration.md`  | `tsconfig`, strictness, module targets, or project references need detail.   |
| `references/advanced-types.md` | Generics, conditional types, mapped types, or template literals are central. |
| `references/type-guards.md`    | Narrowing and runtime-safe type refinement need detail.                      |
| `references/utility-types.md`  | Utility-type composition or shared helper types are in scope.                |
| `references/patterns.md`       | Type-safe architecture patterns or public API design needs detail.           |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Refactor this module to use strict TypeScript with discriminated unions for state"
- "Design a type-safe event system with template literal types"
- "Set up tsconfig project references for our monorepo"
- "Replace these `any` casts with proper type narrowing"
