---
name: "typescript-pro"
description: "Use for TypeScript architecture and implementation with TS 5.9+ production baselines and TS 6/7 transition readiness."
license: MIT
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "typescript"
  baseline: "TypeScript 5.9 stable"
  transition: "TypeScript 6 compatibility prep"
---

# TypeScript Pro

## When to use

- Designing type-safe APIs and shared contracts.
- Refactoring codebases to strict TypeScript.
- Reducing type regressions in monorepos.
- Preparing for upcoming TS 6/7 behavior shifts.

## Core workflow

1. Confirm runtime and module target (Node, browser, edge).
2. Lock strict compiler baseline before feature work.
3. Model domain types first, then implement behavior.
4. Keep runtime validation where untrusted input enters.
5. Run type checks and targeted tests before finishing.

## Baseline standards

- Use `strict: true` and avoid opt-outs unless documented.
- Prefer `unknown` over `any` at boundaries.
- Use `satisfies` and `as const` for safer inference.
- Keep public API types stable and explicit.
- Use project references for large repos.

## Implementation guidance

- Encode state with discriminated unions.
- Narrow with type guards instead of assertions.
- Keep utility types readable; avoid type-level obfuscation.
- Use schema validation (zod/valibot/etc.) for external input.
- Treat type errors as design feedback, not noise.

## Avoid

- Library-facing `any`.
- Broad `as` casts to silence errors.
- Hidden implicit `any` from weak tsconfig defaults.
- Mixing runtime and type-only imports carelessly.

## Reference files

- `references/configuration.md`
- `references/advanced-types.md`
- `references/type-guards.md`
- `references/utility-types.md`
- `references/patterns.md`
