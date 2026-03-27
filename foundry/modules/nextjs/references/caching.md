# Next.js 15 Caching Reference

## Overview

Next.js 15 has a multi-layer caching architecture. Unlike Next.js 14, **caching is opt-in by default** in Next.js 15. Understanding each layer is critical for building fast applications without serving stale data.

## The Four Cache Layers

| Layer | What | Where | Duration | Opt In |
|-------|------|-------|----------|--------|
| Request Memoization | Deduplicates identical `fetch` calls in a single render | Server | Per-request (single render pass) | Automatic for `fetch` |
| Data Cache | Caches `fetch` responses across requests and deployments | Server | Persistent until revalidated | `next: { revalidate }` or `cache: 'force-cache'` |
| Full Route Cache | Caches rendered HTML and RSC payload for static routes | Server | Persistent until revalidated | `export const dynamic = 'force-static'` or no dynamic functions |
| Router Cache | Caches RSC payload in the browser for client-side navigation | Client | Session-based, 30s for dynamic / 5min for static | Automatic |

## Request Memoization

Deduplicates identical `fetch` calls within a single server render. No configuration needed.

```tsx
// Both calls produce ONE network request
async function Header() {
  const data = await fetch('https://api.example.com/config');
  // ...
}

async function Footer() {
  const data = await fetch('https://api.example.com/config'); // Deduplicated
  // ...
}
```

For non-fetch functions, use React's `cache()`:

```typescript
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  const user = await db.users.findById(id);
  return user;
});
```

## Data Cache

Caches individual `fetch` responses. **Not enabled by default in Next.js 15.**

### Enabling Caching

```typescript
// Cache indefinitely (until manually revalidated)
const data = await fetch('https://api.example.com/posts', {
  cache: 'force-cache',
});

// Cache for 60 seconds (time-based revalidation)
const data = await fetch('https://api.example.com/posts', {
  next: { revalidate: 60 },
});

// Add tags for on-demand revalidation
const data = await fetch('https://api.example.com/posts', {
  next: { revalidate: 3600, tags: ['posts'] },
});
```

### No Caching (Default)

```typescript
// Default behavior in Next.js 15 -- not cached
const data = await fetch('https://api.example.com/posts');

// Explicit no-cache
const data = await fetch('https://api.example.com/posts', {
  cache: 'no-store',
});
```

### Segment-Level Configuration

```typescript
// app/blog/layout.tsx
export const revalidate = 3600; // All fetches in this segment revalidate every hour
export const dynamic = 'force-dynamic'; // Opt out of all caching for this segment
```

## Full Route Cache

Caches the complete rendered output (HTML + RSC payload) for static routes.

### Static Routes (Cached)

```typescript
// app/about/page.tsx
// No dynamic functions -> fully static -> cached at build time
export default function AboutPage() {
  return <h1>About Us</h1>;
}
```

### Dynamic Routes (Not Cached)

Routes that use dynamic functions are not cached:

```typescript
// Using cookies(), headers(), searchParams, or unstable_noStore()
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const session = (await cookies()).get('session'); // Dynamic function -> no Full Route Cache
  // ...
}
```

### Forcing Static

```typescript
export const dynamic = 'force-static'; // Cache even if dynamic functions are present
export const revalidate = 3600;         // Revalidate cached page every hour
```

## Router Cache (Client-Side)

Caches RSC payloads in the browser for instant client-side navigation.

### Behavior

- **Static routes**: Cached for 5 minutes
- **Dynamic routes**: Cached for 30 seconds
- **Prefetched routes** (via `<Link>`): Cached on hover/viewport entry

### Invalidating the Router Cache

```typescript
// In a Server Action
'use server';
import { revalidatePath } from 'next/cache';

export async function updateData() {
  // This invalidates both the Data Cache and Router Cache for this path
  revalidatePath('/dashboard');
}
```

```typescript
// From a Client Component
import { useRouter } from 'next/navigation';

function RefreshButton() {
  const router = useRouter();
  return <button onClick={() => router.refresh()}>Refresh</button>;
}
```

## On-Demand Revalidation

### revalidatePath

```typescript
import { revalidatePath } from 'next/cache';

revalidatePath('/blog');              // Revalidate specific page
revalidatePath('/blog', 'layout');    // Revalidate page and all children
revalidatePath('/blog/[slug]', 'page'); // Revalidate all matching dynamic pages
revalidatePath('/', 'layout');        // Revalidate entire site
```

### revalidateTag

```typescript
import { revalidateTag } from 'next/cache';

// Revalidate all fetches tagged with 'posts'
revalidateTag('posts');
```

## Caching Decision Tree

1. **Is the data public and the same for all users?**
   - Yes -> `cache: 'force-cache'` with `revalidate` interval
   - No -> Continue

2. **Is the data per-user but changes infrequently?**
   - Yes -> `next: { revalidate: 300, tags: ['user-{id}'] }` with on-demand revalidation
   - No -> Continue

3. **Is the data real-time or highly personalized?**
   - Yes -> No caching (`cache: 'no-store'` or use `cookies()`/`headers()`)

## Common Pitfalls

1. **Assuming fetch is cached by default** -- Next.js 15 changed this from 14; all fetches are uncached unless you opt in
2. **Not tagging fetches** -- Without tags, the only revalidation option is `revalidatePath`, which is coarser than needed
3. **Revalidating too broadly** -- `revalidatePath('/', 'layout')` clears everything; prefer tag-based revalidation
4. **Forgetting the Router Cache** -- Even after server revalidation, the browser may serve a stale RSC payload for up to 30 seconds
5. **Mixing ORM calls without `cache()`** -- Only `fetch` gets automatic deduplication; ORM/SDK calls need React `cache()` wrapper
