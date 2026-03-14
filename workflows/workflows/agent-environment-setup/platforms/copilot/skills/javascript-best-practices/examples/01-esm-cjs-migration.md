# Example: Migrating a CommonJS Library to Dual-Format ESM/CJS

## Scenario

A utility library `@acme/http-utils` is published as CommonJS. Consumers are migrating to ESM, but some still use CJS. The library needs to ship both formats from a single source.

## Before (CommonJS only)

```javascript
// package.json
{
  "name": "@acme/http-utils",
  "main": "src/index.js"
}

// src/index.js
const { URL } = require('url');
const fetch = require('node-fetch');

const buildUrl = (base, path, params) => {
  const url = new URL(path, base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

module.exports = { buildUrl, fetchJson };
```

## After (Dual ESM/CJS)

### package.json

```json
{
  "name": "@acme/http-utils",
  "version": "2.0.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "engines": { "node": ">=22.0.0" },
  "scripts": {
    "build": "tsup src/index.js --format esm,cjs --clean",
    "test": "vitest run",
    "test:cjs": "node --eval \"const { buildUrl } = require('./dist/index.cjs'); console.log(buildUrl('https://api.example.com', '/users', { page: '1' }))\""
  }
}
```

### src/index.js (ESM source)

```javascript
// No more require() -- use native fetch and URL (available in Node 22+)
// No more node-fetch dependency

export const buildUrl = (base, path, params = {}) => {
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
};

export const fetchJson = async (url, { signal } = {}) => {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`, {
      cause: { status: response.status, url },
    });
  }
  return response.json();
};
```

## Key Decisions

1. **`"type": "module"`** makes all `.js` files ESM by default. CJS output uses `.cjs` extension.
2. **`"exports"` field** with `import` and `require` conditions lets Node resolve the right format automatically.
3. **Native `fetch` and `URL`** eliminate the `node-fetch` and `url` dependencies (Node 22+ has both globally).
4. **`{ signal }` parameter** on `fetchJson` enables cancellation via `AbortController`.
5. **`Error` with `cause`** preserves the original error context for debugging.
6. **tsup** handles the dual-format build from a single ESM source, generating both `.js` (ESM) and `.cjs` (CJS) outputs.
7. **`test:cjs` script** verifies the CJS output works, catching dual-format packaging bugs before publish.
