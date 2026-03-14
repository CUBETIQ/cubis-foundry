# Network Interception

Load this reference when mocking API responses, asserting on network traffic, or testing error handling in Playwright.

## Route Interception Basics

Playwright's `page.route()` intercepts network requests matching a URL pattern and lets you fulfill, abort, or modify them.

```typescript
// Fulfill with mock data
await page.route('**/api/users', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'Alice' }]),
  })
);

// Abort a request (simulate network failure)
await page.route('**/api/analytics', (route) => route.abort());

// Continue with modifications (add header)
await page.route('**/api/**', (route) =>
  route.continue({
    headers: { ...route.request().headers(), 'X-Test': 'true' },
  })
);
```

## URL Pattern Matching

| Pattern | Matches | Example |
| --- | --- | --- |
| `**/api/users` | Any URL ending in `/api/users` | `https://app.com/api/users` |
| `**/api/users/**` | Any URL with `/api/users/` in path | `https://app.com/api/users/42/profile` |
| `https://api.example.com/**` | Specific origin | `https://api.example.com/v2/data` |
| `**/*.png` | All PNG images | `https://cdn.com/logo.png` |

For complex matching, use a function predicate:

```typescript
await page.route(
  (url) => url.pathname.startsWith('/api/') && url.searchParams.has('format'),
  (route) => route.fulfill({ body: '{"data": []}' })
);
```

## Mock Response Patterns

### Static mock

Best for simple, deterministic responses:

```typescript
await page.route('**/api/products', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      products: [
        { id: 1, name: 'Widget', price: 9.99 },
        { id: 2, name: 'Gadget', price: 19.99 },
      ],
    }),
  })
);
```

### Dynamic mock based on request

Useful when the response depends on request parameters:

```typescript
await page.route('**/api/products/*', (route) => {
  const id = route.request().url().split('/').pop();
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ id: Number(id), name: `Product ${id}` }),
  });
});
```

### Sequential responses

Simulate state changes across multiple calls:

```typescript
let callCount = 0;
await page.route('**/api/status', (route) => {
  callCount++;
  const status = callCount === 1 ? 'pending' : 'complete';
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status }),
  });
});
```

### Error simulation

Test how the UI handles failures:

```typescript
// HTTP error
await page.route('**/api/orders', (route) =>
  route.fulfill({ status: 500, body: 'Internal Server Error' })
);

// Network error
await page.route('**/api/orders', (route) => route.abort('connectionrefused'));

// Timeout simulation
await page.route('**/api/orders', async (route) => {
  await new Promise((r) => setTimeout(r, 30000));
  route.fulfill({ status: 200 });
});
```

## Request Assertion Patterns

### Wait for a specific request

```typescript
const [request] = await Promise.all([
  page.waitForRequest('**/api/orders'),
  page.getByRole('button', { name: 'Place Order' }).click(),
]);

expect(request.method()).toBe('POST');
const body = request.postDataJSON();
expect(body.items).toHaveLength(3);
```

### Wait for a specific response

```typescript
const [response] = await Promise.all([
  page.waitForResponse('**/api/orders'),
  page.getByRole('button', { name: 'Place Order' }).click(),
]);

expect(response.status()).toBe(201);
const data = await response.json();
expect(data.orderId).toBeDefined();
```

### Assert no request was made

Verify that an optimization (caching, debouncing) prevents unnecessary requests:

```typescript
const requests: string[] = [];
await page.route('**/api/search**', (route) => {
  requests.push(route.request().url());
  route.fulfill({ body: '[]' });
});

// Type quickly — debounce should prevent intermediate requests
await page.getByPlaceholder('Search').pressSequentially('playwright', { delay: 50 });
await page.waitForTimeout(500); // wait for debounce to fire

// Should have made 1 request, not 10
expect(requests.length).toBe(1);
```

## HAR Recording and Playback

Record real network traffic and replay it in tests for high-fidelity mocking:

```typescript
// Record HAR during test development
await page.routeFromHAR('tests/fixtures/api.har', {
  url: '**/api/**',
  update: true, // record mode
});

// Playback HAR in CI
await page.routeFromHAR('tests/fixtures/api.har', {
  url: '**/api/**',
  update: false, // playback mode
});
```

## WebSocket Interception

Mock WebSocket connections for real-time features:

```typescript
// Note: Playwright does not natively intercept WebSockets.
// Use a test server or service worker approach:

// Option 1: Start a mock WebSocket server
// Option 2: Inject a mock via page.addInitScript
await page.addInitScript(() => {
  class MockWebSocket {
    onmessage: ((event: MessageEvent) => void) | null = null;
    send(data: string) {
      // Echo back or simulate server response
      setTimeout(() => {
        this.onmessage?.(new MessageEvent('message', { data: '{"ack": true}' }));
      }, 10);
    }
    close() {}
  }
  (window as any).WebSocket = MockWebSocket;
});
```

## Scope and Cleanup

Routes are scoped to the page or context they are registered on. They persist until the page closes or you explicitly unroute:

```typescript
// Register
await page.route('**/api/data', handler);

// Unregister
await page.unroute('**/api/data', handler);

// Or unregister all routes for a pattern
await page.unroute('**/api/data');
```

For `browserContext.route()`, the mock applies to all pages in that context — useful for auth tokens or shared API mocking.

## Best Practices

1. **Mock at the network layer, not the code layer** — `page.route()` intercepts HTTP regardless of how the app makes the request (fetch, XMLHttpRequest, form submit).
2. **Use typed mock data** — Define TypeScript interfaces for your mock responses to catch schema drift at compile time.
3. **Keep mock data minimal** — Return only the fields the test needs. Over-complete mocks hide bugs where the UI accesses fields that do not exist in production.
4. **Version your HAR files** — When API schemas change, re-record the HAR rather than hand-editing it.
5. **Test error states first** — Apps handle the happy path naturally. Error handling is where bugs hide.
