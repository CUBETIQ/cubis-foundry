---
name: "nextjs-developer"
displayName: "Next.js Developer"
description: "Use for implementing/refactoring Next.js App Router features, Server Components/Actions, SEO, and production architecture. Not for version migration workflows or cache-components-only tuning."
keywords:
  [
    "nextjs",
    "next.js",
    "react",
    "app router",
    "server components",
    "server actions",
    "vercel",
    "ssr",
    "seo",
    "typescript",
  ]
---

# Next.js Developer

## Overview

Senior Next.js developer expertise for Next.js 14+ with App Router and full-stack features. Covers server components, server actions, edge runtime, performance optimization, and production deployment with focus on fast, SEO-friendly applications.

## When to Use

- Building new Next.js 14+ projects with App Router
- Implementing Server Components and Server Actions
- Optimizing Core Web Vitals and performance
- Setting up data fetching with caching and revalidation
- Configuring SEO (metadata, sitemaps, structured data)
- Deploying to Vercel, Docker, or self-hosted environments
- Writing tests with Playwright and React Testing Library

## Quick Reference

### App Router File Conventions

```
app/
├── layout.tsx          # Root layout (required)
├── page.tsx            # Home page
├── loading.tsx         # Loading UI (Suspense boundary)
├── error.tsx           # Error boundary
├── not-found.tsx       # 404 page
├── (auth)/             # Route group (no URL segment)
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard/
│   ├── layout.tsx      # Nested layout
│   ├── page.tsx
│   └── @modal/         # Parallel route (slot)
│       └── (..)settings/page.tsx  # Intercepting route
└── api/
    └── route.ts        # API route handler
```

### Server vs Client Components

```tsx
// Server Component (default) — no directive needed
async function ProductList() {
  const products = await db.product.findMany();
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}

// Client Component — needs 'use client' directive
("use client");
import { useState } from "react";
export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

### Server Actions

```tsx
// Inline server action
async function createPost(formData: FormData) {
  "use server";
  const title = formData.get("title") as string;
  await db.post.create({ data: { title } });
  revalidatePath("/posts");
}

// In a form
<form action={createPost}>
  <input name="title" />
  <button type="submit">Create</button>
</form>;
```

### Data Fetching with Cache

```tsx
// Cached by default (static)
const data = await fetch("https://api.example.com/data");

// Revalidate every 60 seconds (ISR)
const data = await fetch("https://api.example.com/data", {
  next: { revalidate: 60 },
});

// No cache (dynamic)
const data = await fetch("https://api.example.com/data", {
  cache: "no-store",
});
```

### Metadata API

```tsx
// Static metadata
export const metadata: Metadata = {
  title: "My App",
  description: "Description",
  openGraph: { title: "My App", images: ["/og.png"] },
};

// Dynamic metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.id);
  return { title: product.name };
}
```

## Quality Checklist

- [ ] TypeScript strict mode enabled
- [ ] Core Web Vitals > 90
- [ ] SEO score > 95
- [ ] Error boundaries on all routes
- [ ] Loading states for async content
- [ ] Edge runtime compatible where needed
- [ ] Monitoring and error tracking configured

## Steering Files

| File                   | Load When                                                            |
| ---------------------- | -------------------------------------------------------------------- |
| `app-router.md`        | Route structure, layouts, route groups, parallel/intercepting routes |
| `server-components.md` | Server/Client component patterns, streaming, Suspense                |
| `server-actions.md`    | Form handling, mutations, validation, optimistic updates             |
| `data-fetching.md`     | Fetch patterns, caching, revalidation, SWR/React Query               |
| `performance.md`       | Image/font/script optimization, Core Web Vitals, bundle analysis     |
| `seo.md`               | Metadata API, sitemaps, structured data, Open Graph                  |
| `deployment.md`        | Vercel, Docker, self-hosting, monitoring, multi-region               |
| `testing.md`           | Playwright E2E, component tests, visual regression, accessibility    |

## Performance Targets

| Metric | Target  |
| ------ | ------- |
| TTFB   | < 200ms |
| FCP    | < 1s    |
| LCP    | < 2.5s  |
| CLS    | < 0.1   |
| FID    | < 100ms |
