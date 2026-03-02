````markdown
---
inclusion: manual
name: "nextjs-developer"
displayName: "Next.js Developer"
description: "Use for implementing/refactoring Next.js App Router features, React Server Components/Actions, SEO, and production architecture."
license: MIT
metadata:
  version: "2.0.0"
  domain: "frontend"
  role: "specialist"
  stack: "nextjs"
  baseline: "Next.js 16 + React 19"
---

# Next.js Developer

## Scope

- Primary skill for App Router implementation and refactors.
- Not for version migration playbooks (`next-upgrade`) or cache-components-only tuning (`next-cache-components`).

## When to use

- Building routes/layouts/loading/error boundaries.
- Implementing server components and server actions.
- Designing data fetching/revalidation strategy.
- Improving SEO and web vitals.

## Core workflow

1. Define rendering mode per route (static/dynamic/streaming).
2. Keep server/client component boundaries explicit.
3. Implement data access with caching semantics by intent.
4. Add forms/actions with validation and auth checks.
5. Verify perf, accessibility, and error handling.

## Baseline standards

- Default to Server Components; opt into client components only when needed.
- Keep server-only code out of client bundles.
- Use route-level loading/error states.
- Use metadata API and structured data for SEO.
- Measure Core Web Vitals and act on regressions.

## Avoid

- Unnecessary client hydration.
- Mixing auth-sensitive logic into client-only paths.
- Overusing global revalidation when targeted invalidation is possible.

## Reference files

- `references/app-router.md`
- `references/server-components.md`
- `references/server-actions.md`
- `references/data-fetching.md`
- `references/performance.md`
- `references/seo.md`
- `references/deployment.md`
- `references/testing.md`
````
