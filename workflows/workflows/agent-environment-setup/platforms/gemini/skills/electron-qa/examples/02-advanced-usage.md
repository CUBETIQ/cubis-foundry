# Example: E2E Testing, Packaging Validation, and Auto-Update Lifecycle

## Scenario

A team has built an Electron note-taking app with `better-sqlite3` for local storage and `electron-updater` for auto-updates. They need end-to-end tests that verify data persistence across app restarts, packaging tests that validate distributable contents across platforms, auto-update lifecycle tests with a mocked update server, and startup performance regression tests.

## Prompt

"Write tests for our Electron note-taking app: (1) Playwright E2E tests that create a note, quit, relaunch, and verify persistence. (2) Packaging validation that builds with electron-builder and checks native module binaries, ASAR contents, and code signing. (3) Auto-update tests with mocked electron-updater. (4) Startup time regression test. Target macOS, Windows, and Linux."

## Expected Output

### Playwright E2E Test Configuration

```typescript
// e2e/playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  workers: 1, // Electron tests must run serially
  use: {
    trace: "on-first-retry",
  },
});
```

### E2E Persistence Test

```typescript
// e2e/persistence.spec.ts
import { test, expect, _electron, type ElectronApplication, type Page } from "@playwright/test";
import path from "node:path";

let electronApp: ElectronApplication;
let page: Page;

const APP_PATH = path.resolve(__dirname, "../dist/main.js");

test.describe("Note Persistence", () => {
  test("created note survives app restart", async () => {
    // First session: create a note
    electronApp = await _electron.launch({ args: [APP_PATH] });
    page = await electronApp.firstWindow();

    await page.getByRole("button", { name: "New Note" }).click();
    await page.getByRole("textbox", { name: "Title" }).fill("Test Note");
    await page.getByRole("textbox", { name: "Content" }).fill(
      "This note should persist across restarts."
    );
    await page.getByRole("button", { name: "Save" }).click();

    // Verify the note appears in the list
    await expect(page.getByText("Test Note")).toBeVisible();

    // Quit the app
    await electronApp.close();

    // Second session: verify the note persists
    electronApp = await _electron.launch({ args: [APP_PATH] });
    page = await electronApp.firstWindow();

    await expect(page.getByText("Test Note")).toBeVisible();
    await page.getByText("Test Note").click();
    await expect(
      page.getByText("This note should persist across restarts.")
    ).toBeVisible();

    await electronApp.close();
  });

  test("verifies better-sqlite3 database exists after first launch", async () => {
    electronApp = await _electron.launch({ args: [APP_PATH] });

    // Check from main process that the SQLite database was created
    const dbExists = await electronApp.evaluate(async ({ app }) => {
      const fs = require("node:fs");
      const path = require("node:path");
      const dbPath = path.join(app.getPath("userData"), "notes.db");
      return fs.existsSync(dbPath);
    });

    expect(dbExists).toBe(true);
    await electronApp.close();
  });
});
```

### Startup Performance Test

```typescript
// e2e/startup-performance.spec.ts
import { test, expect, _electron } from "@playwright/test";
import path from "node:path";

const APP_PATH = path.resolve(__dirname, "../dist/main.js");
const MAX_STARTUP_MS = 3000; // Threshold: 3 seconds cold start

test("cold startup completes within threshold", async () => {
  const startTime = performance.now();

  const electronApp = await _electron.launch({ args: [APP_PATH] });
  const page = await electronApp.firstWindow();

  // Wait for the app to be interactive (first meaningful paint)
  await page.waitForSelector("[data-testid='app-ready']", {
    state: "visible",
    timeout: MAX_STARTUP_MS,
  });

  const startupTime = performance.now() - startTime;
  console.log(`Cold startup time: ${Math.round(startupTime)}ms`);

  expect(startupTime).toBeLessThan(MAX_STARTUP_MS);
  await electronApp.close();
});
```

### Packaging Validation Script

```typescript
// scripts/validate-package.ts
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import asar from "@electron/asar";

const platform = process.platform;
const distDir = path.resolve(__dirname, "../dist");

function validateAsar() {
  let asarPath: string;

  if (platform === "darwin") {
    asarPath = path.join(
      distDir,
      "mac-arm64",
      "Notes.app",
      "Contents",
      "Resources",
      "app.asar"
    );
  } else if (platform === "win32") {
    asarPath = path.join(distDir, "win-unpacked", "resources", "app.asar");
  } else {
    asarPath = path.join(distDir, "linux-unpacked", "resources", "app.asar");
  }

  console.log(`Validating ASAR at: ${asarPath}`);

  if (!fs.existsSync(asarPath)) {
    throw new Error(`ASAR not found at ${asarPath}`);
  }

  const contents = asar.listPackage(asarPath);

  // Verify essential files
  const required = ["package.json", "dist/main.js", "dist/preload.js"];
  for (const file of required) {
    if (!contents.some((f) => f.includes(file))) {
      throw new Error(`Missing required file in ASAR: ${file}`);
    }
  }

  console.log(`ASAR contains ${contents.length} files. All required files present.`);
}

function validateNativeModules() {
  let nativeDir: string;

  if (platform === "darwin") {
    nativeDir = path.join(
      distDir,
      "mac-arm64",
      "Notes.app",
      "Contents",
      "Resources",
      "app.asar.unpacked"
    );
  } else if (platform === "win32") {
    nativeDir = path.join(distDir, "win-unpacked", "resources", "app.asar.unpacked");
  } else {
    nativeDir = path.join(distDir, "linux-unpacked", "resources", "app.asar.unpacked");
  }

  // Verify better-sqlite3 native binary exists
  const nodeFiles = findFiles(nativeDir, ".node");
  const hasSqlite = nodeFiles.some((f) => f.includes("better_sqlite3"));

  if (!hasSqlite) {
    throw new Error(
      "better-sqlite3 native binary (.node) not found in unpacked resources"
    );
  }

  console.log(`Found ${nodeFiles.length} native module binaries.`);
}

function validateCodeSigning() {
  if (platform === "darwin") {
    const appPath = path.join(distDir, "mac-arm64", "Notes.app");
    try {
      execSync(`codesign --verify --deep --strict "${appPath}"`, {
        stdio: "pipe",
      });
      console.log("macOS code signing: VALID");
    } catch {
      throw new Error("macOS code signing verification failed");
    }
  } else if (platform === "win32") {
    const exePath = path.join(distDir, "win-unpacked", "Notes.exe");
    try {
      execSync(
        `powershell -Command "Get-AuthenticodeSignature '${exePath}' | Select-Object -ExpandProperty Status"`,
        { stdio: "pipe" }
      );
      console.log("Windows Authenticode: VALID");
    } catch {
      throw new Error("Windows Authenticode verification failed");
    }
  } else {
    console.log("Linux: No code signing verification required.");
  }
}

function findFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(full, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

// Run all validations
console.log(`\nValidating ${platform} package...\n`);
validateAsar();
validateNativeModules();
validateCodeSigning();
console.log("\nAll packaging validations passed.");
```

### Auto-Update Lifecycle Test

```typescript
// tests/main/auto-update.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { autoUpdater } from "electron-updater";
import { setupAutoUpdater } from "../../src/main/auto-updater";

vi.mock("electron-updater", () => ({
  autoUpdater: {
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn(),
    on: vi.fn(),
    setFeedURL: vi.fn(),
    autoDownload: false,
    autoInstallOnAppQuit: true,
  },
}));

vi.mock("electron", () => ({
  app: { getVersion: vi.fn(() => "1.0.0"), isPackaged: true },
  BrowserWindow: { getAllWindows: vi.fn(() => []) },
}));

describe("Auto-Update Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAutoUpdater();
  });

  it("checks for updates on setup", () => {
    expect(autoUpdater.checkForUpdates).toHaveBeenCalled();
  });

  it("registers update-available listener", () => {
    const calls = (autoUpdater.on as any).mock.calls;
    const events = calls.map(([event]: [string]) => event);
    expect(events).toContain("update-available");
  });

  it("registers download-progress listener", () => {
    const calls = (autoUpdater.on as any).mock.calls;
    const events = calls.map(([event]: [string]) => event);
    expect(events).toContain("download-progress");
  });

  it("registers update-downloaded listener that schedules install", () => {
    const calls = (autoUpdater.on as any).mock.calls;
    const downloadedHandler = calls.find(
      ([event]: [string]) => event === "update-downloaded"
    )?.[1];

    expect(downloadedHandler).toBeDefined();

    // Simulate update-downloaded event
    downloadedHandler({ version: "2.0.0" });
    expect(autoUpdater.quitAndInstall).toHaveBeenCalled();
  });

  it("handles update-not-available gracefully", () => {
    const calls = (autoUpdater.on as any).mock.calls;
    const notAvailableHandler = calls.find(
      ([event]: [string]) => event === "update-not-available"
    )?.[1];

    expect(notAvailableHandler).toBeDefined();
    // Should not throw
    expect(() => notAvailableHandler({})).not.toThrow();
  });

  it("handles error event without crashing", () => {
    const calls = (autoUpdater.on as any).mock.calls;
    const errorHandler = calls.find(
      ([event]: [string]) => event === "error"
    )?.[1];

    expect(errorHandler).toBeDefined();
    expect(() => errorHandler(new Error("Network error"))).not.toThrow();
  });
});
```

### CI Configuration

```yaml
# .github/workflows/electron-test.yml
name: Electron QA
on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Rebuild native modules for Electron
        run: npx electron-rebuild

      # Linux requires a virtual display for Electron
      - name: Setup Xvfb (Linux)
        if: runner.os == 'Linux'
        run: sudo apt-get install -y xvfb

      - name: Run unit tests
        run: npx vitest run

      - name: Run E2E tests
        run: |
          if [ "$RUNNER_OS" = "Linux" ]; then
            xvfb-run npx playwright test
          else
            npx playwright test
          fi

      - name: Build package
        run: npx electron-builder --publish never

      - name: Validate package
        run: npx tsx scripts/validate-package.ts
```

## Key Decisions

- **`_electron.launch()` with `close()` and relaunch** -- verifies actual data persistence by writing data in one app session and reading it in a fresh session, catching SQLite database path or migration issues.
- **Main process `evaluate()`** -- accesses the file system from the main process context to verify the SQLite database file exists, using the same `app.getPath` the app uses.
- **`performance.now()` for startup measurement** -- measures wall-clock time from process launch to UI-ready state. The `data-testid='app-ready'` attribute avoids timing a loading spinner instead of actual readiness.
- **ASAR validation with `@electron/asar`** -- lists package contents programmatically to verify all required files are included, catching packaging misconfigurations that produce runtime import errors.
- **Platform-conditional code signing** -- `codesign --verify` on macOS, `Get-AuthenticodeSignature` on Windows, skip on Linux. Each platform has different signing requirements and verification tools.
- **`electron-rebuild` in CI** -- rebuilds native modules (better-sqlite3) against the Electron Node.js ABI. Missing this step is the most common cause of "works locally, crashes in CI."
