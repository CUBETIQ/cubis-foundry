# Example: Multi-Tab Session Coordinator

This example demonstrates managing three tabs within a single persistent browser context. The tabs share authentication but navigate independently, with coordination points and memory management.

## Scenario

An automation tool for a project management platform:
- **Tab 1 (Monitor)**: Watches a real-time dashboard for new alerts
- **Tab 2 (Processor)**: Processes a queue of tasks by navigating to each task page
- **Tab 3 (Logger)**: Captures audit logs from the admin panel

All three tabs share a single authenticated session. The tool runs for hours and must manage memory.

## Tab Coordinator

```typescript
// tab-coordinator.ts
import { BrowserContext, Page } from 'playwright';

interface TabRole {
  name: string;
  page: Page;
  startUrl: string;
}

export class TabCoordinator {
  private tabs: Map<string, TabRole> = new Map();
  private context: BrowserContext;

  constructor(context: BrowserContext) {
    this.context = context;
  }

  async createTab(name: string, startUrl: string): Promise<Page> {
    const page = await this.context.newPage();
    await page.goto(startUrl);
    this.tabs.set(name, { name, page, startUrl });
    return page;
  }

  getTab(name: string): Page {
    const tab = this.tabs.get(name);
    if (!tab) throw new Error(`Tab "${name}" not found`);
    return tab.page;
  }

  async closeTab(name: string): Promise<void> {
    const tab = this.tabs.get(name);
    if (tab) {
      await tab.page.close();
      this.tabs.delete(name);
    }
  }

  async closeAll(): Promise<void> {
    for (const [name] of this.tabs) {
      await this.closeTab(name);
    }
  }
}
```

## Monitor Tab

```typescript
// tabs/monitor.ts
import { Page } from 'playwright';

export async function runMonitor(page: Page, onAlert: (alert: string) => void) {
  // Navigate to real-time dashboard
  await page.goto('https://app.example.com/dashboard/live');

  // Listen for new alert elements
  while (true) {
    try {
      // Wait for a new alert to appear (up to 60 seconds)
      const alertEl = await page.waitForSelector(
        '[data-testid="new-alert"]:not([data-processed])',
        { timeout: 60_000 }
      );

      if (alertEl) {
        const text = await alertEl.textContent();
        if (text) onAlert(text);

        // Mark as processed to avoid re-reading
        await alertEl.evaluate((el) => el.setAttribute('data-processed', 'true'));
      }
    } catch {
      // Timeout — no new alerts, continue polling
      // Refresh to ensure SSE connection is alive
      await page.reload({ waitUntil: 'networkidle' });
    }
  }
}
```

## Processor Tab

```typescript
// tabs/processor.ts
import { Page } from 'playwright';

interface TaskItem {
  id: string;
  url: string;
}

export async function processQueue(page: Page, tasks: TaskItem[]) {
  for (const task of tasks) {
    try {
      await page.goto(task.url, { waitUntil: 'domcontentloaded' });

      // Process the task
      await page.getByRole('button', { name: 'Start Processing' }).click();
      await page.waitForSelector('[data-testid="status-complete"]', {
        timeout: 30_000,
      });

      console.log(`Task ${task.id} processed successfully`);

      // Clear navigation history to reduce memory
      // Navigate to a blank page between tasks if memory is a concern
      if (tasks.indexOf(task) % 10 === 0) {
        await clearPageMemory(page);
      }
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
    }
  }
}

async function clearPageMemory(page: Page) {
  // Navigate to blank to release DOM references
  await page.goto('about:blank');
  // Force garbage collection if available (Chromium flag: --js-flags="--expose-gc")
  await page.evaluate(() => {
    if (typeof (globalThis as any).gc === 'function') {
      (globalThis as any).gc();
    }
  });
}
```

## Logger Tab

```typescript
// tabs/logger.ts
import { Page } from 'playwright';
import * as fs from 'fs';

export async function captureAuditLogs(page: Page, outputFile: string) {
  await page.goto('https://app.example.com/admin/audit-log');

  const logs: string[] = [];
  let pageNum = 1;

  while (true) {
    // Capture log entries on current page
    const entries = await page.locator('[data-testid="log-entry"]').allTextContents();
    logs.push(...entries);

    // Check if there is a next page
    const nextButton = page.getByRole('button', { name: 'Next' });
    const isDisabled = await nextButton.isDisabled();
    if (isDisabled) break;

    await nextButton.click();
    await page.waitForLoadState('networkidle');
    pageNum++;
  }

  // Write logs to file
  fs.writeFileSync(outputFile, JSON.stringify(logs, null, 2));
  console.log(`Captured ${logs.length} audit log entries across ${pageNum} pages`);
}
```

## Orchestrator

```typescript
// main.ts
import { chromium } from 'playwright';
import { TabCoordinator } from './tab-coordinator';
import { SessionManager } from './session-manager';
import { runMonitor } from './tabs/monitor';
import { processQueue } from './tabs/processor';
import { captureAuditLogs } from './tabs/logger';

async function main() {
  const session = new SessionManager({
    stateFile: './state/app-session.json',
    loginUrl: 'https://app.example.com/login',
    dashboardUrl: 'https://app.example.com/dashboard',
    credentials: {
      email: process.env.APP_EMAIL!,
      password: process.env.APP_PASSWORD!,
    },
  });

  const context = await session.initialize();
  const coordinator = new TabCoordinator(context);

  try {
    // Create all three tabs
    const monitorPage = await coordinator.createTab(
      'monitor',
      'https://app.example.com/dashboard/live'
    );
    const processorPage = await coordinator.createTab(
      'processor',
      'https://app.example.com/tasks'
    );
    const loggerPage = await coordinator.createTab(
      'logger',
      'https://app.example.com/admin/audit-log'
    );

    // Run tabs concurrently
    const alerts: string[] = [];
    await Promise.all([
      runMonitor(monitorPage, (alert) => alerts.push(alert)),
      processQueue(processorPage, [
        { id: 'T-001', url: 'https://app.example.com/tasks/T-001' },
        { id: 'T-002', url: 'https://app.example.com/tasks/T-002' },
        { id: 'T-003', url: 'https://app.example.com/tasks/T-003' },
      ]),
      captureAuditLogs(loggerPage, './output/audit-logs.json'),
    ]);
  } finally {
    await coordinator.closeAll();
    await session.cleanup();
  }
}

main().catch(console.error);
```

## Memory Monitoring

```typescript
// memory-monitor.ts
import { CDPSession, Page } from 'playwright';

export async function getMemoryUsage(page: Page): Promise<number> {
  const client: CDPSession = await page.context().newCDPSession(page);
  const result = await client.send('Runtime.getHeapUsage');
  await client.detach();
  return result.usedSize;
}

export async function logMemoryPeriodically(
  pages: Map<string, Page>,
  intervalMs: number = 60_000
) {
  setInterval(async () => {
    for (const [name, page] of pages) {
      try {
        const usage = await getMemoryUsage(page);
        const mb = (usage / 1024 / 1024).toFixed(1);
        console.log(`[Memory] ${name}: ${mb} MB`);
      } catch {
        console.log(`[Memory] ${name}: page closed or unresponsive`);
      }
    }
  }, intervalMs);
}
```

## Key Takeaways

- All tabs created from the same `context` share cookies and localStorage automatically
- Each tab navigates independently — one tab reloading does not affect others
- Periodically clear DOM references and navigate away from heavy pages to manage memory
- Use `Promise.all` for concurrent tab operations, but add error handling so one tab's failure does not crash the others
- Monitor memory usage in long-running sessions to detect leaks before they cause crashes
