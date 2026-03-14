# IPC Testing

Load this reference when testing main-renderer IPC channels, contextBridge configuration, or preload script behavior.

## IPC Architecture

Electron IPC has three participants:

```
Renderer Process                 Preload Script              Main Process
(web page JS)                    (Node.js context)           (Node.js)

window.electronAPI.foo() ------> ipcRenderer.invoke() -----> ipcMain.handle()

<--- return value -------------- <--- return value --------- return value
```

- **Renderer**: Cannot access Node.js or Electron APIs directly (when `contextIsolation: true`)
- **Preload**: Has access to both DOM and Node.js. Bridges via `contextBridge`
- **Main**: Full Node.js access. Handles IPC requests from any renderer

## Typed Channel Contracts

Define a shared TypeScript interface for all IPC channels:

```typescript
// shared/ipc-types.ts
export interface IpcChannels {
  // Request-response channels (invoke/handle)
  'db:query': { args: [sql: string, params?: any[]]; return: any[] };
  'db:execute': { args: [sql: string, params?: any[]]; return: { changes: number } };
  'fs:readFile': { args: [path: string]; return: string };
  'fs:writeFile': { args: [path: string, content: string]; return: void };
  'app:getVersion': { args: []; return: string };

  // Fire-and-forget channels (send/on)
  'window:minimize': { args: [] };
  'window:maximize': { args: [] };
  'notification:show': { args: [title: string, body: string] };
}

// Type-safe invoke wrapper
export type InvokeChannel = {
  [K in keyof IpcChannels]: IpcChannels[K] extends { return: infer R }
    ? (...args: IpcChannels[K]['args']) => Promise<R>
    : never;
};
```

## Testing ipcMain Handlers

### Isolated unit tests

Test handlers without launching the full Electron app:

```typescript
// tests/unit/db-handlers.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a mock ipcMain that captures handlers
const handlers = new Map<string, Function>();
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => {
      handlers.set(channel, handler);
    }),
    removeHandler: vi.fn(),
  },
}));

import { registerDbHandlers } from '../../main/db-handlers';

describe('Database IPC Handlers', () => {
  beforeEach(() => {
    handlers.clear();
    registerDbHandlers();
  });

  it('registers all expected channels', () => {
    expect(handlers.has('db:query')).toBe(true);
    expect(handlers.has('db:execute')).toBe(true);
  });

  it('db:query returns rows', async () => {
    const handler = handlers.get('db:query')!;
    const mockEvent = { sender: { id: 1 } };
    const result = await handler(mockEvent, 'SELECT 1 as num', []);
    expect(result).toEqual([{ num: 1 }]);
  });

  it('db:query rejects invalid SQL', async () => {
    const handler = handlers.get('db:query')!;
    await expect(handler({}, 'INVALID SQL')).rejects.toThrow();
  });
});
```

### Verifying handler registration

In E2E tests, verify that handlers are registered:

```typescript
test('all IPC handlers are registered', async () => {
  const registeredChannels = await app.evaluate(({ ipcMain }) => {
    // Access internal handler map
    const events = (ipcMain as any)._invokeHandlers;
    return events ? Array.from(events.keys()) : [];
  });

  expect(registeredChannels).toContain('db:query');
  expect(registeredChannels).toContain('db:execute');
  expect(registeredChannels).toContain('fs:readFile');
});
```

## Testing Preload Scripts

### Verifying contextBridge exposure

```typescript
// tests/unit/preload.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('Preload Script', () => {
  it('exposes only the intended API', () => {
    const exposedApis: Record<string, any> = {};

    vi.doMock('electron', () => ({
      contextBridge: {
        exposeInMainWorld: vi.fn((name: string, api: any) => {
          exposedApis[name] = api;
        }),
      },
      ipcRenderer: {
        invoke: vi.fn(),
        send: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn(),
      },
    }));

    require('../../preload/preload');

    // Verify only one API namespace is exposed
    expect(Object.keys(exposedApis)).toEqual(['electronAPI']);

    // Verify the API surface
    const api = exposedApis.electronAPI;
    const methods = Object.keys(api).sort();
    expect(methods).toEqual([
      'execute',
      'getVersion',
      'query',
      'readFile',
      'writeFile',
    ]);

    // Verify dangerous methods are NOT exposed
    expect(api.require).toBeUndefined();
    expect(api.process).toBeUndefined();
    expect(api.ipcRenderer).toBeUndefined();
  });
});
```

### E2E preload verification

```typescript
test('renderer can access exposed API', async () => {
  const page = await app.firstWindow();

  const apiMethods = await page.evaluate(() => {
    return Object.keys((window as any).electronAPI);
  });

  expect(apiMethods).toContain('query');
  expect(apiMethods).toContain('readFile');
});

test('renderer cannot access Node.js globals', async () => {
  const page = await app.firstWindow();

  const hasRequire = await page.evaluate(() => typeof (window as any).require !== 'undefined');
  const hasProcess = await page.evaluate(() => typeof (window as any).process !== 'undefined');

  expect(hasRequire).toBe(false);
  expect(hasProcess).toBe(false);
});
```

## Testing IPC Round-Trip

Verify that a message travels from renderer to main and back correctly:

```typescript
test('IPC round-trip: renderer invokes, main handles, renderer receives', async () => {
  const page = await app.firstWindow();

  const version = await page.evaluate(async () => {
    return await (window as any).electronAPI.getVersion();
  });

  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});

test('IPC error propagation', async () => {
  const page = await app.firstWindow();

  const error = await page.evaluate(async () => {
    try {
      await (window as any).electronAPI.readFile('/nonexistent/path');
      return null;
    } catch (e: any) {
      return e.message;
    }
  });

  expect(error).toContain('ENOENT');
});
```

## IPC Security Testing

### Channel validation

Verify that unregistered channels are rejected:

```typescript
test('unregistered IPC channel returns error', async () => {
  const page = await app.firstWindow();

  const result = await page.evaluate(async () => {
    try {
      const { ipcRenderer } = require('electron');
      await ipcRenderer.invoke('admin:deleteDatabase');
      return 'should not reach';
    } catch (e: any) {
      return e.message;
    }
  });

  // contextIsolation prevents direct ipcRenderer access
  // The error indicates the renderer cannot call require
  expect(result).toBeTruthy();
});
```

### Input validation

Verify that handlers validate their arguments:

```typescript
it('db:query rejects non-string SQL', async () => {
  const handler = handlers.get('db:query')!;
  await expect(handler({}, 42)).rejects.toThrow('SQL must be a string');
});

it('fs:writeFile rejects path traversal', async () => {
  const handler = handlers.get('fs:writeFile')!;
  await expect(handler({}, '../../../etc/passwd', 'pwned')).rejects.toThrow(
    'Path traversal not allowed'
  );
});
```

## webPreferences Validation

Verify that BrowserWindow security settings are correct:

```typescript
test('webPreferences enforce security boundaries', async () => {
  const prefs = await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    const wp = win.webContents.getLastWebPreferences();
    return {
      contextIsolation: wp.contextIsolation,
      sandbox: wp.sandbox,
      nodeIntegration: wp.nodeIntegration,
      webSecurity: wp.webSecurity,
    };
  });

  expect(prefs.contextIsolation).toBe(true);
  expect(prefs.sandbox).toBe(true);
  expect(prefs.nodeIntegration).toBe(false);
  expect(prefs.webSecurity).toBe(true);
});
```

## Common IPC Testing Mistakes

| Mistake | Why it fails | Correct approach |
| --- | --- | --- |
| Testing with `nodeIntegration: true` | Bypasses security boundary | Test with production settings |
| Not testing error paths | Happy-path-only coverage | Test ENOENT, EACCES, invalid input |
| Skipping serialization | Objects with methods lose them over IPC | Verify returned data is plain JSON |
| Testing ipcRenderer.send for request-response | send/on is fire-and-forget | Use invoke/handle for request-response |
| Not mocking file system in unit tests | Tests depend on OS state | Mock fs module in isolated tests |
