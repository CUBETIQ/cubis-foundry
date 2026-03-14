# Example: IPC Testing for an Electron File Manager

This example demonstrates testing IPC channels, preload script security, and typed channel contracts for an Electron file manager application.

## Scenario

An Electron file manager with five IPC channels:
- `file:readDirectory` — Renderer sends a directory path, main returns file listing
- `file:read` — Renderer sends a file path, main returns file contents
- `file:write` — Renderer sends path + content, main writes to disk
- `file:delete` — Renderer sends a file path, main deletes the file
- `file:watch` — Renderer subscribes to directory changes

The app uses `contextIsolation: true` and `sandbox: true`.

## Typed IPC Channel Contract

```typescript
// shared/ipc-channels.ts
export interface IpcChannelMap {
  'file:readDirectory': {
    args: [dirPath: string];
    return: FileEntry[];
  };
  'file:read': {
    args: [filePath: string];
    return: string;
  };
  'file:write': {
    args: [filePath: string, content: string];
    return: { success: boolean; bytesWritten: number };
  };
  'file:delete': {
    args: [filePath: string];
    return: { success: boolean };
  };
  'file:watch': {
    args: [dirPath: string];
    return: void;
  };
}

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
}
```

## Main Process IPC Handlers

```typescript
// main/ipc-handlers.ts
import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileEntry } from '../shared/ipc-channels';

export function registerFileHandlers() {
  ipcMain.handle('file:readDirectory', async (_event, dirPath: string): Promise<FileEntry[]> => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      path: path.join(dirPath, entry.name),
      isDirectory: entry.isDirectory(),
      size: 0, // populated lazily
      modifiedAt: new Date().toISOString(),
    }));
  });

  ipcMain.handle('file:read', async (_event, filePath: string): Promise<string> => {
    return fs.readFile(filePath, 'utf-8');
  });

  ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8');
    const stat = await fs.stat(filePath);
    return { success: true, bytesWritten: stat.size };
  });

  ipcMain.handle('file:delete', async (_event, filePath: string) => {
    await fs.unlink(filePath);
    return { success: true };
  });
}
```

## Preload Script

```typescript
// preload/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  readDirectory: (dirPath: string) => ipcRenderer.invoke('file:readDirectory', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('file:write', filePath, content),
  deleteFile: (filePath: string) => ipcRenderer.invoke('file:delete', filePath),
});
```

## IPC Handler Unit Tests

```typescript
// tests/unit/ipc-handlers.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ipcMain } from 'electron';
import * as fs from 'fs/promises';

// Mock electron and fs
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
}));
vi.mock('fs/promises');

import { registerFileHandlers } from '../../main/ipc-handlers';

describe('IPC File Handlers', () => {
  let handlers: Map<string, Function>;

  beforeEach(() => {
    handlers = new Map();
    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      handlers.set(channel, handler);
    });
    registerFileHandlers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('file:readDirectory', () => {
    it('returns file entries for a valid directory', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'readme.md', isDirectory: () => false },
        { name: 'src', isDirectory: () => true },
      ] as any);

      const handler = handlers.get('file:readDirectory')!;
      const result = await handler({}, '/home/user/project');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('readme.md');
      expect(result[0].isDirectory).toBe(false);
      expect(result[1].name).toBe('src');
      expect(result[1].isDirectory).toBe(true);
    });

    it('throws on non-existent directory', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('ENOENT'));

      const handler = handlers.get('file:readDirectory')!;
      await expect(handler({}, '/nonexistent')).rejects.toThrow('ENOENT');
    });
  });

  describe('file:write', () => {
    it('writes content and returns byte count', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue();
      vi.mocked(fs.stat).mockResolvedValue({ size: 42 } as any);

      const handler = handlers.get('file:write')!;
      const result = await handler({}, '/tmp/test.txt', 'hello world');

      expect(fs.writeFile).toHaveBeenCalledWith('/tmp/test.txt', 'hello world', 'utf-8');
      expect(result).toEqual({ success: true, bytesWritten: 42 });
    });
  });

  describe('file:delete', () => {
    it('deletes the file and returns success', async () => {
      vi.mocked(fs.unlink).mockResolvedValue();

      const handler = handlers.get('file:delete')!;
      const result = await handler({}, '/tmp/test.txt');

      expect(fs.unlink).toHaveBeenCalledWith('/tmp/test.txt');
      expect(result).toEqual({ success: true });
    });

    it('propagates error for permission denied', async () => {
      vi.mocked(fs.unlink).mockRejectedValue(new Error('EACCES'));

      const handler = handlers.get('file:delete')!;
      await expect(handler({}, '/root/protected')).rejects.toThrow('EACCES');
    });
  });
});
```

## Preload Security Tests

```typescript
// tests/unit/preload-security.test.ts
import { describe, it, expect, vi } from 'vitest';

// Verify that the preload script exposes only the intended API
describe('Preload Script Security', () => {
  it('exposes exactly the expected API methods', () => {
    const exposedApi: Record<string, Function> = {};
    const mockContextBridge = {
      exposeInMainWorld: vi.fn((key: string, api: any) => {
        exposedApi[key] = api;
      }),
    };
    const mockIpcRenderer = {
      invoke: vi.fn(),
      send: vi.fn(),
      on: vi.fn(),
    };

    vi.doMock('electron', () => ({
      contextBridge: mockContextBridge,
      ipcRenderer: mockIpcRenderer,
    }));

    // Load preload script
    require('../../preload/preload');

    // Verify only 'electronAPI' is exposed
    expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledTimes(1);
    expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
      'electronAPI',
      expect.any(Object)
    );

    // Verify exposed methods
    const api = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
    const exposedMethods = Object.keys(api);
    expect(exposedMethods).toEqual([
      'readDirectory',
      'readFile',
      'writeFile',
      'deleteFile',
    ]);

    // Verify no direct access to ipcRenderer.send or ipcRenderer.on
    expect(api.send).toBeUndefined();
    expect(api.on).toBeUndefined();
    expect(api.ipcRenderer).toBeUndefined();
  });
});
```

## E2E Test with Playwright

```typescript
// tests/e2e/file-manager.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

let app: Awaited<ReturnType<typeof electron.launch>>;
let page: Awaited<ReturnType<typeof app.firstWindow>>;

test.beforeAll(async () => {
  app = await electron.launch({
    args: [path.join(__dirname, '../../main/index.js')],
    env: { ...process.env, NODE_ENV: 'test' },
  });
  page = await app.firstWindow();
});

test.afterAll(async () => {
  await app.close();
});

test.describe('File Manager E2E', () => {
  test('reads a directory and displays files', async () => {
    const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-test-'));
    fs.writeFileSync(path.join(testDir, 'test.txt'), 'hello');

    // Type directory path into the location bar
    await page.getByLabel('Location').fill(testDir);
    await page.getByRole('button', { name: 'Go' }).click();

    // Verify file appears in the listing
    await expect(page.getByText('test.txt')).toBeVisible();

    // Cleanup
    fs.rmSync(testDir, { recursive: true });
  });

  test('verifies contextIsolation is enabled', async () => {
    const contextIsolation = await app.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.webContents.getLastWebPreferences().contextIsolation;
    });

    expect(contextIsolation).toBe(true);
  });

  test('verifies sandbox is enabled', async () => {
    const sandbox = await app.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.webContents.getLastWebPreferences().sandbox;
    });

    expect(sandbox).toBe(true);
  });
});
```

## Key Takeaways

- IPC handlers are tested in isolation by extracting the handler functions and calling them directly
- The preload security test verifies the API surface area — what is exposed matters as much as what is not exposed
- E2E tests use `app.evaluate()` to inspect main process state (webPreferences) from test code
- Typed IPC channel contracts catch interface drift at compile time
