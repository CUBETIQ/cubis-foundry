# Debugging

Load this reference when debugging long-running sessions, diagnosing memory leaks, or investigating session corruption.

## Console Log Forwarding

In persistent sessions, browser console output is your primary debugging channel. Forward it to your application logs.

```typescript
page.on('console', (msg) => {
  const type = msg.type();
  const text = msg.text();
  const location = msg.location();

  if (type === 'error') {
    console.error(`[Browser Error] ${text} at ${location.url}:${location.lineNumber}`);
  } else if (type === 'warning') {
    console.warn(`[Browser Warn] ${text}`);
  } else {
    console.log(`[Browser] ${text}`);
  }
});

page.on('pageerror', (error) => {
  console.error(`[Uncaught Exception] ${error.message}\n${error.stack}`);
});
```

## Request Logging

Track all network activity for debugging timing and authentication issues:

```typescript
function attachRequestLogger(context: BrowserContext, verbose: boolean = false) {
  context.on('request', (request) => {
    if (verbose || request.url().includes('/api/')) {
      console.log(`→ ${request.method()} ${request.url()}`);
    }
  });

  context.on('response', (response) => {
    const status = response.status();
    if (verbose || status >= 400 || response.url().includes('/api/')) {
      console.log(`← ${status} ${response.url()}`);
    }
  });

  context.on('requestfailed', (request) => {
    console.error(`✗ ${request.method()} ${request.url()} — ${request.failure()?.errorText}`);
  });
}
```

## Screenshot on Error

Capture the page state when an error occurs:

```typescript
async function withScreenshotOnError<T>(
  page: Page,
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const timestamp = Date.now();
    const screenshotPath = `./debug/error-${name}-${timestamp}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`Screenshot saved: ${screenshotPath}`);

    // Also save the page HTML for inspection
    const htmlPath = `./debug/error-${name}-${timestamp}.html`;
    const html = await page.content();
    fs.writeFileSync(htmlPath, html);
    console.error(`HTML saved: ${htmlPath}`);

    throw error;
  }
}

// Usage
await withScreenshotOnError(page, 'checkout-submit', async () => {
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForURL('**/confirmation');
});
```

## Trace Recording

Playwright traces capture DOM snapshots, network requests, console logs, and actions in a single file.

### Recording a trace

```typescript
// Start trace before the operation
await context.tracing.start({
  screenshots: true,
  snapshots: true,
  sources: true,
});

// ... perform operations ...

// Stop and save
await context.tracing.stop({ path: 'trace.zip' });
```

### Viewing a trace

```bash
npx playwright show-trace trace.zip
```

### Continuous tracing for long sessions

For long-running sessions, use chunks to avoid huge trace files:

```typescript
let traceChunk = 0;

async function rotateTrace(context: BrowserContext) {
  if (traceChunk > 0) {
    await context.tracing.stop({
      path: `traces/chunk-${traceChunk}.zip`,
    });
  }
  traceChunk++;
  await context.tracing.start({
    screenshots: true,
    snapshots: true,
  });
}

// Rotate every 15 minutes
setInterval(() => rotateTrace(context), 15 * 60 * 1000);
```

## Memory Leak Detection

Long-running browser sessions leak memory. Detect and diagnose leaks early.

### Monitoring heap usage

```typescript
async function getHeapStats(page: Page) {
  const client = await page.context().newCDPSession(page);
  const heap = await client.send('Runtime.getHeapUsage');
  await client.detach();
  return {
    usedMB: (heap.usedSize / 1024 / 1024).toFixed(1),
    totalMB: (heap.totalSize / 1024 / 1024).toFixed(1),
  };
}

// Log periodically
setInterval(async () => {
  const stats = await getHeapStats(page);
  console.log(`[Heap] Used: ${stats.usedMB} MB / Total: ${stats.totalMB} MB`);
}, 60_000);
```

### Common leak sources

| Source | Symptom | Fix |
| --- | --- | --- |
| Unclosed pages | Memory grows with each navigation | Close pages when done |
| Event listeners | Memory grows, GC does not reclaim | Remove listeners on cleanup |
| Large DOM | Page memory grows over time | Navigate away to release DOM |
| Detached DOM nodes | Nodes referenced in JS but removed from DOM | Nullify references |
| Interval/Timeout references | Callbacks hold closures | Clear intervals on page close |

### Forcing garbage collection

Launch Chromium with the `--js-flags="--expose-gc"` flag:

```typescript
const browser = await chromium.launch({
  args: ['--js-flags=--expose-gc'],
});

// Force GC in a page
await page.evaluate(() => {
  if (typeof (globalThis as any).gc === 'function') {
    (globalThis as any).gc();
  }
});
```

## Session Corruption Diagnosis

When a restored session does not behave as expected:

### Step 1: Inspect the state file

```bash
# Check cookies
cat state.json | jq '.cookies[] | {name, domain, expires, httpOnly}'

# Check localStorage
cat state.json | jq '.origins[] | {origin, localStorage: (.localStorage | length)}'
```

### Step 2: Compare with a fresh session

```typescript
// After fresh login, save state
await context.storageState({ path: 'fresh-state.json' });

// Compare cookies
const fresh = JSON.parse(fs.readFileSync('fresh-state.json', 'utf-8'));
const restored = JSON.parse(fs.readFileSync('restored-state.json', 'utf-8'));

const freshCookieNames = new Set(fresh.cookies.map((c: any) => c.name));
const restoredCookieNames = new Set(restored.cookies.map((c: any) => c.name));

// Find missing cookies
for (const name of freshCookieNames) {
  if (!restoredCookieNames.has(name)) {
    console.log(`Missing cookie in restored state: ${name}`);
  }
}
```

### Step 3: Check cookie expiration

```typescript
const now = Date.now() / 1000;
for (const cookie of state.cookies) {
  if (cookie.expires > 0 && cookie.expires < now) {
    console.log(`Expired cookie: ${cookie.name} (expired ${new Date(cookie.expires * 1000)})`);
  }
}
```

## Browser Crash Recovery

Detect browser disconnection and recover:

```typescript
browser.on('disconnected', async () => {
  console.error('Browser disconnected — attempting recovery');

  const newBrowser = await chromium.launch();
  const newContext = await newBrowser.newContext({
    storageState: 'last-checkpoint.json',
  });

  console.log('Browser recovered from last checkpoint');
  // Resume operations with newContext
});
```

### Crash-safe operation wrapper

```typescript
async function withCrashRecovery<T>(
  browserFactory: () => Promise<Browser>,
  stateFile: string,
  operation: (context: BrowserContext) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const browser = await browserFactory();
    try {
      const context = await browser.newContext({
        storageState: fs.existsSync(stateFile) ? stateFile : undefined,
      });
      const result = await operation(context);
      await context.storageState({ path: stateFile });
      await browser.close();
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      try { await browser.close(); } catch {}
      if (attempt === maxRetries) throw error;
    }
  }
  throw new Error('Unreachable');
}
```

## Debug Checklist

When a persistent session fails, check in this order:

1. Are cookies expired? (Check `expires` field in state file)
2. Was the session revoked server-side? (Check with a fresh login)
3. Did the cookie domain change? (Compare domain fields)
4. Is localStorage corrupted? (Validate JSON structure)
5. Did the app deploy a new version? (Check for schema changes)
6. Is the browser out of memory? (Check heap stats)
7. Did the browser crash? (Check for disconnected events in logs)
