# Assertions Reference — playwright-interactive

## Eval 001: Interactive Flow Testing

### Assertion 1 — Network interception
- **Type**: contains
- **What**: Output must include `page.route` for mocking API calls
- **Why**: Interactive flows depend on backend APIs. Without route interception, tests hit real endpoints and become flaky, slow, and environment-dependent. Mocking ensures deterministic test execution.

### Assertion 2 — Role-based locators
- **Type**: contains
- **What**: Output must use `getByRole` selectors
- **Why**: Role-based locators align with how users and assistive technologies interact with the page. They survive CSS refactors and are the recommended Playwright selector strategy.

### Assertion 3 — Page Object Model
- **Type**: contains
- **What**: Output must define class-based page objects
- **Why**: Page Object Model separates selector logic from test logic. When the UI changes, you update one page object instead of every test that touches that page.

### Assertion 4 — No arbitrary timeouts
- **Type**: not_contains
- **What**: Output must not contain `waitForTimeout`
- **Why**: Arbitrary waits are the leading cause of flaky tests. Playwright's auto-waiting and explicit condition waits (`waitForSelector`, `waitForURL`) are deterministic alternatives.

### Assertion 5 — Explicit assertions
- **Type**: contains
- **What**: Output must include `expect()` calls
- **Why**: A test without assertions is a script, not a test. Each step transition and the final confirmation must be verified with explicit expectations.

---

## Eval 002: Visual Regression + Accessibility

### Assertion 1 — Screenshot comparison
- **Type**: contains
- **What**: Output must use `toHaveScreenshot()`
- **Why**: Playwright's built-in snapshot comparison handles baseline management, diffing, and reporting. Custom screenshot solutions lack these features and add maintenance burden.

### Assertion 2 — Dynamic content masking
- **Type**: contains
- **What**: Output must include `mask` configuration
- **Why**: Timestamps, avatars, and other dynamic content change between runs. Without masking, every test run produces a visual diff even when no real regression occurred.

### Assertion 3 — Diff thresholds
- **Type**: contains
- **What**: Output must set `maxDiffPixelRatio`
- **Why**: Default thresholds are either too strict (false positives from font rendering) or too loose (missed regressions). Explicit thresholds per component type balance sensitivity and noise.

### Assertion 4 — axe-core integration
- **Type**: contains
- **What**: Output must use `AxeBuilder`
- **Why**: Manual accessibility testing is incomplete and inconsistent. axe-core catches 50-60% of WCAG violations automatically, providing a reliable baseline for accessibility compliance.

### Assertion 5 — WCAG 2.1 AA targeting
- **Type**: contains
- **What**: Output must configure `wcag2aa` tags
- **Why**: Without explicit tag configuration, axe-core runs all rules including best-practice suggestions. Targeting WCAG 2.1 AA focuses the scan on the actual compliance requirement.
