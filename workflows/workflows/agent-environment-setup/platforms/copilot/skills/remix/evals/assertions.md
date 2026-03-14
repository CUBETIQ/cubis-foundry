# Remix Eval Assertions

## Eval 1: Nested Route with Loaders and Error Boundaries

This eval tests the ability to design a Remix v2 blog platform with nested routing, server-side data loading, form-based mutations with progressive enhancement, and granular error boundaries.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `loader` — Server-side data fetching | Remix loaders run on the server before rendering, eliminating client-side fetch waterfalls. Without loaders, the initial HTML is empty, hurting SEO and perceived performance. |
| 2 | contains | `action` — Server-side form handling | Actions follow the POST/Redirect/GET pattern, preventing duplicate form submissions on refresh. Using client-side fetch for mutations bypasses Remix's built-in revalidation and progressive enhancement. |
| 3 | contains | `ErrorBoundary` — Granular error isolation | Remix renders the nearest ancestor ErrorBoundary when a loader or action throws. Without per-route error boundaries, a single failed data fetch crashes the entire page instead of just the affected section. |
| 4 | contains | `Form` — Progressive enhancement | Remix's `<Form>` component intercepts submissions for instant optimistic UI with JavaScript, but falls back to standard HTML form submission without it. Using `<form>` directly loses the Remix navigation integration. |
| 5 | contains | `blog.` — Flat file route conventions | Remix v2 uses dot-delimited flat file naming (blog.$slug.tsx) instead of v1 folder nesting. Wrong naming conventions produce route mismatches that silently render the wrong layout. |

### What a passing response looks like

- Route files: `app/routes/blog.tsx` (layout), `app/routes/blog._index.tsx` (post list), `app/routes/blog.$slug.tsx` (post detail), `app/routes/blog.$slug.edit.tsx` (edit form).
- Each route exports a `loader` that fetches data server-side and returns `json()`.
- The edit route exports an `action` that validates form data with Zod, saves to database, and returns `redirect()` on success or `json({ errors })` on validation failure.
- The edit form uses `<Form method="post">` with `useActionData()` to display validation errors.
- Each route exports an `ErrorBoundary` that renders a user-friendly error message with `useRouteError()`.
- The blog layout route renders an `<Outlet />` for child content alongside the category sidebar.

---

## Eval 2: Streaming Dashboard with Defer

This eval tests the ability to build a streaming Remix page that returns fast data immediately and streams slow data progressively, with proper loading states and error handling for deferred promises.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `defer` — Streaming data response | `defer()` allows the server to send the HTML shell with resolved data immediately while streaming deferred promises as they complete, eliminating the need to wait for the slowest data source before sending any HTML. |
| 2 | contains | `Await` — Deferred data rendering | The `<Await>` component resolves deferred promises in the component tree, integrating with Suspense for loading states. Without it, deferred data cannot be rendered after streaming. |
| 3 | contains | `Suspense` — Loading state boundary | `<Suspense>` wraps `<Await>` to provide a fallback UI (skeleton) that renders in the initial HTML while deferred promises are pending. Missing Suspense boundaries cause unhandled promise errors. |
| 4 | contains | `errorElement` — Deferred error handling | The `errorElement` prop on `<Await>` catches errors from deferred promises without propagating to the route ErrorBoundary, keeping the rest of the page functional when a single data source fails. |
| 5 | contains | `typeof loader` — Type inference from loader | Using `typeof loader` for type inference ensures component types stay synchronized with the actual loader return shape. Manual interfaces drift out of sync when the loader changes. |

### What a passing response looks like

- Loader returns `defer({ user: await getUserProfile(userId), analytics: getAnalytics(userId) })` where user is awaited (critical) and analytics is a bare promise (deferred).
- Component uses `useLoaderData<typeof loader>()` for type-safe data access.
- User profile section renders immediately in the HTML response.
- Analytics section is wrapped in `<Suspense fallback={<AnalyticsSkeleton />}>` with `<Await resolve={data.analytics} errorElement={<AnalyticsError />}>`.
- The `<Await>` render function receives the resolved analytics data and renders charts/metrics.
- `errorElement` renders a graceful fallback message when the analytics API fails.
- TypeScript types are inferred from the loader, not manually defined.
