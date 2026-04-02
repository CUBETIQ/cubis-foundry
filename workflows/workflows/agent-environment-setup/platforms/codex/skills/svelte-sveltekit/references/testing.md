# Svelte 5 + SvelteKit Testing Reference

## Setup

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
export default defineConfig({
  plugins: [sveltekit()],
  test: { include: ['src/**/*.{test,spec}.ts'], environment: 'jsdom', globals: true }
});
```

```bash
npm install -D vitest @testing-library/svelte @testing-library/jest-dom jsdom @playwright/test
```

## Component Testing (Vitest + Testing Library)

```typescript
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import Counter from './Counter.svelte';

it('increments on click', async () => {
  render(Counter, { props: { initial: 0 } });
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Increment' }));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### Testing $state Reactivity

```typescript
import { tick } from 'svelte';

it('adds a new todo', async () => {
  render(TodoList);
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('New todo'), 'Buy groceries');
  await user.click(screen.getByRole('button', { name: 'Add' }));
  await tick();
  expect(screen.getByText('Buy groceries')).toBeInTheDocument();
});
```

### Testing Callback Props

```typescript
it('calls onDelete', async () => {
  const onDelete = vi.fn();
  render(TodoItem, { props: { todo: mockTodo, onDelete } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Delete' }));
  expect(onDelete).toHaveBeenCalledWith(mockTodo.id);
});
```

## Testing Load Functions

```typescript
it('returns post data for valid slug', async () => {
  const result = await load({
    params: { slug: 'hello-world' },
    fetch: vi.fn().mockResolvedValue(new Response(JSON.stringify({ title: 'Hello' })))
  } as any);
  expect(result.post.title).toBe('Hello');
});
```

## Testing Form Actions

```typescript
function createFormData(data: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.set(k, v);
  return fd;
}

it('returns errors for empty fields', async () => {
  const result = await actions.default({
    request: new Request('http://localhost', { method: 'POST', body: createFormData({}) })
  } as any);
  expect(result?.status).toBe(400);
});
```

## E2E Testing (Playwright)

```typescript
// playwright.config.ts
export default defineConfig({
  webServer: { command: 'npm run build && npm run preview', port: 4173 },
  testDir: 'tests', testMatch: '**/*.e2e.ts',
  use: { baseURL: 'http://localhost:4173' }
});
```

```typescript
test('submits contact form', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Name').fill('Alice');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Message sent')).toBeVisible();
});
```

### Testing Without JavaScript (Progressive Enhancement)

```typescript
test('form works without JS', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/contact');
  await page.getByLabel('Name').fill('Alice');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page).toHaveURL('/contact/success');
});
```

## Common Pitfalls

1. **Missing `await tick()`** -- Svelte 5 updates DOM asynchronously; use `tick()` or `waitFor`
2. **Testing implementation details** -- query by role/label/text, not class names
3. **Shared test state** -- each test should render its own component instance
4. **SSR in tests** -- use `environment: 'jsdom'`; server-only code needs separate tests
