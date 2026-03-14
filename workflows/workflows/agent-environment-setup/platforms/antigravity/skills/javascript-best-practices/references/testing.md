# Testing Reference

## Test Runner Selection

| Runner | Best For | Key Feature |
| --- | --- | --- |
| **Vitest** | Most projects, browser + Node | Vite-native, ESM-first, built-in coverage, UI mode |
| **node:test** | Node-only, zero dependencies | Ships with Node, no install, fast startup |
| **Deno.test** | Deno projects | Built into runtime, permissions-aware |
| **Bun test** | Bun projects | Fastest startup, Jest-compatible API |

## Vitest Setup and Configuration

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,           // Explicit imports preferred
    environment: 'node',      // or 'jsdom', 'happy-dom'
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['**/*.test.js', '**/test/**'],
    },
    testTimeout: 10_000,
    hookTimeout: 15_000,
  },
});
```

### Writing Tests with Vitest

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchUserProfile } from './user-service.js';

describe('fetchUserProfile', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns user data on success', async () => {
    const mockResponse = { id: '1', name: 'Alice' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    );

    const user = await fetchUserProfile('1');

    expect(user).toEqual({ id: '1', name: 'Alice' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/1'),
      expect.any(Object)
    );
  });

  it('throws on HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 })
    );

    await expect(fetchUserProfile('999')).rejects.toThrow('HTTP 404');
  });

  it('respects abort signal', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      fetchUserProfile('1', { signal: controller.signal })
    ).rejects.toThrow('aborted');
  });

  it('retries on transient failure', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: '1' }), { status: 200 })
      );

    // Advance timers through retry delays
    const promise = fetchUserProfile('1');
    await vi.advanceTimersByTimeAsync(2_000);
    await vi.advanceTimersByTimeAsync(4_000);

    const result = await promise;
    expect(result.id).toBe('1');
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
```

## Node.js Built-in Test Runner

```javascript
import { describe, it, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildUrl } from './url-utils.js';

describe('buildUrl', () => {
  it('combines base, path, and params', () => {
    const result = buildUrl('https://api.example.com', '/users', { page: '2' });
    assert.equal(result, 'https://api.example.com/users?page=2');
  });

  it('handles empty params', () => {
    const result = buildUrl('https://api.example.com', '/health');
    assert.equal(result, 'https://api.example.com/health');
  });

  it('encodes special characters', () => {
    const result = buildUrl('https://api.example.com', '/search', {
      q: 'hello world',
    });
    assert.match(result, /q=hello\+world|q=hello%20world/);
  });
});

// Run: node --test src/**/*.test.js
// Coverage: node --test --experimental-test-coverage src/**/*.test.js
```

## Mocking Strategies

### Mock fetch (Vitest)

```javascript
// Global fetch mock with type-safe responses
const mockFetch = (responses) => {
  let callIndex = 0;
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    const resp = responses[callIndex++];
    if (resp instanceof Error) throw resp;
    return new Response(
      JSON.stringify(resp.body),
      { status: resp.status ?? 200, headers: resp.headers }
    );
  });
};

// Usage
mockFetch([
  { body: { users: [] }, status: 200 },
  { body: { error: 'rate limited' }, status: 429 },
]);
```

### Mock Timers

```javascript
// Vitest
vi.useFakeTimers();
const promise = retryWithBackoff(fn);
await vi.advanceTimersByTimeAsync(5_000);
const result = await promise;
vi.useRealTimers();

// Node.js test runner
import { mock } from 'node:test';
mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
mock.timers.tick(5_000);
mock.timers.reset();
```

### Mock File System

```javascript
// Use a virtual filesystem instead of mocking fs
import { vol, fs } from 'memfs';

beforeEach(() => {
  vol.fromJSON({
    '/app/config.json': JSON.stringify({ port: 3000 }),
    '/app/data/users.csv': 'id,name\n1,Alice',
  });
});

// Inject the mock fs into your module
const config = await loadConfig({ fs });
```

## Testing Async Generators

```javascript
import { describe, it, expect } from 'vitest';

describe('fetchAllPages', () => {
  it('yields items from multiple pages', async () => {
    const items = [];
    for await (const item of fetchAllPages(mockUrl)) {
      items.push(item);
    }
    expect(items).toHaveLength(30);
    expect(items[0]).toHaveProperty('id');
  });

  it('stops on cancellation', async () => {
    const controller = new AbortController();
    const items = [];

    for await (const item of fetchAllPages(mockUrl, { signal: controller.signal })) {
      items.push(item);
      if (items.length >= 5) controller.abort();
    }
    // Should not have fetched all pages
    expect(items.length).toBeLessThanOrEqual(10); // One page max
  });
});
```

## Snapshot Testing

```javascript
import { expect, it } from 'vitest';

it('renders the config correctly', () => {
  const config = generateConfig({ env: 'production', region: 'us-east-1' });
  expect(config).toMatchSnapshot();
  // First run: creates .snap file
  // Subsequent runs: compares against snapshot
  // Update: vitest --update
});

// Inline snapshots (stored in the test file)
it('formats error message', () => {
  const msg = formatError(new Error('timeout'), '/api/users');
  expect(msg).toMatchInlineSnapshot(`"Request to /api/users failed: timeout"`);
});
```

## Cross-Runtime Test Execution

```json
{
  "scripts": {
    "test": "vitest run",
    "test:node": "node --test src/**/*.test.js",
    "test:deno": "deno test src/",
    "test:bun": "bun test",
    "test:all": "npm run test && npm run test:deno"
  }
}
```

Keep test utilities in a shared `test-utils.js` file and avoid runtime-specific test APIs in the utilities themselves.
