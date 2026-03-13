---
name: "javascript-pro"
description: "Use for modern JavaScript architecture and implementation across browser, Node, and edge runtimes with runtime-aware production practices."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# JavaScript Pro

## Purpose

Expert-level guidance for modern JavaScript development across browser, Node.js, and edge runtimes. Covers module design, async orchestration, runtime-specific patterns, and production-grade error handling with a focus on runtime-aware code that respects platform boundaries.

## When to Use

- Implementing feature work in plain JavaScript.
- Refactoring legacy JS toward modern modules and async flows.
- Improving performance and reliability in browser, Node, or edge runtimes.
- Serving as the language baseline before framework-specific skills are loaded.

## Instructions

1. **Confirm runtime constraints** — identify browser targets, Node version, or edge runtime before choosing APIs or module formats. Runtime determines available features and performance characteristics.

2. **Choose module boundaries and format** — prefer ESM (`import`/`export`) for new code. Configure `"type": "module"` in `package.json`. Keep modules focused to one responsibility. Use barrel exports (`index.js`) only for the public API to preserve tree-shaking.

3. **Design async strategy** — use `AbortSignal` and `AbortController` for cancellable operations. Use `Promise.allSettled()` when all results matter regardless of individual failures. Limit concurrent operations with semaphore patterns to prevent resource exhaustion.

4. **Implement with explicit error and cancellation handling** — always attach `.catch()` or use `try/catch` in async flows. Do not leave promise rejections unhandled because they terminate Node.js processes and cause silent failures in browsers.

5. **Keep side effects at module edges** — pure logic belongs in reusable modules. Side-effectful initialization at module top-level prevents tree-shaking and complicates testing.

6. **Validate untrusted input at boundaries** — sanitize at system entry points such as API handlers and form inputs. Keep dependency surface intentionally small.

7. **Use runtime-appropriate tooling** — Vitest or `node --test` for testing, Biome or ESLint for linting, Vite or esbuild for bundling. Use lockfile-based installs (`npm ci`, `pnpm install --frozen-lockfile`) in CI. Enable `corepack` for consistent package manager versions.

8. **Debug in the target environment** — reproduce runtime-specific failures in the exact target (browser, Node, or edge). Use structured logging with consistent error shapes. Profile with Chrome DevTools or `node --prof` before redesigning hot paths.

9. **Optimize deliberately** — use streams for large payloads to avoid memory spikes. Use `Promise.all` for independent parallel operations. Use dynamic `import()` for code-splitting heavy modules. Do not use UA sniffing in browser code because feature detection is more reliable and maintainable.

10. **Do not use heavy framework coupling in low-level modules** because it prevents reuse. Do not allow copy-paste utility proliferation without consolidation because it causes drift and duplication.

## Output Format

Produces JavaScript code following ESM module conventions with explicit async error handling, runtime-appropriate API usage, and clear module boundaries. Includes structured error objects and cancellation support where applicable.

## References

| File                            | Load when                                                                   |
| ------------------------------- | --------------------------------------------------------------------------- |
| `references/modern-syntax.md`   | Choosing modern syntax/features for current runtime targets.                |
| `references/async-patterns.md`  | Cancellation, retries, concurrency, or promise orchestration needs detail.  |
| `references/modules.md`         | ESM/CJS/module-boundary tradeoffs are in scope.                             |
| `references/browser-apis.md`    | Browser-specific APIs, capability checks, or UX/runtime constraints matter. |
| `references/node-essentials.md` | Node runtime behavior, streams, files, or process concerns matter.          |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Refactor this callback-heavy Express handler to use async/await with proper error handling and AbortController for timeout."
- "Design the module structure for a shared utility library that needs to support both ESM and CJS consumers."
- "Optimize this Node.js data pipeline to use streams instead of loading the full dataset into memory."
