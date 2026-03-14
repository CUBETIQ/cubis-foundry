# Routing Conventions

Load this when designing route hierarchies, using flat file naming, pathless routes, layout routes, or migrating from Remix v1 to v2 conventions.

## Flat File Routing (Remix v2 Default)

Remix v2 uses dot-delimited flat file naming. All route files live in `app/routes/` without folder nesting.

### Naming Rules

| File name | URL path | Parent layout |
| --- | --- | --- |
| `_index.tsx` | `/` | `root.tsx` |
| `about.tsx` | `/about` | `root.tsx` |
| `blog.tsx` | `/blog` (layout) | `root.tsx` |
| `blog._index.tsx` | `/blog` (index) | `blog.tsx` |
| `blog.$slug.tsx` | `/blog/:slug` | `blog.tsx` |
| `blog.$slug.edit.tsx` | `/blog/:slug/edit` | `blog.$slug.tsx` |
| `blog_.archive.tsx` | `/blog/archive` | `root.tsx` (trailing `_` opts out of layout) |
| `_auth.tsx` | (no URL segment, layout only) | `root.tsx` |
| `_auth.login.tsx` | `/login` | `_auth.tsx` |
| `_auth.register.tsx` | `/register` | `_auth.tsx` |

### Key Conventions

- **Dots (`.`) create nesting** -- `blog.$slug.tsx` is a child of `blog.tsx`.
- **Trailing underscore (`_`) opts out of the parent layout** -- `blog_.archive.tsx` does not nest inside `blog.tsx`.
- **Leading underscore (`_`) creates a pathless layout** -- `_auth.tsx` wraps `_auth.login.tsx` and `_auth.register.tsx` without adding a URL segment.
- **`$param` creates a dynamic segment** -- `blog.$slug.tsx` matches `/blog/anything`.
- **`_index.tsx` is the index route** -- renders when the parent URL matches exactly with no additional segments.
- **Brackets escape special characters** -- `sitemap[.]xml.tsx` matches `/sitemap.xml`.

### Layout Routes vs Index Routes

A layout route (`blog.tsx`) renders when any child matches. It must include `<Outlet />` to render child content. An index route (`blog._index.tsx`) renders when the parent URL matches exactly.

```tsx
// app/routes/blog.tsx -- Layout route
import { Outlet } from "@remix-run/react";

export default function BlogLayout() {
  return (
    <div className="blog-layout">
      <Sidebar />
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
    </div>
  );
}
```

### Route Module Exports

Every route module can export these:

| Export | Purpose |
| --- | --- |
| `loader` | Server-side GET data fetching |
| `action` | Server-side non-GET mutations |
| `default` | React component to render |
| `ErrorBoundary` | Error UI for this route segment |
| `meta` | `<title>` and `<meta>` tags |
| `headers` | HTTP response headers |
| `links` | `<link>` tags for stylesheets and preloads |
| `handle` | Arbitrary data for `useMatches()` |
| `shouldRevalidate` | Control when the loader re-runs |

### Resource Routes

A route module that exports a `loader` or `action` but no `default` component is a resource route. It serves raw data (JSON, CSV, images) at a URL without rendering HTML.

```tsx
// app/routes/api.healthcheck.tsx -- Resource route
export async function loader() {
  return new Response("OK", { status: 200 });
}
```
