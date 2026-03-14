# Browser Contexts

Load this reference when creating or managing browser contexts, coordinating multi-tab sessions, or configuring context isolation.

## Context Architecture

Playwright's hierarchy:

```
Browser (single process)
  └── BrowserContext (isolated session — cookies, storage, cache)
        ├── Page (tab 1)
        ├── Page (tab 2)
        └── Page (tab 3)
```

- **Browser**: One Chromium/Firefox/WebKit process. Expensive to create. Reuse across contexts.
- **BrowserContext**: Isolated session. Tabs within a context share cookies, localStorage, sessionStorage, and cache. Contexts do not share state with each other.
- **Page**: A single tab or popup. Has its own navigation history, DOM, and JavaScript execution context.

## Creating Contexts

### Default context

```typescript
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
```

### Context with options

```typescript
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  timezoneId: 'America/New_York',
  geolocation: { latitude: 40.7128, longitude: -74.006 },
  permissions: ['geolocation'],
  userAgent: 'Custom User Agent',
  httpCredentials: { username: 'user', password: 'pass' },
  ignoreHTTPSErrors: true,
  proxy: { server: 'http://proxy.example.com:8080' },
});
```

### Context from saved state

```typescript
const context = await browser.newContext({
  storageState: 'state.json',
});
```

## Multi-Tab Patterns

### Creating tabs

```typescript
const page1 = await context.newPage();
const page2 = await context.newPage();
const page3 = await context.newPage();

// All three tabs share cookies set by any one of them
await page1.goto('https://app.com/login');
// After login on page1, page2 and page3 are also authenticated
```

### Tab identification

Track which page handles which role:

```typescript
const tabs = new Map<string, Page>();
tabs.set('dashboard', await context.newPage());
tabs.set('editor', await context.newPage());
tabs.set('preview', await context.newPage());

// Access by role
const dashboard = tabs.get('dashboard')!;
await dashboard.goto('https://app.com/dashboard');
```

### Handling popups

When a page opens a new tab (via `target="_blank"` or `window.open`):

```typescript
const [popup] = await Promise.all([
  context.waitForEvent('page'),
  page.getByRole('link', { name: 'Open in new tab' }).click(),
]);

await popup.waitForLoadState();
console.log('Popup URL:', popup.url());
```

### Closing tabs safely

```typescript
// Close a specific tab
await page2.close();

// Close all tabs except one
const pages = context.pages();
for (const p of pages) {
  if (p !== page1) await p.close();
}
```

## Context Isolation

### Why isolation matters

Each context has completely separate:
- Cookies (including HttpOnly and Secure)
- localStorage and sessionStorage per origin
- Cache (HTTP cache, service worker cache)
- Permissions (geolocation, notifications)
- Credentials (HTTP auth)

This means:
- Logging in on context A does not affect context B
- Clearing cache on context A does not affect context B
- Permission grants on context A do not affect context B

### When to use multiple contexts

| Scenario | Single context | Multiple contexts |
| --- | --- | --- |
| Tabs that share auth | Yes | No |
| Testing two users simultaneously | No | Yes |
| Isolation between test cases | No | Yes |
| Simulating a logged-in and guest view | No | Yes |

### Multi-user pattern

```typescript
const adminContext = await browser.newContext({
  storageState: 'admin-state.json',
});
const userContext = await browser.newContext({
  storageState: 'user-state.json',
});

const adminPage = await adminContext.newPage();
const userPage = await userContext.newPage();

// Admin and user see different things on the same URL
await adminPage.goto('https://app.com/settings');
await userPage.goto('https://app.com/settings');
```

## Persistent Contexts

For tools that need to preserve browser profile data (extensions, bookmarks, history):

```typescript
// Launch with a persistent user data directory
const context = await chromium.launchPersistentContext('/path/to/user-data-dir', {
  headless: false,
  viewport: { width: 1280, height: 720 },
});

const page = context.pages()[0] || await context.newPage();
```

Persistent contexts:
- Save cookies, cache, and history to disk automatically
- Survive browser restarts
- Support browser extensions
- Cannot use `storageState` option (state is in the user data dir)

### Cleanup for persistent contexts

```typescript
// The user data directory accumulates data over time
// Clean it periodically for long-running automations
import * as fs from 'fs';

function cleanUserDataDir(dir: string) {
  const cacheDir = path.join(dir, 'Default', 'Cache');
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true });
  }
}
```

## Event Handling

### Context-level events

```typescript
// Listen for new pages (tabs/popups)
context.on('page', (page) => {
  console.log('New page opened:', page.url());
});

// Listen for requests across all pages
context.on('request', (request) => {
  console.log('Request:', request.method(), request.url());
});

// Listen for responses across all pages
context.on('response', (response) => {
  console.log('Response:', response.status(), response.url());
});

// Listen for console messages across all pages
context.on('console', (msg) => {
  console.log('Console:', msg.type(), msg.text());
});
```

### Context-level route interception

Routes registered on the context apply to all pages:

```typescript
await context.route('**/api/auth/refresh', (route) =>
  route.fulfill({ status: 200, body: '{"token": "refreshed"}' })
);

// This mock applies to page1, page2, page3, and any future pages
```

## Resource Management

### Memory per context

Each context consumes approximately 20-50 MB of base memory, plus the memory of each page. For long-running applications:

- Close pages you no longer need
- Limit the number of concurrent pages
- Monitor memory with CDP (Chrome DevTools Protocol)

### Context limits

There is no hard limit on contexts per browser, but each context starts additional renderer processes. Practical limit: 10-20 contexts per browser on a standard CI machine (4 GB RAM).

### Graceful shutdown

```typescript
async function shutdown(browser: Browser) {
  const contexts = browser.contexts();
  for (const ctx of contexts) {
    // Save state before closing
    await ctx.storageState({ path: `state-${contexts.indexOf(ctx)}.json` });
    await ctx.close();
  }
  await browser.close();
}
```
