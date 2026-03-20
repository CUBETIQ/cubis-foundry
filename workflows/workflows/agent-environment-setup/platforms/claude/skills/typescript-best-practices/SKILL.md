---
name: typescript-best-practices
description: "Use when writing production TypeScript 5.9+ code: strict configuration, advanced type-level programming, discriminated unions, branded types, and patterns that prepare codebases for TS 6/7 evolution."
allowed-tools: Read Grep Glob Bash Edit Write
user-invocable: true
argument-hint: "TypeScript module, type, or pattern to analyze"
---

# TypeScript Best Practices

## Purpose

Production-grade guidance for TypeScript 5.9+ covering strict compiler configuration, advanced type-level programming (conditional types, mapped types, template literals), discriminated unions for state machines, branded/opaque types for domain safety, and forward-compatible patterns that minimize migration cost when TS 6 and 7 arrive.

## When to Use

- Starting new TypeScript projects or migrating JavaScript codebases.
- Tightening tsconfig to strict mode or enabling new 5.9+ checks.
- Designing complex type hierarchies, discriminated unions, or branded types.
- Building type-safe APIs, SDKs, or shared libraries.
- Preparing a codebase for upcoming TS 6/7 changes (e.g., `--erasableSyntaxOnly`).

## Instructions

1. **Enable `strict: true` as the non-negotiable baseline** — this activates `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and related flags in one switch. Never disable individual strict flags because each one prevents a distinct class of runtime bug that tests alone cannot catch reliably.

2. **Add `noUncheckedIndexedAccess: true`** — this makes array and record index access return `T | undefined` instead of `T`, forcing you to handle missing keys. Enable it because production crashes from `undefined` property access are the single most common TypeScript runtime error category.

3. **Use discriminated unions for state modeling** — define a `type` or `kind` literal field as the discriminant. Exhaustiveness-check with `never` in the default branch of switch statements because the compiler then errors when a new variant is added but not handled.

4. **Prefer `satisfies` over type assertions** — `const config = { ... } satisfies Config` validates the shape while preserving the narrowest literal types. Avoid `as Config` because it silently widens types and suppresses errors on missing or extra properties.

5. **Build branded types for domain primitives** — use `type UserId = string & { readonly __brand: unique symbol }` with a constructor function that validates at the boundary. Branded types prevent passing a `PostId` where a `UserId` is expected because the brands are structurally incompatible.

6. **Use `const` type parameters (TS 5.0+) for literal inference** — declare `function route<const T extends readonly string[]>(paths: T)` to infer tuple literals instead of `string[]`. This matters for type-safe routing, event systems, and builder patterns because literal types enable exhaustive checking downstream.

7. **Design conditional types for library APIs only** — conditional types (`T extends U ? A : B`) are powerful but hurt readability. Limit them to shared utility types and library boundaries. For application code, prefer explicit overload signatures or discriminated unions because they produce clearer error messages.

8. **Map and filter types with mapped types and `as` clauses** — use `{ [K in keyof T as K extends ExcludedKeys ? never : K]: T[K] }` to reshape objects at the type level. Combine with template literal types for prefix/suffix transformations because mapped types replace entire categories of hand-written type definitions.

9. **Use `import type` and `type` keyword in imports** — write `import type { Config } from './config'` or `import { type Config, createConfig } from './config'` to ensure type-only imports are erased at compile time. This matters for bundler tree-shaking and prepares for `--erasableSyntaxOnly` (TS 5.8+) which will become stricter in TS 6.

10. **Avoid enums; use `as const` objects instead** — `const Status = { Active: 'active', Inactive: 'inactive' } as const` with `type Status = typeof Status[keyof typeof Status]` gives string literals without the runtime overhead and tree-shaking problems of TypeScript enums. Enums also behave differently under `--isolatedModules` and `--erasableSyntaxOnly`.

11. **Configure `moduleResolution: "bundler"` or `"nodenext"`** — never use `"node"` (legacy Node10 resolution) for new projects because it cannot resolve `exports` maps in package.json. Use `"bundler"` for frontend/bundled projects and `"nodenext"` for Node.js libraries because these match how the runtime actually resolves modules.

12. **Validate external data at boundaries with Zod or Valibot** — do not trust `as` assertions on API responses, file reads, or user input. Parse with a runtime schema validator and infer the TypeScript type from the schema (`z.infer<typeof schema>`) because this guarantees runtime and compile-time types stay synchronized.

13. **Write tests that exercise the type system** — use `expectTypeOf` from `vitest` or `tsd` to assert that types narrow, widen, and error correctly. Type-level tests catch regressions when utility types change because runtime tests cannot verify that a function rejects an invalid type at compile time.

14. **Use `tsx` or `ts-node` with `--esm` for scripts** — avoid compiling one-off scripts to JS. Use `tsx watch` for development. For production, compile with `tsc --declaration` and ship `.js` + `.d.ts` because runtime type-stripping (Node 23+) still requires declaration files for library consumers.

15. **Prepare for TS 6/7 breaking changes** — avoid parameter decorators that rely on `emitDecoratorMetadata` (deprecated path), avoid `namespace` merging across files, and avoid `const enum` (incompatible with `--isolatedModules`). These features are on the deprecation track because TS is converging toward ECMAScript-aligned semantics.

16. **Lint with typescript-eslint v8+ and enforce type-aware rules** — enable `@typescript-eslint/strict-type-checked` and `@typescript-eslint/stylistic-type-checked` rule sets. These catch `any` leaks, unsafe returns, and floating promises that tsc alone misses because the linter has access to type information the compiler does not surface as errors.

## Output Format

Produces TypeScript code with strict compiler settings, discriminated unions, branded types, and `satisfies` validation. Includes tsconfig.json configuration, type-level tests, and inline comments explaining non-obvious type design choices.

## References

| File | Load when |
| --- | --- |
| `references/configuration.md` | tsconfig.json settings, module resolution, or strict mode flags need detail. |
| `references/advanced-types.md` | Conditional types, mapped types, template literal types, or type inference needed. |
| `references/type-guards.md` | Type narrowing, custom type guards, `satisfies`, or branded types needed. |
| `references/utility-types.md` | Built-in or custom utility types, `Pick`, `Omit`, `Record`, etc. needed. |
| `references/patterns.md` | Architecture patterns, discriminated unions, builder pattern, or module design needed. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Migrate this codebase from loose tsconfig to strict mode with noUncheckedIndexedAccess."
- "Design a type-safe state machine using discriminated unions with exhaustiveness checking."
- "Create branded types for UserId, PostId, and Email with runtime validation at API boundaries."

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents live under `../../agents/` relative to the mirrored skill directory and support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Current project-memory agents are `orchestrator` and `planner`; use them for durable project context.
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules live under `../../rules/` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
