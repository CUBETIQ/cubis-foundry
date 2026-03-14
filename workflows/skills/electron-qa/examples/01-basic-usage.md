# Example: IPC Handler Testing and Preload Script Validation

## Scenario

A team is building an Electron file manager with IPC channels for file system operations. The main process handles `readDirectory`, `readFile`, `writeFile`, `deleteFile`, and `watchDirectory` through `ipcMain.handle`. The preload script exposes these operations via `contextBridge.exposeInMainWorld`. The team needs to test IPC handlers in isolation, validate the preload API surface, and verify security settings on BrowserWindow creation.

## Prompt

"Write tests for the Electron file manager's IPC layer. Test each ipcMain.handle handler with mocked fs operations. Test the preload script to verify only intended APIs are exposed via contextBridge. Validate BrowserWindow security settings (contextIsolation, sandbox, no nodeIntegration). Define a typed IPC channel map and verify both sides match. Use Vitest."

## Expected Output

### Typed IPC Channel Map

```typescript
// src/shared/ipc-channels.ts
export interface IpcChannelMap {
  "fs:readDirectory": {
    args: [dirPath: string];
    return: FileEntry[];
  };
  "fs:readFile": {
    args: [filePath: string];
    return: { content: string; encoding: string };
  };
  "fs:writeFile": {
    args: [filePath: string, content: string];
    return: { success: boolean };
  };
  "fs:deleteFile": {
    args: [filePath: string];
    return: { success: boolean };
  };
  "fs:watchDirectory": {
    args: [dirPath: string];
    return: { watchId: string };
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

### Main Process IPC Handler Tests

```typescript
// tests/main/ipc-handlers.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { registerFileHandlers } from "../../src/main/ipc/file-handlers";

vi.mock("node:fs/promises");
vi.mock("electron", () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

describe("IPC File Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerFileHandlers();
  });

  it("registers all expected channels", () => {
    const registeredChannels = (ipcMain.handle as any).mock.calls.map(
      ([channel]: [string]) => channel
    );
    expect(registeredChannels).toContain("fs:readDirectory");
    expect(registeredChannels).toContain("fs:readFile");
    expect(registeredChannels).toContain("fs:writeFile");
    expect(registeredChannels).toContain("fs:deleteFile");
    expect(registeredChannels).toContain("fs:watchDirectory");
  });

  describe("fs:readDirectory", () => {
    it("returns file entries for a valid directory", async () => {
      const mockEntries = [
        { name: "file.txt", isDirectory: () => false, isFile: () => true },
        { name: "subfolder", isDirectory: () => true, isFile: () => false },
      ];
      vi.mocked(fs.readdir).mockResolvedValue(mockEntries as any);
      vi.mocked(fs.stat).mockResolvedValue({
        size: 1024,
        mtime: new Date("2026-01-01"),
      } as any);

      const handler = (ipcMain.handle as any).mock.calls.find(
        ([ch]: [string]) => ch === "fs:readDirectory"
      )[1];

      const result = await handler({}, "/home/user/docs");
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: "file.txt",
        isDirectory: false,
      });
    });

    it("throws a descriptive error for non-existent directories", async () => {
      const error = new Error("ENOENT: no such file or directory");
      (error as any).code = "ENOENT";
      vi.mocked(fs.readdir).mockRejectedValue(error);

      const handler = (ipcMain.handle as any).mock.calls.find(
        ([ch]: [string]) => ch === "fs:readDirectory"
      )[1];

      await expect(handler({}, "/nonexistent")).rejects.toThrow("ENOENT");
    });

    it("rejects path traversal attempts", async () => {
      const handler = (ipcMain.handle as any).mock.calls.find(
        ([ch]: [string]) => ch === "fs:readDirectory"
      )[1];

      await expect(handler({}, "../../etc/passwd")).rejects.toThrow(
        "Invalid path"
      );
    });
  });
});
```

### Preload Script Validation

```typescript
// tests/preload/preload-api-surface.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const exposedApis: Record<string, unknown> = {};
vi.mock("electron", () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn((key: string, api: unknown) => {
      exposedApis[key] = api;
    }),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
}));

describe("Preload Script API Surface", () => {
  beforeEach(() => {
    Object.keys(exposedApis).forEach((key) => delete exposedApis[key]);
    vi.clearAllMocks();
  });

  it("exposes exactly the fileManager API namespace", async () => {
    await import("../../src/preload/index");
    const keys = Object.keys(exposedApis);
    expect(keys).toEqual(["fileManager"]);
  });

  it("exposes only the intended methods on fileManager", async () => {
    await import("../../src/preload/index");
    const api = exposedApis.fileManager as Record<string, unknown>;
    const methods = Object.keys(api);
    expect(methods).toEqual([
      "readDirectory",
      "readFile",
      "writeFile",
      "deleteFile",
      "watchDirectory",
      "onWatchEvent",
    ]);
  });

  it("does not expose Node.js built-ins", async () => {
    await import("../../src/preload/index");
    const api = exposedApis.fileManager as Record<string, unknown>;
    expect(api).not.toHaveProperty("require");
    expect(api).not.toHaveProperty("process");
    expect(api).not.toHaveProperty("fs");
  });

  it("invoke calls use correct channel names", async () => {
    const { ipcRenderer } = await import("electron");
    await import("../../src/preload/index");
    const api = exposedApis.fileManager as Record<string, Function>;

    await api.readDirectory("/test");
    expect(ipcRenderer.invoke).toHaveBeenCalledWith("fs:readDirectory", "/test");

    await api.readFile("/test/file.txt");
    expect(ipcRenderer.invoke).toHaveBeenCalledWith("fs:readFile", "/test/file.txt");
  });
});
```

### BrowserWindow Security Test

```typescript
// tests/main/window-security.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserWindow } from "electron";
import { createMainWindow } from "../../src/main/window";

vi.mock("electron", () => ({
  BrowserWindow: vi.fn().mockImplementation((opts) => ({
    webPreferences: opts.webPreferences,
    loadURL: vi.fn(),
    on: vi.fn(),
  })),
  app: { getPath: vi.fn(() => "/mock") },
}));

describe("BrowserWindow Security", () => {
  it("enables contextIsolation", () => {
    const win = createMainWindow();
    expect(win.webPreferences.contextIsolation).toBe(true);
  });

  it("enables sandbox mode", () => {
    const win = createMainWindow();
    expect(win.webPreferences.sandbox).toBe(true);
  });

  it("disables nodeIntegration", () => {
    const win = createMainWindow();
    expect(win.webPreferences.nodeIntegration).toBe(false);
  });

  it("sets the correct preload script path", () => {
    const win = createMainWindow();
    expect(win.webPreferences.preload).toMatch(/preload/);
  });
});
```

## Key Decisions

- **Typed IPC channel map** -- a shared `IpcChannelMap` interface validates both the main process handlers and preload invoke calls against the same type at compile time.
- **Mocked `fs` module** -- isolates handler logic from the real file system. Tests run in milliseconds and never modify actual files.
- **Path traversal test** -- IPC handlers that accept file paths must validate them to prevent renderer-side code from accessing files outside the allowed scope.
- **`exposeInMainWorld` spy** -- captures what the preload script exposes, allowing the test to assert on the exact API surface without running Electron.
- **Security assertions as tests** -- `contextIsolation`, `sandbox`, and `nodeIntegration` settings are verified in a test rather than in code review, preventing accidental drift.
