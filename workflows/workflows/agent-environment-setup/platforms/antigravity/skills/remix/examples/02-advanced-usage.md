# Example: Streaming Dashboard with Defer, Fetchers, and Resource Routes

## Scenario

A team is building an analytics dashboard with Remix v2. The dashboard loads user profile data instantly from cache and streams slow analytics data from an external API. A sidebar widget uses `useFetcher` to bookmark reports without navigating away. A resource route serves CSV exports. The team needs to handle analytics API failures without breaking the profile section.

## Prompt

"Create a Remix v2 analytics dashboard at /dashboard. Load user profile (fast, cached) and analytics summary (slow, 2-3s external API) with streaming. Show a loading skeleton for analytics. Handle analytics API failure gracefully. Add a fetcher-powered bookmark button for reports. Create a resource route at /dashboard/export.csv that streams a CSV download. Include proper TypeScript types and cache headers."

## Expected Output

### Streaming Loader with Defer

```tsx
// app/routes/dashboard.tsx
import { defer, type LoaderFunctionArgs } from "@remix-run/node";
import {
  Await,
  useLoaderData,
  useFetcher,
  Link,
} from "@remix-run/react";
import { Suspense } from "react";
import { getUserProfile } from "~/models/user.server";
import { getAnalyticsSummary } from "~/models/analytics.server";
import { requireUserId } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Await critical data, defer slow data
  const user = await getUserProfile(userId);
  const analytics = getAnalyticsSummary(userId); // NOT awaited — deferred

  return defer(
    { user, analytics },
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    }
  );
}

export function headers() {
  return {
    "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
  };
}

export default function Dashboard() {
  const { user, analytics } = useLoaderData<typeof loader>();

  return (
    <div className="dashboard">
      {/* Critical: renders immediately in HTML */}
      <header>
        <h1>Welcome, {user.name}</h1>
        <p>{user.plan} plan — {user.projectCount} projects</p>
      </header>

      {/* Deferred: streams in after analytics API responds */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <Await resolve={analytics} errorElement={<AnalyticsError />}>
          {(data) => (
            <section className="analytics-grid">
              <StatCard label="Page Views" value={data.pageViews} />
              <StatCard label="Unique Visitors" value={data.uniqueVisitors} />
              <StatCard label="Bounce Rate" value={`${data.bounceRate}%`} />
              <StatCard label="Avg Session" value={`${data.avgSessionMinutes}m`} />
              <ReportList reports={data.topReports} />
            </section>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <section className="analytics-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="stat-card skeleton" aria-busy="true" />
      ))}
    </section>
  );
}

function AnalyticsError() {
  return (
    <section className="analytics-error">
      <p>Analytics data is temporarily unavailable. Your profile and projects are unaffected.</p>
      <Link to="." reloadDocument>
        Try again
      </Link>
    </section>
  );
}
```

### Fetcher-Powered Bookmark Button

```tsx
// app/components/BookmarkButton.tsx
import { useFetcher } from "@remix-run/react";

export function BookmarkButton({ reportId, isBookmarked }: {
  reportId: string;
  isBookmarked: boolean;
}) {
  const fetcher = useFetcher();

  // Optimistic UI: use the pending form data if a submission is in flight
  const optimisticBookmarked = fetcher.formData
    ? fetcher.formData.get("bookmarked") === "true"
    : isBookmarked;

  return (
    <fetcher.Form method="post" action="/dashboard/bookmark">
      <input type="hidden" name="reportId" value={reportId} />
      <input
        type="hidden"
        name="bookmarked"
        value={String(!optimisticBookmarked)}
      />
      <button
        type="submit"
        aria-label={optimisticBookmarked ? "Remove bookmark" : "Add bookmark"}
        disabled={fetcher.state === "submitting"}
      >
        {optimisticBookmarked ? "Bookmarked" : "Bookmark"}
      </button>
    </fetcher.Form>
  );
}
```

### Bookmark Action Route

```tsx
// app/routes/dashboard.bookmark.tsx
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/utils/auth.server";
import { toggleBookmark } from "~/models/bookmark.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const reportId = String(formData.get("reportId"));
  const bookmarked = formData.get("bookmarked") === "true";

  await toggleBookmark({ userId, reportId, bookmarked });
  return json({ ok: true });
}
```

### Resource Route for CSV Export

```tsx
// app/routes/dashboard.export[.csv].tsx
import { type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/utils/auth.server";
import { getAnalyticsExport } from "~/models/analytics.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const data = await getAnalyticsExport(userId);

  const csv = [
    "Date,Page Views,Unique Visitors,Bounce Rate",
    ...data.rows.map(
      (r) => `${r.date},${r.pageViews},${r.uniqueVisitors},${r.bounceRate}`
    ),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="analytics-export.csv"',
    },
  });
}
```

### Revalidation Control

```tsx
// app/routes/dashboard.tsx (additional export)
import type { ShouldRevalidateFunctionArgs } from "@remix-run/react";

export function shouldRevalidate({
  formAction,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  // Only revalidate the dashboard loader when a bookmark action completes
  // Skip revalidation for unrelated actions (e.g., logout, settings)
  if (formAction?.startsWith("/dashboard")) {
    return true;
  }
  return defaultShouldRevalidate;
}
```

## Key Decisions

- **`defer({ user, analytics })`** -- `user` is awaited (critical, renders in initial HTML), `analytics` is a bare promise (streamed after the external API responds). This sends the HTML shell in ~50ms instead of waiting 2-3s for the analytics API.
- **`errorElement` on `<Await>`** -- analytics failures are caught by the Await's errorElement, not the route ErrorBoundary. The user profile and navigation remain functional.
- **`useFetcher` for bookmarks** -- submits to `/dashboard/bookmark` without navigating away from the dashboard. The fetcher tracks submission state independently, enabling optimistic UI from `fetcher.formData`.
- **Resource route with `[.csv]` escape** -- the brackets escape the dot in `export.csv`, making the file path `dashboard.export[.csv].tsx` which maps to the URL `/dashboard/export.csv`.
- **`shouldRevalidate`** -- prevents re-fetching the slow analytics data when unrelated actions complete, reducing unnecessary server load.
- **`stale-while-revalidate` cache headers** -- the dashboard serves stale content for up to 5 minutes while revalidating in the background, reducing origin server load for repeat visits.
