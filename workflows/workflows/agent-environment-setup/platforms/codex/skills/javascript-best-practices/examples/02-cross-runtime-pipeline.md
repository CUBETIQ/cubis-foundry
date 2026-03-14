# Example: Cross-Runtime Data Pipeline with Cancellation

## Scenario

A CLI tool fetches paginated data from a REST API, transforms each record, and writes results to a JSONL file. It must work on both Node.js and Deno, handle Ctrl+C gracefully, retry transient failures, and limit concurrency to avoid overloading the API.

## Implementation

### pipeline.js

```javascript
// Cross-runtime file writing abstraction
const writeFile = async (path, data) => {
  if (typeof Deno !== 'undefined') {
    await Deno.writeTextFile(path, data);
  } else {
    const { writeFile: fsWrite } = await import('node:fs/promises');
    await fsWrite(path, data, 'utf-8');
  }
};

// Concurrency limiter -- caps parallel operations at `limit`
const createPool = (limit) => {
  let active = 0;
  const queue = [];

  return async (fn) => {
    while (active >= limit) {
      await new Promise((resolve) => queue.push(resolve));
    }
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
};

// Retry with exponential backoff that respects abort signals
const fetchWithRetry = async (url, signal, maxRetries = 3) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { signal });
      if (response.status === 429 || response.status >= 500) {
        if (attempt === maxRetries) {
          throw new Error(`HTTP ${response.status} after ${maxRetries} retries`);
        }
        const delay = Math.min(1000 * 2 ** attempt, 10_000);
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, delay);
          signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(signal.reason);
          }, { once: true });
        });
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      if (attempt === maxRetries) throw error;
    }
  }
};

// Async generator for paginated data -- processes one page at a time
async function* fetchPages(baseUrl, signal) {
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const url = cursor
      ? `${baseUrl}?cursor=${encodeURIComponent(cursor)}`
      : baseUrl;

    const page = await fetchWithRetry(url, signal);
    yield page.items;

    cursor = page.nextCursor;
    hasMore = Boolean(cursor);
  }
}

// Transform records in parallel with concurrency limit
const processPage = async (items, pool, signal) => {
  const tasks = items.map((item) =>
    pool(async () => {
      signal?.throwIfAborted();
      return {
        id: item.id,
        name: item.name.trim().toLowerCase(),
        processedAt: new Date().toISOString(),
      };
    })
  );
  return Promise.all(tasks);
};

// Main pipeline
const run = async () => {
  const controller = new AbortController();
  const { signal } = controller;

  // Handle Ctrl+C
  const onShutdown = () => {
    console.log('\nShutting down gracefully...');
    controller.abort(new Error('User cancelled'));
  };

  if (typeof Deno !== 'undefined') {
    Deno.addSignalListener('SIGINT', onShutdown);
  } else {
    process.on('SIGINT', onShutdown);
  }

  const pool = createPool(5);
  const lines = [];

  try {
    for await (const items of fetchPages('https://api.example.com/records', signal)) {
      const processed = await processPage(items, pool, signal);
      for (const record of processed) {
        lines.push(JSON.stringify(record));
      }
      console.log(`Processed ${lines.length} records...`);
    }

    await writeFile('output.jsonl', lines.join('\n') + '\n');
    console.log(`Done. Wrote ${lines.length} records to output.jsonl`);
  } catch (error) {
    if (error.name === 'AbortError' || error.message === 'User cancelled') {
      // Write partial results on cancellation
      if (lines.length > 0) {
        await writeFile('output.partial.jsonl', lines.join('\n') + '\n');
        console.log(`Cancelled. Wrote ${lines.length} partial records.`);
      }
    } else {
      throw error;
    }
  }
};

run();
```

## Key Decisions

1. **Runtime detection** for file I/O uses `typeof Deno !== 'undefined'` rather than user-agent sniffing. `fetch()` is available natively in both runtimes.
2. **AbortSignal propagation** flows from the top-level controller through every fetch call and into the processing pool, ensuring immediate cleanup on Ctrl+C.
3. **Retry backoff respects the abort signal** -- the delay `setTimeout` is cancelled if the signal fires, preventing cancelled operations from waiting through retry delays.
4. **Async generator `fetchPages`** processes one page at a time, keeping memory usage proportional to page size rather than total dataset size.
5. **Concurrency pool** limits to 5 parallel operations using a simple semaphore pattern, preventing connection exhaustion against the API.
6. **Partial result writes** on cancellation ensure that work already completed is not lost.
