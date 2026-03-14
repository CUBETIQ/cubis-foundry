# JavaScript Best Practices - Eval Assertions

## Eval 1: ESM Module Migration

This eval tests the skill's ability to guide a CommonJS-to-ESM migration for a dual-format library.

### Assertions

1. **Sets "type": "module" in package.json** -- The migration must establish ESM as the default module format. Without this, `.js` files are treated as CJS by Node.js, which defeats the purpose of the migration.

2. **Configures dual-format exports** -- The `"exports"` field in `package.json` must map both `"import"` (for ESM consumers) and `"require"` (for CJS consumers) conditions. This is the standard mechanism for libraries that need to support both ecosystems during the transition period.

3. **Replaces require() with import and handles __dirname** -- The actual code changes must convert `require()` to `import` statements and replace `__dirname`/`__filename` with `import.meta.url` + `URL` or `path.dirname(fileURLToPath(import.meta.url))`. These are the most common migration stumbling blocks.

4. **Addresses barrel exports and tree-shaking** -- A production-grade migration considers the public API surface. Barrel files that blindly re-export everything prevent bundlers from tree-shaking unused code. The guidance should recommend explicit exports.

5. **Includes testing for both formats** -- A dual-format package that only tests one format will ship broken code. The response should mention testing or verifying that both CJS `require()` and ESM `import` resolve correctly against the published package.

## Eval 2: Cross-Runtime Data Processing

This eval tests the skill's ability to design a concurrent, cancellable data pipeline that works across Node.js and Deno.

### Assertions

1. **Uses AbortSignal for cancellation** -- Structured cancellation via `AbortController`/`AbortSignal` is the cross-runtime standard. The signal must be threaded through the entire fetch chain so that all in-flight requests are cancelled when the user aborts.

2. **Implements retry with backoff** -- Transient failures (HTTP 429, 503, network errors) should be retried with exponential backoff. The retry logic must check the abort signal before retrying, so cancellation is not delayed by retry waits.

3. **Limits concurrency to 5** -- Unbounded `Promise.all()` over hundreds of URLs will exhaust connections and memory. A semaphore, queue, or pool pattern must cap active requests at 5 while keeping the pipeline flowing.

4. **Handles runtime-specific file I/O** -- File writing differs between Node.js (`node:fs`) and Deno (`Deno.writeFile`). The response should use runtime detection, conditional imports, or an abstraction layer to handle this difference.

5. **Uses lazy data processing** -- Processing paginated data should use async generators, `for await...of`, or `ReadableStream` rather than collecting all pages into an array first. This prevents OOM on large datasets.
