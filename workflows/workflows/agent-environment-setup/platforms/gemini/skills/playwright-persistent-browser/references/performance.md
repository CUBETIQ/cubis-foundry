# Performance

Load this reference when optimizing memory usage, managing resource cleanup, or monitoring browser health in long-running sessions.

## Memory Budget

Chromium's memory usage in Playwright depends on the number of contexts, pages, and DOM complexity.

### Baseline measurements

| Component | Approximate memory | Notes |
| --- | --- | --- |
| Browser process (empty) | 80-120 MB | Chromium renderer + browser process |
| Empty browser context | 20-30 MB | Renderer process overhead |
| Empty page | 15-25 MB | DOM, JS engine, layout engine |
| Typical web page | 50-200 MB | Depends on DOM size, images, JS bundles |
| Complex SPA page | 200-500 MB | React/Angular/Vue with large state trees |

### Budget planning

For a CI machine with 4 GB RAM:
- OS and tooling overhead: 1 GB
- Available for Playwright: 3 GB
- With 200 MB per page: max 15 concurrent pages
- With safety margin (2x): target 7-8 concurrent pages

For long-running sessions on 8 GB machines:
- Available: 6 GB
- Reserve 50% for growth over time: 3 GB effective
- With 200 MB per page: target 10-15 pages maximum

## Page Lifecycle Management

### Close pages when done

The simplest and most effective memory optimization:

```typescript
const page = await context.newPage();
await page.goto('https://app.com/report');
const data = await page.locator('[data-testid="report"]').textContent();
await page.close(); // Release 50-200 MB
```

### Page pooling

Reuse a fixed set of pages instead of creating and closing:

```typescript
class PagePool {
  private available: Page[] = [];
  private inUse: Set<Page> = new Set();
  private context: BrowserContext;
  private maxPages: number;

  constructor(context: BrowserContext, maxPages: number = 5) {
    this.context = context;
    this.maxPages = maxPages;
  }

  async acquire(): Promise<Page> {
    if (this.available.length > 0) {
      const page = this.available.pop()!;
      this.inUse.add(page);
      // Navigate to blank to clear previous page state
      await page.goto('about:blank');
      return page;
    }

    if (this.inUse.size < this.maxPages) {
      const page = await this.context.newPage();
      this.inUse.add(page);
      return page;
    }

    throw new Error(`Page pool exhausted (max: ${this.maxPages})`);
  }

  async release(page: Page): Promise<void> {
    this.inUse.delete(page);
    // Clear page state before returning to pool
    await page.goto('about:blank');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    this.available.push(page);
  }

  async drain(): Promise<void> {
    for (const page of [...this.available, ...this.inUse]) {
      await page.close();
    }
    this.available = [];
    this.inUse.clear();
  }
}
```

## Cache Management

### Clearing HTTP cache

```typescript
const client = await context.newCDPSession(page);
await client.send('Network.clearBrowserCache');
await client.detach();
```

### Clearing service workers

Service workers can accumulate and consume memory:

```typescript
await page.evaluate(async () => {
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    await reg.unregister();
  }
});
```

### Clearing IndexedDB

```typescript
await page.evaluate(async () => {
  const databases = await indexedDB.databases();
  for (const db of databases) {
    if (db.name) indexedDB.deleteDatabase(db.name);
  }
});
```

## CPU Optimization

### Disable unnecessary features

```typescript
const browser = await chromium.launch({
  args: [
    '--disable-gpu',                    // No GPU compositing
    '--disable-dev-shm-usage',          // Use /tmp instead of /dev/shm
    '--disable-background-networking',  // No background requests
    '--disable-extensions',             // No extensions
    '--disable-sync',                   // No browser sync
    '--disable-translate',              // No translation prompts
    '--no-first-run',                   // Skip first-run experience
    '--disable-component-update',       // No component updates
  ],
});
```

### Reduce rendering overhead

For headless automation that does not need pixel-perfect rendering:

```typescript
const browser = await chromium.launch({
  args: [
    '--disable-software-rasterizer',
    '--disable-accelerated-2d-canvas',
    '--disable-webgl',
  ],
});
```

### Throttle network for slow endpoints

Prevent tests from hammering slow APIs:

```typescript
const client = await page.context().newCDPSession(page);
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: 1.5 * 1024 * 1024, // 1.5 MB/s
  uploadThroughput: 750 * 1024,           // 750 KB/s
  latency: 40,                            // 40ms RTT
});
```

## Monitoring

### Memory monitoring with alerting

```typescript
interface HealthMetrics {
  heapUsedMB: number;
  heapTotalMB: number;
  pageCount: number;
  timestamp: string;
}

async function collectMetrics(
  context: BrowserContext,
  pages: Page[]
): Promise<HealthMetrics> {
  let totalUsed = 0;
  let totalCapacity = 0;

  for (const page of pages) {
    try {
      const client = await context.newCDPSession(page);
      const heap = await client.send('Runtime.getHeapUsage');
      totalUsed += heap.usedSize;
      totalCapacity += heap.totalSize;
      await client.detach();
    } catch {
      // Page may have been closed
    }
  }

  return {
    heapUsedMB: totalUsed / 1024 / 1024,
    heapTotalMB: totalCapacity / 1024 / 1024,
    pageCount: pages.length,
    timestamp: new Date().toISOString(),
  };
}

function checkHealth(metrics: HealthMetrics, budgetMB: number): boolean {
  if (metrics.heapUsedMB > budgetMB) {
    console.error(
      `MEMORY ALERT: ${metrics.heapUsedMB.toFixed(0)} MB used exceeds ${budgetMB} MB budget`
    );
    return false;
  }
  return true;
}
```

### Process-level monitoring

Monitor the browser process itself:

```typescript
import { execSync } from 'child_process';

function getBrowserProcessMemory(pid: number): number {
  try {
    // macOS / Linux
    const output = execSync(`ps -o rss= -p ${pid}`).toString().trim();
    return parseInt(output, 10) / 1024; // Convert KB to MB
  } catch {
    return -1;
  }
}

// Get browser PID
const browser = await chromium.launch();
const pid = browser.process()?.pid;
if (pid) {
  const memMB = getBrowserProcessMemory(pid);
  console.log(`Browser process: ${memMB.toFixed(0)} MB`);
}
```

## Long-Running Session Best Practices

1. **Set a memory budget** before starting. Monitor against it continuously.
2. **Close pages aggressively**. Every open page costs 50-200 MB.
3. **Rotate traces** every 15 minutes. Continuous tracing produces multi-GB files.
4. **Clear caches periodically** (HTTP cache, service workers, IndexedDB).
5. **Navigate to about:blank** between tasks on reused pages to release DOM memory.
6. **Restart the browser** after a configurable number of hours (e.g., every 4 hours) as a safety valve against slow leaks that you cannot identify.
7. **Log memory metrics** at regular intervals. When you investigate a failure, the memory timeline tells you whether it was a leak or a spike.
8. **Limit concurrent pages** with a page pool. Unbounded page creation is the fastest path to OOM.

## Emergency Recovery

When memory exceeds the budget, take corrective action:

```typescript
async function emergencyCleanup(context: BrowserContext, pages: Page[]) {
  console.warn('Emergency cleanup triggered — closing non-essential pages');

  // Close all pages except the first (primary) one
  for (let i = 1; i < pages.length; i++) {
    try { await pages[i].close(); } catch {}
  }

  // Clear caches on the remaining page
  const primary = pages[0];
  const client = await context.newCDPSession(primary);
  await client.send('Network.clearBrowserCache');
  await client.detach();

  // Force GC
  await primary.evaluate(() => {
    if (typeof (globalThis as any).gc === 'function') {
      (globalThis as any).gc();
    }
  });
}
```
