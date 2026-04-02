# SvelteKit Routing Reference

## Route File Conventions

| File | Purpose |
|------|---------|
| `+page.svelte` | Page component (renders UI) |
| `+page.ts` | Universal load function (runs server + client) |
| `+page.server.ts` | Server-only load function and form actions |
| `+layout.svelte` | Layout wrapper for child routes |
| `+layout.server.ts` | Server-only layout load function |
| `+server.ts` | API endpoint (GET, POST, PUT, DELETE) |
| `+error.svelte` | Error boundary for the route segment |

## Dynamic Parameters

```
src/routes/blog/[slug]/+page.svelte      -> /blog/:slug
src/routes/[org]/[repo]/+page.svelte     -> /:org/:repo
src/routes/docs/[...path]/+page.svelte   -> /docs/* (rest param)
src/routes/[[lang]]/about/+page.svelte   -> /about or /:lang/about (optional)
```

Custom param matchers: create `src/params/integer.ts` exporting a `match` function, use as `[id=integer]`.

## Route Groups

Parenthesized directories group layouts without affecting URLs:

```
src/routes/(auth)/login/+page.svelte     -> /login  (uses auth layout)
src/routes/(app)/dashboard/+page.svelte  -> /dashboard (uses app layout)
```

## Layouts

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>
<nav><a href="/">Home</a></nav>
<main>{@render children()}</main>
```

Break out of layouts with `+page@.svelte` (root) or `+page@(group).svelte`.

## Load Functions

**Universal** (`+page.ts`): runs on server and client, cannot access secrets.

```typescript
export const load: PageLoad = async ({ fetch, params }) => {
  const res = await fetch(`/api/posts/${params.slug}`);
  return { post: await res.json() };
};
```

**Server-only** (`+page.server.ts`): runs only on server, can access DB and secrets.

```typescript
export const load: PageServerLoad = async ({ params, locals }) => {
  const post = await db.posts.findBySlug(params.slug);
  return { post, isOwner: locals.user?.id === post.authorId };
};
```

Load functions re-run when `params`, `url.searchParams`, or `invalidate()` targets change.

## API Endpoints

```typescript
// src/routes/api/posts/+server.ts
export const GET: RequestHandler = async ({ url }) => {
  return json(await fetchPosts(Number(url.searchParams.get('page') ?? '1')));
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  return json(await createPost(await request.json()), { status: 201 });
};
```

## Navigation

```svelte
<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await invalidateAll();
    goto('/login');
  }
</script>
```

Preloading: `data-sveltekit-preload-data="tap"` (on tap) or default (on hover).

## Rendering Modes

Configure per route in `+page.ts` or `+layout.ts`:

```typescript
export const ssr = true;        // server-side render (default)
export const csr = true;        // client-side render (default)
export const prerender = false;  // static generation
```

Combinations: SSR + CSR (default), `prerender=true` (SSG), `ssr=false` (SPA mode).
