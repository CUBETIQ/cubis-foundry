# Runtime APIs Reference

## Cross-Runtime API Availability

APIs that work identically across Node.js 22+, Bun, Deno, and modern browsers:

| API | Node 22+ | Bun | Deno | Browser |
| --- | --- | --- | --- | --- |
| `fetch()` | Yes | Yes | Yes | Yes |
| `URL` / `URLSearchParams` | Yes | Yes | Yes | Yes |
| `crypto.subtle` | Yes | Yes | Yes | Yes |
| `structuredClone()` | Yes | Yes | Yes | Yes |
| `AbortController` / `AbortSignal` | Yes | Yes | Yes | Yes |
| `TextEncoder` / `TextDecoder` | Yes | Yes | Yes | Yes |
| `ReadableStream` / `WritableStream` | Yes | Yes | Yes | Yes |
| `setTimeout` / `setInterval` | Yes | Yes | Yes | Yes |
| `queueMicrotask()` | Yes | Yes | Yes | Yes |
| `performance.now()` | Yes | Yes | Yes | Yes |
| `Blob` | Yes | Yes | Yes | Yes |
| `FormData` | Yes | Yes | Yes | Yes |
| `Headers` / `Request` / `Response` | Yes | Yes | Yes | Yes |
| `navigator.userAgent` | No | No | No | Yes |
| `document` / `window` | No | No | No | Yes |

## Runtime Detection

```javascript
// Feature detection (preferred over runtime sniffing)
const hasFileSystem = typeof globalThis.process?.versions?.node !== 'undefined'
  || typeof Deno !== 'undefined';

// Runtime identification (when you need it)
const runtime = (() => {
  if (typeof Deno !== 'undefined') return 'deno';
  if (typeof Bun !== 'undefined') return 'bun';
  if (typeof process !== 'undefined' && process.versions?.node) return 'node';
  if (typeof window !== 'undefined') return 'browser';
  return 'unknown';
})();
```

## Node.js-Specific APIs

```javascript
// Always use the node: prefix for built-in modules (Node 16+)
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { EventEmitter } from 'node:events';
import { env, exit, cwd } from 'node:process';

// Node.js test runner (zero dependencies)
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
```

## Deno-Specific APIs

```javascript
// Deno uses explicit permissions and its own API namespace
const data = await Deno.readTextFile('./config.json');
await Deno.writeTextFile('./output.txt', 'hello');

// Deno.serve for HTTP servers (faster than http.createServer)
Deno.serve({ port: 8080 }, (req) => {
  return new Response('Hello', { status: 200 });
});

// Deno permissions (run with --allow-net, --allow-read, etc.)
const status = await Deno.permissions.query({ name: 'net', host: 'api.example.com' });

// Deno testing
Deno.test('example test', async () => {
  const result = await fetchData();
  assertEquals(result.status, 200);
});

// Deno benchmarking
Deno.bench('json parse', () => {
  JSON.parse('{"key": "value"}');
});
```

## Bun-Specific APIs

```javascript
// Bun provides fast built-in APIs
const file = Bun.file('./data.json');
const content = await file.text();
await Bun.write('./output.txt', 'hello');

// Bun.serve for HTTP (similar to Deno.serve)
Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response('Hello from Bun');
  },
});

// Bun's built-in SQLite
import { Database } from 'bun:sqlite';
const db = new Database('app.db');
const rows = db.query('SELECT * FROM users WHERE id = ?').all(userId);

// Bun test runner
import { describe, it, expect } from 'bun:test';
```

## Writing Cross-Runtime Code

### File System Abstraction

```javascript
const readText = async (path) => {
  if (typeof Deno !== 'undefined') {
    return Deno.readTextFile(path);
  }
  if (typeof Bun !== 'undefined') {
    return Bun.file(path).text();
  }
  const { readFile } = await import('node:fs/promises');
  return readFile(path, 'utf-8');
};

const writeText = async (path, content) => {
  if (typeof Deno !== 'undefined') {
    return Deno.writeTextFile(path, content);
  }
  if (typeof Bun !== 'undefined') {
    return Bun.write(path, content);
  }
  const { writeFile } = await import('node:fs/promises');
  return writeFile(path, content, 'utf-8');
};
```

### Environment Variables

```javascript
// Cross-runtime environment access
const getEnv = (key) => {
  if (typeof Deno !== 'undefined') return Deno.env.get(key);
  if (typeof process !== 'undefined') return process.env[key];
  return undefined;
};
```

### HTTP Server Abstraction

```javascript
// All three server runtimes support the Web Standard Request/Response pattern
const handler = async (req) => {
  const url = new URL(req.url);
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'content-type': 'application/json' },
    });
  }
  return new Response('Not Found', { status: 404 });
};

// Each runtime has its own serve API, but the handler is portable
// Node: import { serve } from '@hono/node-server'; serve({ fetch: handler });
// Deno:  Deno.serve(handler);
// Bun:   Bun.serve({ fetch: handler });
```

## Web Crypto (Cross-Runtime)

```javascript
// crypto.subtle works everywhere
const hashText = async (text) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

// Generate secure random values
const token = crypto.randomUUID();
const bytes = crypto.getRandomValues(new Uint8Array(32));
```

## Structured Clone (Cross-Runtime)

```javascript
// Deep copy with support for Date, RegExp, Map, Set, ArrayBuffer, circular refs
const original = { date: new Date(), map: new Map([['key', 'value']]) };
const copy = structuredClone(original);

// Transfer ownership of ArrayBuffer (zero-copy)
const buffer = new ArrayBuffer(1024);
const transferred = structuredClone(buffer, { transfer: [buffer] });
// buffer.byteLength === 0 (ownership transferred)
```
