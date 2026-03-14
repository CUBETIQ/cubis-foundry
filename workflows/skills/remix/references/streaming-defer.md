# Streaming with Defer

Load this when implementing `defer`, `Await`, `Suspense`, streaming SSR, or handling slow data sources without blocking TTFB.

## How Streaming Works in Remix

When a loader returns `defer()`, Remix sends the initial HTML immediately with resolved data inline and `<script>` placeholders for deferred promises. As deferred promises resolve on the server, Remix streams HTML chunks that replace the placeholders. The browser progressively renders content without a full page reload.

## Basic Defer Pattern

```tsx
import { defer, type LoaderFunctionArgs } from "@remix-run/node";
import { Await, useLoaderData } from "@remix-run/react";
import { Suspense } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Critical data: await it (included in initial HTML)
  const user = await getUser(userId);

  // Non-critical data: do NOT await (streamed later)
  const recommendations = getRecommendations(userId); // Returns a Promise
  const activityFeed = getActivityFeed(userId);        // Returns a Promise

  return defer({ user, recommendations, activityFeed });
}

export default function Dashboard() {
  const { user, recommendations, activityFeed } = useLoaderData<typeof loader>();

  return (
    <div>
      {/* Renders immediately — user is already resolved */}
      <h1>Hello, {user.name}</h1>

      {/* Streams in when recommendations resolve */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Await resolve={recommendations} errorElement={<ErrorFallback />}>
          {(data) => <RecommendationsList items={data} />}
        </Await>
      </Suspense>

      {/* Streams in when activity feed resolves */}
      <Suspense fallback={<ActivitySkeleton />}>
        <Await resolve={activityFeed} errorElement={<ErrorFallback />}>
          {(data) => <ActivityFeed items={data} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

## Rules for Defer

1. **Await critical data, defer non-critical data** -- Only defer data that is not needed for the initial meaningful render. The user should see useful content immediately.

2. **Every `<Await>` must be inside a `<Suspense>`** -- Suspense provides the fallback UI while the promise is pending. Missing Suspense causes an unhandled error.

3. **Use `errorElement` for per-promise error handling** -- Without errorElement, a rejected promise propagates to the route ErrorBoundary, potentially breaking the entire page.

4. **Deferred data is not available on the initial server render** -- The Suspense fallback is what renders in the initial HTML. The resolved content arrives via streaming chunks.

5. **Defer only works with streaming-capable runtimes** -- Node.js, Deno, and Cloudflare Workers support streaming. Some hosting platforms buffer the response and negate the benefit.

## Error Handling with Await

```tsx
<Suspense fallback={<Skeleton />}>
  <Await
    resolve={analytics}
    errorElement={<AnalyticsUnavailable />}
  >
    {(data) => <AnalyticsChart data={data} />}
  </Await>
</Suspense>
```

The `errorElement` renders when the deferred promise rejects. It receives the error via `useAsyncError()`:

```tsx
import { useAsyncError } from "@remix-run/react";

function AnalyticsUnavailable() {
  const error = useAsyncError();
  console.error("Analytics failed:", error);

  return (
    <div className="error-panel">
      <p>Analytics are temporarily unavailable.</p>
      <a href="." reloadDocument>Retry</a>
    </div>
  );
}
```

## Type Safety with Defer

```tsx
// TypeScript infers the deferred types correctly
export async function loader() {
  const user = await getUser();           // Resolved: User
  const stats = getStats();               // Deferred: Promise<Stats>

  return defer({ user, stats });
}

// In the component:
const { user, stats } = useLoaderData<typeof loader>();
// user: User (resolved value)
// stats: Promise<Stats> (must use <Await> to resolve)
```

## Streaming Response Headers

When using `defer`, set response headers in the defer call:

```tsx
return defer(
  { user, analytics },
  {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Custom-Header": "value",
    },
  }
);
```

Streaming responses cannot use `headers()` export for Content-Type because the response has already started.

## When NOT to Defer

- Data required for the page title, meta tags, or SEO content -- search engines may not execute streamed JavaScript.
- Data that determines the layout or routing -- deferred data is not available during SSR, so layout-dependent data must be awaited.
- Authentication checks -- always await auth checks to prevent rendering protected content in the initial HTML.
- Data that takes less than 50ms -- the overhead of streaming setup negates the benefit for fast data sources.
