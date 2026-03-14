# Example: Dashboard Visual Regression + Accessibility Audit

This example demonstrates setting up visual regression testing and accessibility audits for a complex dashboard page with dynamic widgets, animated charts, and responsive breakpoints.

## Scenario

A project management dashboard with:
- Sidebar navigation (collapsible)
- Header with user avatar and notification count
- Main area with 4 chart widgets (animated on load)
- Activity feed with timestamps
- Filter dropdown that dynamically updates the charts

Compliance target: WCAG 2.1 AA. Browsers: Chromium and Firefox.

## Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  snapshotDir: './tests/__snapshots__',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{-projectName}{ext}',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.15,
    },
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 720 } },
    },
  ],
});
```

## Animation Disabling Fixture

```typescript
// fixtures/disable-animations.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });
    await use(page);
  },
});
```

## Visual Regression Tests

```typescript
// tests/dashboard-visual.spec.ts
import { expect } from '@playwright/test';
import { test } from '../fixtures/disable-animations';

test.describe('Dashboard Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all data endpoints for deterministic charts
    await page.route('**/api/dashboard/metrics', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: { completed: 42, pending: 18, overdue: 3 },
          velocity: [10, 12, 8, 15, 11, 14],
        }),
      })
    );

    await page.route('**/api/dashboard/activity', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { user: 'Alice', action: 'completed task', time: '2025-01-15T10:00:00Z' },
            { user: 'Bob', action: 'created issue', time: '2025-01-15T09:30:00Z' },
          ],
        }),
      })
    );

    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="charts-loaded"]');
  });

  test('full dashboard layout', async ({ page }) => {
    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      mask: [
        page.locator('[data-testid="user-avatar"]'),
        page.locator('[data-testid="notification-count"]'),
        page.locator('time'),
      ],
      maxDiffPixelRatio: 0.02,
    });
  });

  test('sidebar navigation', async ({ page }) => {
    await expect(page.locator('[data-testid="sidebar"]')).toHaveScreenshot(
      'dashboard-sidebar.png',
      { maxDiffPixelRatio: 0.01 }
    );
  });

  test('collapsed sidebar', async ({ page }) => {
    await page.getByRole('button', { name: 'Toggle sidebar' }).click();
    await expect(page.locator('[data-testid="sidebar"]')).toHaveScreenshot(
      'dashboard-sidebar-collapsed.png',
      { maxDiffPixelRatio: 0.01 }
    );
  });

  test('filter dropdown open state', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by project' }).click();
    await expect(page.locator('[data-testid="filter-panel"]')).toHaveScreenshot(
      'dashboard-filter-open.png',
      { maxDiffPixelRatio: 0.015 }
    );
  });
});
```

## Accessibility Tests

```typescript
// tests/dashboard-a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa'];

test.describe('Dashboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
    await page.goto('/dashboard');
  });

  test('initial dashboard load passes WCAG 2.1 AA', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('sidebar toggle maintains keyboard focus', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: 'Toggle sidebar' });
    await toggleButton.click();

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('filter dropdown is accessible when expanded', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter by project' }).click();

    const results = await new AxeBuilder({ page })
      .include('[data-testid="filter-panel"]')
      .withTags(WCAG_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('chart widgets have accessible names', async ({ page }) => {
    const charts = page.locator('[role="img"]');
    const count = await charts.count();

    for (let i = 0; i < count; i++) {
      const ariaLabel = await charts.nth(i).getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });
});
```

## Coverage Summary

| UI State | Functional | Visual | Accessibility |
| --- | --- | --- | --- |
| Dashboard initial load | Mock setup | Full-page screenshot | axe scan |
| Sidebar expanded | N/A | Component screenshot | axe scan |
| Sidebar collapsed | Toggle action | Component screenshot | axe scan |
| Filter dropdown open | Click action | Component screenshot | Scoped axe scan |
| Chart widgets | Data rendering | Masked in full-page | ARIA label check |

## Key Takeaways

- Animations are disabled globally via a shared fixture to eliminate timing-dependent visual diffs
- Dynamic content (avatar, timestamps, notification count) is masked in screenshots
- Separate baselines per browser project prevent cross-engine false positives
- Accessibility scans run after each interaction, not just on initial load
- Chart widgets are checked for ARIA labels since axe-core cannot validate chart content accuracy
