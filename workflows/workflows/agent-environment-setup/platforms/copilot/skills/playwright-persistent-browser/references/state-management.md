# State Management

Load this reference when choosing persistence strategies, serializing browser state, or restoring sessions from saved data.

## State Layers

Browsers store state at multiple layers. Understanding which layer holds your session data determines the persistence strategy.

| Layer | Scope | Persistence API | Typical content |
| --- | --- | --- | --- |
| Cookies | Origin + path | `storageState()` | Session IDs, auth tokens, preferences |
| localStorage | Origin | `storageState()` | User settings, cached data, feature flags |
| sessionStorage | Origin + tab | Manual extraction | Temporary form data, wizard state |
| IndexedDB | Origin | Manual extraction | Large datasets, offline cache |
| Cache API | Origin | Not extractable | HTTP response cache, service worker cache |
| HTTP cache | Origin | Not extractable | Cached assets (images, scripts, styles) |

## storageState — The Standard Approach

Playwright's `storageState()` captures cookies and localStorage in a single JSON structure.

### Saving state

```typescript
// Save after authentication
await context.storageState({ path: 'auth-state.json' });
```

### Restoring state

```typescript
// Create a new context with saved state
const context = await browser.newContext({
  storageState: 'auth-state.json',
});
```

### What storageState captures

```json
{
  "cookies": [
    {
      "name": "session",
      "value": "abc123",
      "domain": ".example.com",
      "path": "/",
      "expires": 1710000000,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "https://example.com",
      "localStorage": [
        { "name": "theme", "value": "dark" },
        { "name": "locale", "value": "en-US" }
      ]
    }
  ]
}
```

### What storageState does NOT capture

- sessionStorage (tab-scoped, not context-scoped)
- IndexedDB data
- Cache API entries
- Service worker registrations
- HTTP cache
- Browser extension state

## sessionStorage Extraction

sessionStorage is scoped to a single tab and is lost when the tab closes. To persist it:

```typescript
// Extract sessionStorage from a specific page
const sessionData = await page.evaluate(() => {
  const data: Record<string, string> = {};
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)!;
    data[key] = sessionStorage.getItem(key)!;
  }
  return data;
});

// Save to file
fs.writeFileSync('session-storage.json', JSON.stringify(sessionData));
```

```typescript
// Restore sessionStorage in a new page
const sessionData = JSON.parse(fs.readFileSync('session-storage.json', 'utf-8'));

await page.addInitScript((data) => {
  for (const [key, value] of Object.entries(data)) {
    sessionStorage.setItem(key, value as string);
  }
}, sessionData);

await page.goto('https://example.com');
```

## IndexedDB Extraction

For applications that store significant data in IndexedDB (offline-first apps, PWAs):

```typescript
// Extract IndexedDB data
const idbData = await page.evaluate(async () => {
  const dbNames = await indexedDB.databases();
  const result: Record<string, any> = {};

  for (const { name } of dbNames) {
    if (!name) continue;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(name);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const stores: Record<string, any[]> = {};
    for (const storeName of db.objectStoreNames) {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      stores[storeName] = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    result[name] = stores;
    db.close();
  }

  return result;
});
```

## State Validation

Restored state may be invalid (expired tokens, revoked sessions, schema changes). Always validate before using.

### Validation patterns

```typescript
async function isSessionValid(page: Page): Promise<boolean> {
  // Pattern 1: Check a protected endpoint
  const response = await page.goto('https://app.com/api/me');
  if (!response || response.status() === 401) return false;

  // Pattern 2: Check for login redirect
  await page.goto('https://app.com/dashboard');
  if (page.url().includes('/login')) return false;

  // Pattern 3: Check for a logged-in UI element
  const logoutButton = page.getByRole('button', { name: /log out/i });
  return await logoutButton.isVisible({ timeout: 3000 }).catch(() => false);
}
```

### State freshness check

Add a timestamp to your state file to detect stale state without making a network request:

```typescript
interface PersistedState {
  storageState: any;
  savedAt: string;
  expiresAt: string;
}

function isStateExpired(state: PersistedState): boolean {
  return new Date(state.expiresAt) < new Date();
}
```

## Checkpoint Strategy

For long-running workflows, save state at regular intervals:

```typescript
class CheckpointManager {
  private interval: NodeJS.Timeout | null = null;

  startPeriodicCheckpoints(context: BrowserContext, filePath: string, intervalMs: number) {
    this.interval = setInterval(async () => {
      try {
        await context.storageState({ path: filePath });
        console.log(`Checkpoint saved at ${new Date().toISOString()}`);
      } catch (error) {
        console.warn('Checkpoint failed:', error);
      }
    }, intervalMs);
  }

  stopCheckpoints() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
```

### Checkpoint rotation

Keep multiple checkpoint files to recover from corruption:

```typescript
async function saveRotatingCheckpoint(
  context: BrowserContext,
  baseDir: string,
  maxCheckpoints: number = 5
) {
  const timestamp = Date.now();
  const filePath = path.join(baseDir, `checkpoint-${timestamp}.json`);
  await context.storageState({ path: filePath });

  // Remove old checkpoints beyond the limit
  const files = fs.readdirSync(baseDir)
    .filter((f) => f.startsWith('checkpoint-'))
    .sort()
    .reverse();

  for (const file of files.slice(maxCheckpoints)) {
    fs.unlinkSync(path.join(baseDir, file));
  }
}
```

## State Migration

When the application changes its storage schema, old state files may become incompatible. Handle this:

```typescript
interface StateFile {
  version: number;
  storageState: any;
}

function migrateState(state: StateFile): StateFile {
  if (state.version === 1) {
    // v1 -> v2: cookie name changed from "sid" to "session_id"
    state.storageState.cookies = state.storageState.cookies.map((c: any) => ({
      ...c,
      name: c.name === 'sid' ? 'session_id' : c.name,
    }));
    state.version = 2;
  }
  return state;
}
```

## Decision Matrix

| Need | Strategy | Complexity |
| --- | --- | --- |
| Reuse login across tests | `storageState` in global setup | Low |
| Persist session across runs | `storageState` to file + validation | Medium |
| Persist session + form data | `storageState` + sessionStorage extraction | Medium |
| Persist offline app data | `storageState` + IndexedDB extraction | High |
| Survive browser restarts | `launchPersistentContext` with user data dir | Medium |
| Distributed session sharing | `storageState` to Redis/S3 | High |
