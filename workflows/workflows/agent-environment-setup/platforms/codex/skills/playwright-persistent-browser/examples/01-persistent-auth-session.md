# Example: Persistent Authentication Session

This example demonstrates a session manager that authenticates once, saves the browser state to disk, and restores it on subsequent runs. If the saved session has expired, it re-authenticates automatically.

## Scenario

A monitoring tool that logs into an internal dashboard every 15 minutes to capture metrics. The dashboard uses HttpOnly session cookies with a 24-hour expiry. The tool should authenticate once per day and reuse the session for all subsequent checks.

## Session Manager

```typescript
// session-manager.ts
import { chromium, BrowserContext, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface SessionConfig {
  stateFile: string;
  loginUrl: string;
  dashboardUrl: string;
  credentials: { email: string; password: string };
}

export class SessionManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: SessionConfig;

  constructor(config: SessionConfig) {
    this.config = config;
  }

  async initialize(): Promise<BrowserContext> {
    this.browser = await chromium.launch({ headless: true });

    if (this.hasSavedState()) {
      try {
        return await this.restoreSession();
      } catch (error) {
        console.warn('Saved session invalid, re-authenticating:', error);
        return await this.freshLogin();
      }
    }

    return await this.freshLogin();
  }

  private hasSavedState(): boolean {
    return fs.existsSync(this.config.stateFile);
  }

  private async restoreSession(): Promise<BrowserContext> {
    const stateFile = this.config.stateFile;

    // Validate the state file is not corrupted
    const raw = fs.readFileSync(stateFile, 'utf-8');
    const state = JSON.parse(raw);
    if (!state.cookies || !Array.isArray(state.cookies)) {
      throw new Error('Corrupt state file: missing cookies array');
    }

    this.context = await this.browser!.newContext({ storageState: stateFile });
    const page = await this.context.newPage();

    // Validate the session is still active
    const isValid = await this.validateSession(page);
    await page.close();

    if (!isValid) {
      await this.context.close();
      throw new Error('Session expired');
    }

    console.log('Session restored from saved state');
    return this.context;
  }

  private async freshLogin(): Promise<BrowserContext> {
    this.context = await this.browser!.newContext();
    const page = await this.context.newPage();

    await page.goto(this.config.loginUrl);
    await page.getByLabel('Email').fill(this.config.credentials.email);
    await page.getByLabel('Password').fill(this.config.credentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Wait for successful login
    await page.waitForURL(this.config.dashboardUrl);

    // Serialize state including HttpOnly cookies
    await this.context.storageState({ path: this.config.stateFile });
    console.log('Fresh login complete, state saved to', this.config.stateFile);

    await page.close();
    return this.context;
  }

  private async validateSession(page: Page): Promise<boolean> {
    try {
      const response = await page.goto(this.config.dashboardUrl, {
        waitUntil: 'domcontentloaded',
      });

      // If the server redirects to login, the session has expired
      if (page.url().includes('/login') || page.url().includes('/signin')) {
        return false;
      }

      // Check for a known authenticated element
      const authIndicator = page.getByRole('button', { name: /sign out|logout/i });
      return await authIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  async saveCheckpoint(): Promise<void> {
    if (!this.context) return;
    await this.context.storageState({ path: this.config.stateFile });
    console.log('Checkpoint saved');
  }

  async cleanup(): Promise<void> {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}
```

## Usage in Monitoring Script

```typescript
// monitor.ts
import { SessionManager } from './session-manager';

async function runMonitoringCycle() {
  const session = new SessionManager({
    stateFile: './state/dashboard-session.json',
    loginUrl: 'https://internal.example.com/login',
    dashboardUrl: 'https://internal.example.com/dashboard',
    credentials: {
      email: process.env.MONITOR_EMAIL!,
      password: process.env.MONITOR_PASSWORD!,
    },
  });

  try {
    const context = await session.initialize();
    const page = await context.newPage();

    await page.goto('https://internal.example.com/dashboard/metrics');
    const metrics = await page.locator('[data-testid="metrics-panel"]').textContent();
    console.log('Metrics captured:', metrics);

    // Save checkpoint after successful operation
    await session.saveCheckpoint();
    await page.close();
  } catch (error) {
    console.error('Monitoring cycle failed:', error);
  } finally {
    await session.cleanup();
  }
}

runMonitoringCycle();
```

## State File Schema

```json
{
  "cookies": [
    {
      "name": "session_id",
      "value": "abc123...",
      "domain": "internal.example.com",
      "path": "/",
      "expires": 1710000000,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "https://internal.example.com",
      "localStorage": [
        { "name": "theme", "value": "dark" },
        { "name": "sidebar_collapsed", "value": "false" }
      ]
    }
  ]
}
```

## Key Takeaways

- `storageState()` captures HttpOnly cookies that `context.cookies()` also captures, but the storage state format includes localStorage — use it as the single source of truth
- Always validate a restored session before using it — expired sessions produce confusing downstream errors
- Save checkpoints after successful operations so crash recovery resumes from the latest good state
- Keep credentials in environment variables, never in state files or source code
