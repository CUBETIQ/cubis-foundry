# App Router Architecture

## File Conventions

| File            | Purpose                                                 |
| --------------- | ------------------------------------------------------- |
| `layout.tsx`    | Shared UI, persists across navigations, wraps children  |
| `template.tsx`  | Like layout but re-mounts on navigation (new instance)  |
| `page.tsx`      | Unique UI for a route, makes route publicly accessible  |
| `loading.tsx`   | Loading UI using Suspense boundary                      |
| `error.tsx`     | Error boundary for the segment                          |
| `not-found.tsx` | 404 UI for the segment                                  |
| `route.ts`      | API endpoint (cannot coexist with page.tsx in same dir) |

## Layout Patterns

```tsx
// Root layout — required, wraps entire app
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// Nested layout — wraps a segment and its children
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### Layout Rules

- Root layout must contain `<html>` and `<body>` tags
- Layouts do NOT re-render when navigating between child routes
- Layouts cannot access `pathname` — use `usePathname()` in a Client Component
- Data fetched in a layout is NOT passed to children — fetch in each segment

## Route Groups

Group routes without affecting the URL structure using `(folderName)`:

```
app/
├── (marketing)/
│   ├── layout.tsx      # Marketing layout
│   ├── about/page.tsx  # /about
│   └── blog/page.tsx   # /blog
├── (shop)/
│   ├── layout.tsx      # Shop layout
│   ├── products/page.tsx  # /products
│   └── cart/page.tsx      # /cart
└── layout.tsx          # Root layout
```

Use cases:

- Different layouts for different sections
- Organizing routes by team or feature
- Opting specific segments into a layout

## Parallel Routes

Render multiple pages simultaneously in the same layout using named slots (`@folder`):

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
    <>
      {children}
      {analytics}
      {team}
    </>
  );
}
```

```
app/
├── layout.tsx
├── page.tsx
├── @analytics/
│   └── page.tsx
└── @team/
    └── page.tsx
```

### Parallel Route Rules

- Slots are NOT route segments — `@analytics` doesn't affect the URL
- Each slot can have its own `loading.tsx` and `error.tsx`
- Use `default.tsx` in slots to handle unmatched routes

## Intercepting Routes

Intercept a route to show it in the current layout while preserving context:

| Convention | Matches       |
| ---------- | ------------- |
| `(.)`      | Same level    |
| `(..)`     | One level up  |
| `(..)(..)` | Two levels up |
| `(...)`    | From root     |

```
app/
├── feed/
│   ├── page.tsx
│   └── (..)photo/[id]/page.tsx  # Intercepts /photo/[id] from /feed
└── photo/
    └── [id]/page.tsx            # Full page when accessed directly
```

Common pattern: modal on click, full page on direct URL or refresh.

## Dynamic Routes

```tsx
// app/blog/[slug]/page.tsx — dynamic segment
export default function Post({ params }: { params: { slug: string } }) {
  return <h1>{params.slug}</h1>;
}

// app/shop/[...categories]/page.tsx — catch-all
// Matches /shop/a, /shop/a/b, /shop/a/b/c
export default function Category({
  params,
}: {
  params: { categories: string[] };
}) {
  return <div>{params.categories.join(" > ")}</div>;
}

// app/shop/[[...categories]]/page.tsx — optional catch-all
// Also matches /shop (without segments)
```

## Static Generation for Dynamic Routes

```tsx
// Generate static params at build time
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// dynamicParams = false → return 404 for unknown params
export const dynamicParams = false;
```

## Route Handlers (API Routes)

```tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const posts = await db.post.findMany();
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const post = await db.post.create({ data: body });
  return NextResponse.json(post, { status: 201 });
}
```

### Route Handler Rules

- Cannot coexist with `page.tsx` in the same route segment
- Supported methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`
- `GET` handlers are cached by default when not using `Request` object
- Use `NextRequest` for access to cookies, headers, URL search params

## Middleware

```tsx
// middleware.ts (at project root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Auth check
  const token = request.cookies.get("token");
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
```
