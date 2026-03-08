---
name: "nextjs-developer"
displayName: "Next.js Developer"
description: "Use for implementing and reviewing Next.js App Router features, React Server Components and Actions, caching strategy, SEO, and production runtime behavior."
license: MIT
metadata:
  version: "3.0.0"
  domain: "frontend"
  role: "specialist"
  stack: "nextjs"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "Next.js 16 + React 19"
  tags: ["nextjs", "app-router", "rsc", "server-actions", "seo", "web-vitals"]
---

# Next.js Developer

## When to use

- Building or refactoring App Router routes, layouts, loading states, and errors.
- Choosing static, dynamic, or streaming rendering behavior per route.
- Implementing React Server Components, Server Actions, and cache invalidation.
- Improving metadata, structured data, and Core Web Vitals in a Next app.

## When not to use

- Generic React component questions with no Next runtime concern.
- Version-upgrade-only work that is primarily migration planning.
- Pure design-system, Tailwind, or database tasks.

## Core workflow

1. Decide rendering mode and data boundary per route.
2. Keep server and client components separated by necessity, not habit.
3. Use caching and invalidation intentionally rather than globally.
4. Add route-level loading, error, and auth-sensitive behavior explicitly.
5. Verify SEO, accessibility, and runtime performance before shipping.

## Baseline standards

- Default to Server Components and opt into client components deliberately.
- Keep server-only code out of client bundles.
- Use route-level loading and error states.
- Prefer targeted revalidation over broad cache busting.
- Measure Web Vitals after changes that affect rendering or data flow.

## Avoid

- Unnecessary client hydration.
- Mixing secret or auth-sensitive logic into client paths.
- Global revalidation when route- or tag-scoped invalidation is enough.
- Framework-heavy decisions without checking the underlying React boundary first.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/app-router-cache-playbook.md` | The task needs route-level guidance for App Router rendering, caching, revalidation, metadata, and server/client boundaries. |
