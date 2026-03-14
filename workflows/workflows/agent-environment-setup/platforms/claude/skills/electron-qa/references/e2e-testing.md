# E2E Testing

Load this reference when setting up Playwright for Electron, launching the app in tests, or writing renderer-level E2E tests.

## Playwright Electron Setup

Playwright provides first-class Electron support through the `_electron` module. It launches the Electron app as a child process and connects to it via the Chrome DevTools Protocol.

### Installation

```bash
npm install -D @playwright/test
```

No separate Electron driver is needed. Playwright connects to your existing Electron binary.

### Basic Launch

```typescript
import { test, _electron as electron } from '@playwright/test';
import * as path from 'path';

test('launch electron app', async () => {
  const app = await electron.launch({
    args: [path.join(__dirname, '../main/index.js')],
  });

  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  // Test the renderer UI
  // ...

  await app.close();
});
```

### Launch Options

```typescript
const app = await electron.launch({
  // Path to main process entry or the electron executable
  args: [path.join(__dirname, '../main/index.js')],

  // Environment variables for the Electron process
  env: {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_PATH: '/tmp/test.db',
  },

  // Working directory
  cwd: path.join(__dirname, '..'),

  // Timeout for launch (default: 30000)
  timeout: 60000,

  // Electron executable path (if not using the project's node_modules)
  executablePath: '/path/to/electron',
});
```

## Accessing Windows

### First window

```typescript
// Wait for the first BrowserWindow to open
const page = await app.firstWindow();
```

### Multiple windows

```typescript
// Wait for a specific window
const [secondWindow] = await Promise.all([
  app.waitForEvent('window'),
  page.getByRole('button', { name: 'Open Settings' }).click(),
]);
```

### All windows

```typescript
const windows = app.windows();
console.log(`Open windows: ${windows.length}`);
```

## Main Process Access

Playwright's `electronApplication.evaluate()` runs code in the Electron main process:

```typescript
// Read a main process value
const appPath = await app.evaluate(async ({ app }) => {
  return app.getPath('userData');
});

// Interact with BrowserWindow
const isMaximized = await app.evaluate(({ BrowserWindow }) => {
  const win = BrowserWindow.getAllWindows()[0];
  return win.isMaximized();
});

// Access Electron APIs
const version = await app.evaluate(({ app }) => app.getVersion());

// Access ipcMain (for testing handler registration)
const channelCount = await app.evaluate(({ ipcMain }) => {
  return (ipcMain as any)._events ? Object.keys((ipcMain as any)._events).length : 0;
});
```

## Renderer Testing

Once you have a `page` reference, use standard Playwright APIs:

```typescript
test('creates a new note', async () => {
  const page = await app.firstWindow();

  await page.getByRole('button', { name: 'New Note' }).click();
  await page.getByLabel('Title').fill('Test Note');
  await page.getByLabel('Content').fill('This is a test note.');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Test Note')).toBeVisible();
  await expect(page.getByText('Note saved')).toBeVisible();
});
```

## Test Fixtures

Create reusable fixtures for app launch and cleanup:

```typescript
// fixtures/electron.ts
import { test as base, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';

type ElectronFixtures = {
  electronApp: ElectronApplication;
  window: Page;
};

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../main/index.js')],
      env: { ...process.env, NODE_ENV: 'test' },
    });
    await use(app);
    await app.close();
  },

  window: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

Usage:

```typescript
import { test, expect } from '../fixtures/electron';

test('displays the main window', async ({ window }) => {
  await expect(window.getByRole('heading', { name: 'QuickNotes' })).toBeVisible();
});
```

## Startup Performance Testing

```typescript
test('starts within acceptable time', async () => {
  const startTime = Date.now();

  const app = await electron.launch({
    args: [path.join(__dirname, '../main/index.js')],
  });

  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  const loadTime = Date.now() - startTime;
  console.log(`Startup time: ${loadTime}ms`);

  // Assert startup is under 3 seconds
  expect(loadTime).toBeLessThan(3000);

  await app.close();
});
```

## Dialog Handling

Electron dialogs (open file, save file, message box) are native OS dialogs. Mock them:

```typescript
// Mock dialog.showOpenDialog in the main process
await app.evaluate(({ dialog }) => {
  dialog.showOpenDialog = async () => ({
    canceled: false,
    filePaths: ['/tmp/test-file.txt'],
  });
});

// Now trigger the dialog from the UI
await page.getByRole('button', { name: 'Open File' }).click();
// The mock resolves immediately with /tmp/test-file.txt
```

## Crash Recovery Testing

```typescript
test('recovers from renderer crash', async () => {
  const page = await app.firstWindow();

  // Crash the renderer
  await page.goto('chrome://crash');

  // Wait for recovery (app should detect the crash and create a new window)
  const [newWindow] = await Promise.all([
    app.waitForEvent('window'),
  ]);

  await newWindow.waitForLoadState('domcontentloaded');
  await expect(newWindow.getByText('The application recovered from an error')).toBeVisible();
});
```

## Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000, // Electron apps may take longer to start
  retries: 1,
  workers: 1, // Electron tests should run serially
  reporter: [['html', { open: 'never' }]],
});
```

Key configuration notes:
- **workers: 1** — Running multiple Electron instances in parallel consumes significant memory and can cause port conflicts
- **timeout: 60000** — Electron startup is slower than browser page load; increase the default timeout
- **No webServer** — Electron apps do not need a dev server; they launch their own process
