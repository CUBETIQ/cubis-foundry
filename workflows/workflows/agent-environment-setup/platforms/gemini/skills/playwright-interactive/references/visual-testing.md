# Visual Testing

Load this reference when setting up screenshot comparison, managing baselines, or configuring diff thresholds.

## Screenshot Comparison Basics

Playwright's `toHaveScreenshot()` captures a screenshot, compares it against a stored baseline, and fails the test if the diff exceeds the threshold.

```typescript
// Basic screenshot assertion
await expect(page).toHaveScreenshot('homepage.png');

// With explicit thresholds
await expect(page).toHaveScreenshot('homepage.png', {
  maxDiffPixelRatio: 0.02,
  threshold: 0.15,
});

// Component-level screenshot
await expect(page.locator('.hero-section')).toHaveScreenshot('hero.png');
```

## Threshold Configuration

Two thresholds control comparison sensitivity:

### `threshold` (0 to 1)

Per-pixel color difference tolerance. A threshold of 0.1 means two pixels are considered identical if their color values differ by less than 10% across all channels.

- **0.0** — Pixel-perfect match (too strict for most uses)
- **0.1** — Catches color changes, tolerates anti-aliasing
- **0.2** — Tolerates font rendering differences across platforms
- **0.3+** — Too loose for most visual testing

### `maxDiffPixels` / `maxDiffPixelRatio`

Total number (or ratio) of differing pixels allowed across the entire image.

- **maxDiffPixels: 100** — Allow up to 100 pixels to differ
- **maxDiffPixelRatio: 0.01** — Allow up to 1% of pixels to differ

### Recommended thresholds by component type

| Component | `maxDiffPixelRatio` | `threshold` | Notes |
| --- | --- | --- | --- |
| Navigation bar | 0.01 | 0.1 | Structural; tight tolerance |
| Form layouts | 0.015 | 0.12 | Input rendering varies slightly |
| Text-heavy content | 0.03 | 0.2 | Font hinting differs across OS |
| Data visualizations | 0.02 | 0.15 | Chart rendering varies |
| Full-page captures | 0.02 | 0.15 | Composite; balanced tolerance |
| Icons and logos | 0.005 | 0.05 | Brand identity; very tight |

## Dynamic Content Masking

Mask elements that change between runs to prevent false positives:

```typescript
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [
    page.locator('[data-testid="current-time"]'),
    page.locator('[data-testid="user-avatar"]'),
    page.locator('[data-testid="notification-badge"]'),
    page.locator('.ad-container'),
  ],
  maskColor: '#FF00FF', // visible in diffs, easy to spot
});
```

### What to mask

- Timestamps and relative dates ("3 minutes ago")
- User-specific content (avatars, names in greetings)
- Random or A/B-tested content
- Third-party widgets (ads, chat bubbles)
- Animated elements that cannot be frozen

### What NOT to mask

- Layout structure (the mask hides real regressions)
- Colors and typography (these are what visual testing catches)
- Icon presence (missing icons are real bugs)

## Animation Handling

Animations cause non-deterministic screenshots. Freeze them before capture:

```typescript
// Global animation disable fixture
async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `,
  });
}
```

For canvas-based animations (charts, maps), wait for a "loaded" signal:

```typescript
await page.waitForFunction(() => window.__chartsReady === true);
```

## Cross-Browser Baselines

Separate baselines per browser project. Font rendering, anti-aliasing, and sub-pixel positioning differ between Chromium, Firefox, and WebKit.

```typescript
// playwright.config.ts
export default defineConfig({
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}-{projectName}{ext}',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
```

This produces:
```
__snapshots__/
  tests/dashboard.spec.ts/
    dashboard-full-chromium.png
    dashboard-full-firefox.png
```

## Responsive Visual Testing

Capture at multiple breakpoints to catch responsive layout regressions:

```typescript
const breakpoints = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'wide', width: 1920, height: 1080 },
];

for (const bp of breakpoints) {
  test(`dashboard at ${bp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto('/dashboard');
    await expect(page).toHaveScreenshot(`dashboard-${bp.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
}
```

## Baseline Update Workflow

1. **Never auto-update in CI** — baselines should only be updated intentionally
2. Run `npx playwright test --update-snapshots` on the reference machine
3. Review every changed baseline image in the PR diff
4. Require human approval for baseline updates
5. Commit baselines to version control so they are shared across the team

```bash
# Update baselines for a specific test file
npx playwright test tests/dashboard-visual.spec.ts --update-snapshots

# Update baselines for a specific project
npx playwright test --project=chromium --update-snapshots
```

## Debugging Visual Failures

When a visual test fails, Playwright generates three images:

- `expected.png` — the stored baseline
- `actual.png` — what the current test produced
- `diff.png` — highlighted differences

These are saved to `test-results/` by default. Configure the HTML reporter to display them inline:

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [['html', { open: 'never' }]],
});
```
