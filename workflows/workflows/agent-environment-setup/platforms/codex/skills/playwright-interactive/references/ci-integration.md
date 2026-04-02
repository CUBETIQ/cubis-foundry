# CI Integration

Load this reference when configuring Playwright test suites to run in continuous integration with parallel execution, sharding, retries, and artifact collection.

## GitHub Actions Configuration

### Basic setup

```yaml
name: Playwright Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run tests
        run: npx playwright test

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

### Sharded execution

Split the test suite across multiple CI machines for faster feedback:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1/4, 2/4, 3/4, 4/4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Run tests (shard ${{ matrix.shard }})
        run: npx playwright test --shard=${{ matrix.shard }}

      - name: Upload shard report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ strategy.job-index }}
          path: playwright-report/

  merge-reports:
    if: always()
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci

      - name: Download shard reports
        uses: actions/download-artifact@v4
        with:
          pattern: playwright-report-*
          path: all-reports

      - name: Merge reports
        run: npx playwright merge-reports --reporter=html all-reports

      - name: Upload merged report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-merged
          path: playwright-report/
```

## Playwright Configuration for CI

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // CI-specific settings
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'on-failure' }]],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start dev server before tests
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

## Retry Strategy

Retries compensate for environmental flakiness in CI without masking real bugs.

### Configuration

```typescript
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  // Collect trace on first retry for debugging
  use: {
    trace: 'on-first-retry',
  },
});
```

### Per-test retry override

```typescript
test('flaky external service test', async ({ page }) => {
  test.info().annotations.push({ type: 'retries', description: '3' });
  // ...
});
```

### Monitoring flake rate

Track the percentage of tests that pass only on retry. If a test consistently needs retries, fix the root cause rather than increasing retry count.

Target: less than 2% of test runs should require retries.

## Artifact Collection

### Trace files

Traces capture a complete recording of test execution including DOM snapshots, network requests, and console logs.

```typescript
use: {
  trace: 'on-first-retry', // only collect when a test fails and retries
}
```

View traces locally:
```bash
npx playwright show-trace trace.zip
```

### Screenshots

```typescript
use: {
  screenshot: 'only-on-failure', // capture on failure
}
```

### Video

```typescript
use: {
  video: 'on-first-retry', // record video on retry
}
```

## Parallel Execution

### Worker-level parallelism

Playwright runs test files in parallel across workers by default:

```typescript
export default defineConfig({
  workers: process.env.CI ? 1 : '50%',
  fullyParallel: true,
});
```

In CI, `workers: 1` is often safer to avoid resource contention. Increase if your CI machine has sufficient CPU/memory.

### Test-level parallelism

Use `test.describe.parallel()` to run tests within a describe block concurrently:

```typescript
test.describe.parallel('Dashboard widgets', () => {
  test('tasks widget', async ({ page }) => { /* ... */ });
  test('calendar widget', async ({ page }) => { /* ... */ });
  test('notifications widget', async ({ page }) => { /* ... */ });
});
```

## Performance Optimization

| Technique | Savings | Trade-off |
| --- | --- | --- |
| Single browser (Chromium only in CI) | 60-70% time | No cross-browser coverage |
| Sharding across machines | Linear scaling | CI cost increases |
| `storageState` for auth | Skip login per test | Shared auth state |
| Headless mode (default) | 10-20% time | Cannot debug visually |
| Reduced viewport | Marginal | May miss responsive bugs |

### Auth state reuse

Avoid repeating login in every test:

```typescript
// global-setup.ts
import { chromium } from '@playwright/test';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.context().storageState({ path: 'auth.json' });
  await browser.close();
}

export default globalSetup;
```

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  use: {
    storageState: 'auth.json',
  },
});
```

## Docker-Based CI

For reproducible browser environments:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.42.0-jammy
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npx", "playwright", "test"]
```

This image includes all browser binaries and system dependencies, eliminating "works on my machine" failures.

## Monitoring and Alerting

1. **Track test duration** — set a budget (e.g., suite completes in <10 minutes). Alert when it exceeds 120%.
2. **Track flake rate** — percentage of tests that need retries. Alert when it exceeds 2%.
3. **Track failure rate** — percentage of CI runs that fail. Investigate if it exceeds 5% on the main branch.
4. **Archive reports** — keep 30 days of HTML reports for trend analysis.
