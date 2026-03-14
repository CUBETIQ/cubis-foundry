# Next.js 15 Routing Reference

## Overview

The Next.js App Router uses file-system-based routing within the `app/` directory. Every folder represents a route segment, and special files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`) define the UI for each segment.

## Route File Conventions

| File | Purpose |
|------|---------|
| `page.tsx` | Page UI -- makes the route publicly accessible |
| `layout.tsx` | Shared layout that wraps child segments (preserves state across navigations) |
| `template.tsx` | Like layout but re-mounts on every navigation (resets state) |
| `loading.tsx` | Suspense fallback for the segment |
| `error.tsx` | Error boundary for the segment (must be `'use client'`) |
| `not-found.tsx` | UI for `notFound()` calls within the segment |
| `route.ts` | API endpoint (GET, POST, PUT, DELETE) -- cannot coexist with `page.tsx` |
| `default.tsx` | Fallback for parallel route slots when no matching segment exists |

## Dynamic Routes

### Single Parameter

```
app/blog/[slug]/page.tsx  ->  /blog/hello-world
```

```tsx
type Props = { params: Promise<{ slug: string }> };

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  // ...
}
```

### Multiple Parameters

```
app/[org]/[repo]/page.tsx  ->  /vercel/next.js
```

### Catch-All

```
app/docs/[...segments]/page.tsx  ->  /docs/a/b/c
```

`params.segments` is `['a', 'b', 'c']`.

### Optional Catch-All

```
app/docs/[[...segments]]/page.tsx  ->  /docs or /docs/a/b
```

Matches the root and all sub-paths.

## Route Groups

Parenthesized folders organize routes without affecting the URL path.

```
app/
  (marketing)/
    about/page.tsx        ->  /about
    pricing/page.tsx      ->  /pricing
    layout.tsx            ->  shared marketing layout
  (app)/
    dashboard/page.tsx    ->  /dashboard
    settings/page.tsx     ->  /settings
    layout.tsx            ->  shared app layout (with sidebar)
```

## Parallel Routes

Parallel routes render multiple pages simultaneously in the same layout using named slots.

```
app/
  @analytics/
    page.tsx              ->  analytics slot
    loading.tsx
  @team/
    page.tsx              ->  team slot
  layout.tsx              ->  renders both slots
  page.tsx                ->  main content
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="grid grid-cols-2 gap-4">
        {analytics}
        {team}
      </div>
    </div>
  );
}
```

### Default Fallback

When navigating to a sub-route that doesn't have a matching slot segment, Next.js renders `default.tsx` if present, or a 404 if not.

```tsx
// app/@analytics/default.tsx
export default function AnalyticsDefault() {
  return null; // Render nothing when no matching sub-route
}
```

## Intercepting Routes

Intercept routes to show a different UI (like a modal) while preserving the URL.

| Convention | Matches |
|------------|---------|
| `(.)segment` | Same level |
| `(..)segment` | One level up |
| `(..)(..)segment` | Two levels up |
| `(...)segment` | Root level |

### Photo Modal Example

```
app/
  @modal/
    (.)photos/[id]/
      page.tsx            ->  Modal view (intercepted)
    default.tsx
  photos/[id]/
    page.tsx              ->  Full page view (direct navigation)
  layout.tsx
```

```tsx
// app/@modal/(.)photos/[id]/page.tsx
export default async function PhotoModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <dialog open className="modal">
      <img src={`/photos/${id}.jpg`} alt="" />
    </dialog>
  );
}
```

## Middleware

```typescript
// middleware.ts (project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Authentication check
  const token = request.cookies.get('session');
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Add custom headers
  const response = NextResponse.next();
  response.headers.set('x-request-id', crypto.randomUUID());
  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Middleware Capabilities

- Read and set cookies
- Read and set headers
- Redirect or rewrite requests
- Return responses directly (for API-style middleware)
- Access geolocation and IP data (on Vercel Edge)

### Middleware Limitations

- Cannot access the request body (streaming constraint)
- Cannot use Node.js APIs (runs on Edge Runtime)
- Cannot modify the response body
- Runs on every matched request (keep it fast)

## Route Handlers (API Routes)

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get('page') ?? '1');

  const posts = await db.posts.findMany({ skip: (page - 1) * 10, take: 10 });
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const post = await db.posts.create(body);
  return NextResponse.json(post, { status: 201 });
}
```

### Dynamic Route Handlers

```typescript
// app/api/posts/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await db.posts.findById(id);
  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(post);
}
```

## Common Pitfalls

1. **Placing `route.ts` and `page.tsx` in the same folder** -- They conflict; a segment can be a page or an API endpoint, not both
2. **Missing `default.tsx` for parallel slots** -- Without it, navigating to a sub-route that doesn't match the slot causes a 404
3. **Forgetting `await params`** -- In Next.js 15, `params` is a Promise that must be awaited
4. **Middleware running on static files** -- Use the `matcher` config to exclude `_next/static`, `_next/image`, and `favicon.ico`
