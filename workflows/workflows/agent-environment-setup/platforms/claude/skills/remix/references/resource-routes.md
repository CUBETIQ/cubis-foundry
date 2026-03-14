# Resource Routes

Load this when implementing API endpoints, webhooks, file downloads, image generation, RSS feeds, sitemaps, or any route that returns non-HTML responses.

## What Are Resource Routes?

A resource route is a route module that exports a `loader` or `action` but no `default` component. It serves raw responses (JSON, CSV, XML, binary) at a URL without rendering HTML.

Resource routes share the same file naming, authentication, session handling, and deployment infrastructure as UI routes.

## Common Resource Route Patterns

### JSON API Endpoint

```tsx
// app/routes/api.posts.tsx — GET /api/posts
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireApiKey } from "~/utils/auth.server";
import { getPosts } from "~/models/post.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireApiKey(request);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  const { posts, total } = await getPosts({ page, limit });

  return json(
    { data: posts, meta: { page, limit, total } },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    }
  );
}
```

### CSV File Download

```tsx
// app/routes/reports.export[.csv].tsx — GET /reports/export.csv
import type { LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/utils/auth.server";
import { getReportData } from "~/models/report.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const data = await getReportData(userId);

  const csv = [
    "Date,Revenue,Orders",
    ...data.map((row) => `${row.date},${row.revenue},${row.orders}`),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="report.csv"',
    },
  });
}
```

The bracket escape `[.csv]` in the filename makes the route URL `/reports/export.csv` instead of treating the dot as a route separator.

### Webhook Receiver

```tsx
// app/routes/webhooks.stripe.tsx — POST /webhooks/stripe
import type { ActionFunctionArgs } from "@remix-run/node";
import Stripe from "stripe";
import { handleStripeEvent } from "~/services/stripe.server";

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  await handleStripeEvent(event);
  return new Response("OK", { status: 200 });
}
```

### RSS Feed

```tsx
// app/routes/rss[.]xml.tsx — GET /rss.xml
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getRecentPosts } from "~/models/post.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const posts = await getRecentPosts(20);
  const baseUrl = new URL(request.url).origin;

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <link>${baseUrl}</link>
    <description>Latest blog posts</description>
    ${posts
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

### Health Check

```tsx
// app/routes/api.healthcheck.tsx — GET /api/healthcheck
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";

export async function loader() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return json({ status: "ok", database: "connected" });
  } catch {
    return json(
      { status: "error", database: "disconnected" },
      { status: 503 }
    );
  }
}
```

## Key Considerations

- **No default export** -- if you accidentally add a default component export, the route becomes a UI route and Remix renders HTML with the component.
- **Same auth patterns** -- resource routes have access to `request.headers`, cookies, and sessions. Use the same authentication helpers as UI routes.
- **Caching** -- resource routes benefit from `Cache-Control` headers because they often serve static-ish data (feeds, reports, images).
- **CORS** -- if the resource route serves a cross-origin API, add CORS headers in the loader response and handle `OPTIONS` preflight in a separate `action` or `loader` check.
- **Rate limiting** -- resource routes exposed as APIs should include rate limiting because they are more likely to be called programmatically.
