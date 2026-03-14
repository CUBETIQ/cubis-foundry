---
name: javascript-best-practices
description: "Use when writing, refactoring, or reviewing modern JavaScript across Node.js, Bun, Deno, and browsers, including modules, async orchestration, compatibility, bundling, and testing."
allowed-tools: Read Grep Glob Bash Edit Write
user-invocable: true
argument-hint: "JavaScript module, function, or pattern to analyze"
---

# JavaScript Best Practices

## Purpose

Production-grade guidance for modern JavaScript development targeting ES2024+ features across all major runtimes (Node.js 22+, Bun, Deno, and browsers). Covers module architecture, async patterns with structured cancellation, runtime-aware API selection, bundling for tree-shaking, and testing strategies that work across environments.

## When to Use

- Writing new JavaScript modules, services, or libraries.
- Migrating CommonJS codebases to ESM or dual-format packages.
- Building code that must run across Node.js, Bun, Deno, or browsers.
- Designing async pipelines with cancellation, retry, and backpressure.
- Optimizing bundle size, startup time, or runtime performance.
- Establishing testing and linting standards for a JavaScript project.

## Instructions

1. **Identify the target runtime(s) before writing any code** because Node.js, Bun, Deno, and browsers expose different global APIs, module resolution rules, and performance characteristics. Pin the minimum runtime version in `package.json` engines or `deno.json` and use it to gate feature choices.

2. **Use ESM as the default module format** because it enables static analysis, tree-shaking, and top-level await. Set `"type": "module"` in `package.json`. For libraries that must support CJS consumers, use a dual-export strategy with `"exports"` field mapping `"import"` and `"require"` conditions. Do not mix `require()` and `import` in the same module because it creates resolution ambiguity.

3. **Structure modules around single responsibilities with explicit public APIs** because barrel files that re-export everything defeat tree-shaking and increase bundle size. Export only the intended public surface from `index.js`. Keep internal helpers in unexported files. Use `package.json` `"exports"` to enforce encapsulation.

4. **Prefer native runtime APIs over third-party equivalents** because they reduce dependency surface and improve performance. Use `fetch()` (available in Node 22+, Bun, Deno, browsers), `crypto.subtle` for hashing, `structuredClone()` for deep copies, `URL` and `URLSearchParams` for URL handling. Check runtime availability with feature detection, not user-agent sniffing.

5. **Design async flows with AbortSignal for cancellation and timeout** because uncontrolled async operations leak resources and cause cascading failures. Pass `AbortSignal` through the entire call chain. Use `AbortSignal.timeout(ms)` for deadline-based cancellation. Use `AbortSignal.any()` to compose multiple cancellation sources. Always check `signal.aborted` before expensive operations in loops.

6. **Choose the right Promise combinator for the concurrency model** because incorrect choice causes either premature failure or unnecessary waiting. Use `Promise.all()` when all results are needed and any failure should abort. Use `Promise.allSettled()` when partial results are acceptable. Use `Promise.any()` for redundant sources. Use `Promise.race()` for timeout racing. Limit concurrency with semaphore patterns when fan-out could exhaust connections.

7. **Handle errors at boundaries, not everywhere** because scattered try-catch obscures control flow. Catch at HTTP handler level, CLI entry point, or queue consumer. Let errors propagate through intermediate layers. Use custom error classes with `cause` chaining (`new Error('msg', { cause })`) for root-cause tracing. Never swallow errors silently.

8. **Use iterators and generators for lazy data processing** because loading entire datasets into memory causes OOM in production. Use `for await...of` with async generators for paginated APIs. Use `ReadableStream` and `TransformStream` for byte-level processing. In Node.js, prefer `pipeline()` from `node:stream/promises` for backpressure-safe piping.

9. **Configure bundling for the deployment target** because server bundles and browser bundles have different optimization goals. Use Vite or esbuild for browser builds with code-splitting via dynamic `import()`. Use `--conditions` flags for runtime-specific export resolution. Externalize `node:*` built-ins in server bundles. Enable source maps in production for debugging without shipping unminified code.

10. **Write tests that run in the target runtime** because cross-runtime bugs hide when tests only run in Node. Use Vitest for browser and Node testing with its built-in coverage. Use `node:test` for zero-dependency Node-only testing. Use `Deno.test()` in Deno projects. Mock timers, fetch, and filesystem at the test runner level, not with global monkey-patches.

11. **Lint and format with zero-config-first tooling** because configuration sprawl causes inconsistency across contributors. Use Biome for combined linting and formatting (faster than ESLint + Prettier). If ESLint is required, use flat config (`eslint.config.js`) with `@eslint/js` recommended rules. Enable `no-unused-vars`, `no-floating-promises` (via typescript-eslint if TS is present), and `eqeqeq`.

12. **Use `structuredClone()` instead of JSON parse/stringify round-trips** because `structuredClone` handles `Date`, `RegExp`, `Map`, `Set`, `ArrayBuffer`, and circular references correctly. Use the `transfer` option for zero-copy handoff of `ArrayBuffer` to workers.

13. **Isolate side effects at module edges** because top-level side effects prevent tree-shaking, break test isolation, and make modules order-dependent. Initialize connections, register handlers, and read environment variables in explicit setup functions, not at import time.

14. **Use `using` declarations (ES2024 Explicit Resource Management) for deterministic cleanup** because manual `try/finally` is error-prone and verbose. Implement `Symbol.dispose` or `Symbol.asyncDispose` on resources that need cleanup (database connections, file handles, temp directories). Use `await using` for async cleanup in server code.

15. **Validate all external input at system boundaries** because trusting unvalidated data causes injection, type confusion, and crashes. Use schema validation (Zod, Valibot, or AJV) at API endpoints, CLI argument parsing, and configuration loading. Return structured error responses with field-level details.

16. **Profile before optimizing and optimize the right layer** because micro-benchmarks mislead when the bottleneck is I/O or architecture. Use Chrome DevTools Performance tab for browser code, `node --prof` and `clinic.js` for Node, and `Deno.bench()` for Deno. Focus on reducing allocations in hot loops and eliminating unnecessary serialization round-trips.

## Output Format

Produces JavaScript code using ESM modules, native runtime APIs, explicit async error handling with AbortSignal, and structured resource management. Includes runtime-conditional logic where cross-platform support is needed. Code uses `const`/`let` (never `var`), optional chaining, nullish coalescing, and modern syntax appropriate to the target runtime.

## References

| File | Load when |
| --- | --- |
| `references/modules-bundling.md` | ESM/CJS migration, dual-format packages, tree-shaking, or bundler configuration is needed. |
| `references/runtime-apis.md` | Choosing between Node, Bun, Deno, or browser APIs, or writing cross-runtime code. |
| `references/async-patterns.md` | Cancellation, retry, concurrency limiting, streaming, or generator patterns need detail. |
| `references/testing.md` | Setting up test runners, mocking strategies, or cross-runtime test execution. |
| `references/performance.md` | Profiling, memory optimization, startup time, or bundle size reduction. |

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
