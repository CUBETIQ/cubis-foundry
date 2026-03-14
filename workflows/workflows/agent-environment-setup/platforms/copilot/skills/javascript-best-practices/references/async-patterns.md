# Async Patterns Reference

## AbortController and AbortSignal

### Basic Cancellation

```javascript
const controller = new AbortController();
const { signal } = controller;

// Cancel after 5 seconds
const timeout = setTimeout(() => controller.abort(), 5_000);

try {
  const response = await fetch('/api/data', { signal });
  clearTimeout(timeout);
  return await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
    return null;
  }
  throw error;
}
```

### AbortSignal.timeout (ES2024)

```javascript
// Built-in timeout signal -- no manual AbortController needed
const response = await fetch('/api/data', {
  signal: AbortSignal.timeout(5_000),
});
```

### AbortSignal.any -- Composing Multiple Signals

```javascript
// Cancel on either user action OR timeout
const userController = new AbortController();

const signal = AbortSignal.any([
  userController.signal,           // User clicks "Cancel"
  AbortSignal.timeout(30_000),     // 30-second deadline
]);

try {
  const data = await fetchLargeDataset('/api/export', { signal });
} catch (error) {
  if (error.name === 'AbortError') {
    // Determine which signal triggered
    console.log('Operation cancelled or timed out');
  }
}
```

### Propagating Signals Through Call Chains

```javascript
// Thread the signal through every async operation
const fetchUserWithPosts = async (userId, { signal } = {}) => {
  const user = await fetchJson(`/users/${userId}`, { signal });

  // Check signal before starting the next operation
  signal?.throwIfAborted();

  const posts = await fetchJson(`/users/${userId}/posts`, { signal });
  return { user, posts };
};
```

## Retry with Exponential Backoff

```javascript
const retry = async (fn, { maxAttempts = 3, baseDelay = 1_000, signal } = {}) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn({ signal });
    } catch (error) {
      // Never retry abort errors
      if (error.name === 'AbortError') throw error;

      // Don't retry on the last attempt
      if (attempt === maxAttempts) throw error;

      // Exponential backoff with jitter
      const delay = baseDelay * 2 ** (attempt - 1) + Math.random() * 500;
      await abortableDelay(delay, signal);
    }
  }
};

// Delay that can be cancelled
const abortableDelay = (ms, signal) =>
  new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
```

## Concurrency Limiting

### Semaphore Pattern

```javascript
class Semaphore {
  #permits;
  #queue = [];

  constructor(permits) {
    this.#permits = permits;
  }

  async acquire() {
    if (this.#permits > 0) {
      this.#permits--;
      return;
    }
    await new Promise((resolve) => this.#queue.push(resolve));
  }

  release() {
    const next = this.#queue.shift();
    if (next) {
      next();
    } else {
      this.#permits++;
    }
  }

  async run(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// Usage: process 100 URLs with max 5 concurrent requests
const semaphore = new Semaphore(5);
const results = await Promise.all(
  urls.map((url) => semaphore.run(() => fetch(url)))
);
```

### Pool Pattern with Results

```javascript
const pool = async (tasks, concurrency) => {
  const results = new Array(tasks.length);
  let index = 0;

  const worker = async () => {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  };

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
};
```

## Async Generators for Streaming Data

### Paginated API Consumer

```javascript
async function* fetchAllPages(baseUrl, { signal } = {}) {
  let cursor = undefined;

  while (true) {
    signal?.throwIfAborted();

    const url = new URL(baseUrl);
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const page = await response.json();
    yield* page.items;  // Yield individual items, not pages

    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
}

// Consumer processes one item at a time -- constant memory
for await (const item of fetchAllPages('https://api.example.com/items', { signal })) {
  await processItem(item);
}
```

### Transform Pipeline with Generators

```javascript
async function* map(source, fn) {
  for await (const item of source) {
    yield fn(item);
  }
}

async function* filter(source, predicate) {
  for await (const item of source) {
    if (predicate(item)) yield item;
  }
}

async function* batch(source, size) {
  let chunk = [];
  for await (const item of source) {
    chunk.push(item);
    if (chunk.length >= size) {
      yield chunk;
      chunk = [];
    }
  }
  if (chunk.length > 0) yield chunk;
}

// Compose a pipeline
const items = fetchAllPages(url, { signal });
const active = filter(items, (item) => item.status === 'active');
const transformed = map(active, (item) => ({ ...item, processedAt: Date.now() }));
const batches = batch(transformed, 50);

for await (const chunk of batches) {
  await bulkInsert(chunk);
}
```

## Explicit Resource Management (ES2024)

```javascript
class DatabaseConnection {
  #connection;

  static async open(url) {
    const conn = new DatabaseConnection();
    conn.#connection = await connect(url);
    return conn;
  }

  async query(sql, params) {
    return this.#connection.query(sql, params);
  }

  // Async dispose -- called automatically by `await using`
  async [Symbol.asyncDispose]() {
    await this.#connection.close();
  }
}

// Connection is automatically closed when scope exits
async function getUser(id) {
  await using db = await DatabaseConnection.open(DATABASE_URL);
  return db.query('SELECT * FROM users WHERE id = $1', [id]);
  // db[Symbol.asyncDispose]() called automatically here
}
```

## Promise Combinator Selection Guide

| Combinator | Behavior | Use When |
| --- | --- | --- |
| `Promise.all(ps)` | Resolves when ALL resolve; rejects on FIRST rejection | All results needed, fail-fast on any error |
| `Promise.allSettled(ps)` | Resolves when ALL settle (resolve or reject) | Need all outcomes, partial failure acceptable |
| `Promise.race(ps)` | Settles with FIRST settled promise | Timeout racing, cache vs network |
| `Promise.any(ps)` | Resolves with FIRST fulfilled; rejects if ALL reject | Redundant sources, fastest mirror |

## Event Loop Yielding for Long Tasks

```javascript
// Yield to the event loop in CPU-intensive loops
const processLargeArray = async (items, batchSize = 1_000) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...batch.map(transform));

    // Yield to prevent blocking the event loop
    if (i + batchSize < items.length) {
      await scheduler?.yield?.() ?? new Promise((r) => setTimeout(r, 0));
    }
  }
  return results;
};
```
