# Accessibility Testing

Load this reference when running a11y audits, configuring axe-core rules, or interpreting violation reports.

## axe-core + Playwright Setup

Install the integration package:

```bash
npm install -D @axe-core/playwright
```

Basic scan pattern:

```typescript
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

test('page is accessible', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

## Compliance Levels

| Standard | axe-core tags | Coverage |
| --- | --- | --- |
| WCAG 2.0 Level A | `wcag2a` | 25 success criteria — minimum baseline |
| WCAG 2.0 Level AA | `wcag2a`, `wcag2aa` | 38 success criteria — industry standard |
| WCAG 2.1 Level AA | `wcag2a`, `wcag2aa`, `wcag21aa` | 50 success criteria — recommended |
| WCAG 2.2 Level AA | `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` | 55 success criteria — latest |
| Section 508 | `section508` | US federal compliance |
| Best practices | `best-practice` | Non-normative, advisory |

Choose the tags that match your compliance requirement. Do not use `best-practice` in CI gating — it produces noise that masks real violations.

## Scanning Dynamic States

A common mistake is scanning only the initial page load. Interactive applications produce different DOM structures as users interact. Scan every state:

```typescript
test.describe('Form Accessibility', () => {
  test('empty form', async ({ page }) => {
    await page.goto('/register');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('validation error state', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Submit' }).click();
    // Now error messages are visible — scan this state
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('modal dialog open', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: 'Terms of Service' }).click();
    await page.waitForSelector('[role="dialog"]');
    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
```

## Scope Control

### Include — scan only part of the page

```typescript
const results = await new AxeBuilder({ page })
  .include('#main-content')
  .withTags(['wcag2a', 'wcag2aa'])
  .analyze();
```

### Exclude — skip elements you cannot fix

```typescript
const results = await new AxeBuilder({ page })
  .exclude('#third-party-widget')  // Tracked: JIRA-456
  .exclude('.legacy-banner')       // Tracked: JIRA-789
  .withTags(['wcag2a', 'wcag2aa'])
  .analyze();
```

Every exclusion must have a tracking issue. Untracked exclusions silently hide violations.

## Violation Impact Levels

axe-core categorizes violations by user impact:

| Impact | Description | CI action |
| --- | --- | --- |
| `critical` | Users with disabilities cannot use the feature at all | Fail build |
| `serious` | Users with disabilities face significant difficulty | Fail build |
| `moderate` | Users face some difficulty but can work around it | Warn |
| `minor` | Minor inconvenience, low impact | Warn |

### Impact-based CI gating

```typescript
test('no critical or serious violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );

  expect(blocking).toEqual([]);
});
```

## Common Violations Reference

### color-contrast (serious)

**Rule**: Text must have sufficient contrast ratio against its background.
**WCAG**: 1.4.3 Contrast (Minimum) — AA requires 4.5:1 for normal text, 3:1 for large text.
**Fix**: Adjust text color or background color. Use a contrast checker tool.

### image-alt (critical)

**Rule**: Images must have alternative text.
**Fix**: Add `alt="description"` for informational images. Add `alt=""` for decorative images. Add `role="presentation"` for purely decorative images.

### label (critical)

**Rule**: Form inputs must have programmatically associated labels.
**Fix**: Use `<label for="input-id">` or `aria-label` or `aria-labelledby`.

### button-name (critical)

**Rule**: Buttons must have discernible text.
**Fix**: Add text content, `aria-label`, or `aria-labelledby`. Icon-only buttons need `aria-label`.

### link-name (serious)

**Rule**: Links must have discernible text.
**Fix**: Add link text. Avoid "click here" — use descriptive text that explains the destination.

### heading-order (moderate)

**Rule**: Heading levels should not skip (e.g., h1 to h3).
**Fix**: Use sequential heading levels. h1 > h2 > h3, not h1 > h3.

### aria-required-attr (critical)

**Rule**: Elements with ARIA roles must have required ARIA attributes.
**Fix**: Add missing attributes (e.g., `role="checkbox"` requires `aria-checked`).

## Structured Report Template

```markdown
## Accessibility Scan Report

**Page**: [URL or route]
**State**: [description of UI state when scanned]
**Standard**: WCAG 2.1 AA
**Date**: [scan date]

### Summary
- Total violations: [count]
- Critical: [count]
- Serious: [count]
- Moderate: [count]
- Minor: [count]
- Passes: [count]
- Incomplete (manual review needed): [count]

### Violations

| # | Rule | Impact | Element | Description | How to fix |
|---|------|--------|---------|-------------|------------|
| 1 | color-contrast | serious | `<p class="muted">` | Foreground #999 on background #fff has contrast 2.85:1 | Darken to #595959 for 7:1 |

### Incomplete Checks (Manual Review)

| Rule | Element | What to verify |
|------|---------|----------------|
| color-contrast | `.theme-dynamic` | Verify contrast after theme loads |
```

## Integration with CI

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'a11y-results.json' }],
  ],
});
```

Publish the HTML report as a CI artifact so reviewers can inspect violations without running the suite locally.

## Keyboard Navigation Testing

axe-core does not fully test keyboard navigation. Supplement automated scans with these manual-automatable checks:

```typescript
test('tab order is logical', async ({ page }) => {
  await page.goto('/');

  // Tab through interactive elements and verify order
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Home' })).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Products' })).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Cart' })).toBeFocused();
});

test('escape closes modal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  // Focus should return to the trigger button
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
});
```
