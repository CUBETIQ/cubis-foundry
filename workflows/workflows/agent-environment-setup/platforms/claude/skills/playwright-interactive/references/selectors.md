# Selectors

Load this reference when choosing locator strategies or reviewing selector quality in Playwright tests.

## Selector Priority Order

Use this priority order for every locator decision. Higher priority selectors are more resilient to UI changes and more accessible.

| Priority | Selector type | Playwright API | When to use |
| --- | --- | --- | --- |
| 1 (best) | Role | `getByRole('button', { name: 'Submit' })` | Buttons, links, headings, inputs with labels |
| 2 | Label | `getByLabel('Email address')` | Form inputs with associated labels |
| 3 | Placeholder | `getByPlaceholder('Search...')` | Inputs when label is not visible |
| 4 | Text | `getByText('Welcome back')` | Static text content, messages |
| 5 | Test ID | `getByTestId('checkout-form')` | Complex components without semantic selectors |
| 6 (last resort) | CSS/XPath | `locator('.btn-primary')` | Never use unless no alternative exists |

## Role-Based Selectors Deep Dive

ARIA roles map to how users and assistive technologies perceive elements. Playwright's `getByRole` understands implicit roles.

### Common implicit roles

```typescript
// <button> has implicit role "button"
page.getByRole('button', { name: 'Save' });

// <a href="..."> has implicit role "link"
page.getByRole('link', { name: 'Home' });

// <h1> has implicit role "heading", level 1
page.getByRole('heading', { name: 'Dashboard', level: 1 });

// <input type="checkbox"> has implicit role "checkbox"
page.getByRole('checkbox', { name: 'Accept terms' });

// <select> has implicit role "combobox"
page.getByRole('combobox', { name: 'Country' });

// <nav> has implicit role "navigation"
page.getByRole('navigation');

// <table> has implicit role "table"
page.getByRole('table');
```

### Filtering options

`getByRole` supports several filters to narrow matches:

```typescript
// By accessible name (most common)
page.getByRole('button', { name: 'Submit' });

// By exact match (default is substring)
page.getByRole('button', { name: 'Submit', exact: true });

// By regex
page.getByRole('heading', { name: /welcome/i });

// By checked state
page.getByRole('checkbox', { checked: true });

// By expanded state
page.getByRole('button', { expanded: true });

// By disabled state
page.getByRole('button', { disabled: true });

// By heading level
page.getByRole('heading', { level: 2 });
```

## Test ID Strategy

Use `data-testid` attributes when semantic selectors are insufficient.

### When test IDs are appropriate

- Complex composite components (card, widget, dashboard panel)
- Elements rendered by third-party libraries without good ARIA
- Containers used for scoping (find button inside a specific section)
- Dynamic lists where text content is not unique

### Naming conventions

```html
<!-- Feature-component pattern -->
<div data-testid="checkout-summary">
<div data-testid="cart-item-row">
<button data-testid="remove-item-42">

<!-- Avoid generic names -->
<div data-testid="container">   <!-- bad: not descriptive -->
<div data-testid="div-1">       <!-- bad: meaningless -->
```

### Configure custom test ID attribute

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    testIdAttribute: 'data-testid', // default
    // or: 'data-cy', 'data-qa', etc.
  },
});
```

## Chaining and Scoping

Narrow selectors by chaining locators to reduce ambiguity:

```typescript
// Find "Delete" button inside a specific row
const row = page.getByRole('row', { name: /Project Alpha/ });
await row.getByRole('button', { name: 'Delete' }).click();

// Find input inside a specific form section
const shipping = page.locator('[data-testid="shipping-section"]');
await shipping.getByLabel('City').fill('Portland');
```

## Selector Anti-Patterns

| Anti-pattern | Problem | Fix |
| --- | --- | --- |
| `.btn-primary` | Breaks on CSS refactor | `getByRole('button', { name: '...' })` |
| `#submit-btn` | IDs change, not semantic | `getByRole('button', { name: 'Submit' })` |
| `nth(0)` without context | Fragile to DOM order changes | Scope with parent locator first |
| `xpath=//div[3]/span[2]` | Completely unreadable, extremely brittle | Any semantic selector |
| Text selector for dynamic content | Changes with locale or data | `getByTestId` with stable ID |

## Debugging Selectors

Use the Playwright Inspector to validate selectors interactively:

```bash
# Open inspector
npx playwright test --debug

# Generate selectors with codegen
npx playwright codegen https://example.com
```

Inside tests, use `locator.highlight()` during development:

```typescript
// Temporarily highlight an element to verify the selector
await page.getByRole('button', { name: 'Submit' }).highlight();
```

## Performance Considerations

- Role-based selectors evaluate the accessibility tree, which is fast but not free. Avoid calling `getByRole` in tight loops.
- `locator()` calls are lazy — they do not query the DOM until an action or assertion uses them. Creating many locators is cheap.
- Prefer `getByRole` with `{ exact: true }` when the accessible name is known exactly — it avoids substring scanning.
