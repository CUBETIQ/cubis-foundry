---
name: nextjs
description: "Use when building web applications with Next.js 15+. Invoke for App Router, Server Components, Server Actions, caching strategies, Partial Prerendering, parallel routes, middleware, and deployment."
---
# Next.js 15+ App Router

Senior full-stack engineer specializing in Next.js 15+ App Router patterns, React Server Components, Server Actions, and production caching strategies for performant, SEO-optimized web applications.

## Purpose

Provide authoritative guidance on building production Next.js 15+ applications using the App Router. This skill covers React Server Components, Server Actions for mutations, the multi-layer caching architecture, Partial Prerendering, parallel and intercepting routes, middleware, image optimization, and deployment to Vercel and self-hosted targets.

## When to Use

- Creating or migrating Next.js projects to the App Router from Pages Router
- Implementing data fetching with React Server Components and async components
- Building mutations and form handling with Server Actions
- Configuring caching layers (Request Memoization, Data Cache, Full Route Cache, Router Cache)
- Setting up parallel routes, intercepting routes, or route groups
- Optimizing images, fonts, and metadata for Core Web Vitals
- Writing middleware for authentication, redirects, or A/B testing
- Deploying Next.js apps to Vercel, Docker, or standalone Node servers

## Instructions

1. **Verify the project uses App Router** (`app/` directory) before writing any code, because App Router and Pages Router have incompatible conventions for layouts, data fetching, and API routes, and mixing them causes silent failures.

2. **Default to React Server Components** for every new component and only add `'use client'` when the component needs browser APIs, event handlers, or React hooks like `useState`/`useEffect`, because Server Components eliminate client-side JavaScript for static UI and reduce bundle size.

3. **Fetch data directly in Server Components** using `async` component functions or server-side utility functions instead of client-side `useEffect` or `getServerSideProps`, because co-located data fetching runs at build or request time on the server with automatic request deduplication.

4. **Use Server Actions for all data mutations** by marking async functions with `'use server'` and passing them to form `action` props or calling them from Client Components, because Server Actions provide a type-safe RPC boundary with progressive enhancement that works without JavaScript enabled.

5. **Validate all Server Action inputs on the server** with a schema library (Zod, Valibot, or ArkType) and return structured errors, because Server Actions are publicly accessible HTTP endpoints and client-side validation can be bypassed.

6. **Configure caching intentionally per data source** using `fetch` options (`cache`, `next.revalidate`, `next.tags`) and segment-level `revalidate` exports, because Next.js 15 opts out of caching by default and unplanned cache misses cause N+1 request waterfalls that degrade TTFB.

7. **Use `revalidateTag` and `revalidatePath` in Server Actions** to surgically invalidate cached data after mutations, because full-page revalidation is wasteful and stale-while-revalidate patterns prevent users from seeing outdated data after writes.

8. **Structure routes with `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, and `not-found.tsx`** at each route segment, because the file-convention system enables automatic code-splitting, streaming, error boundaries, and nested layouts without manual wiring.

9. **Implement streaming with `loading.tsx` and `<Suspense>` boundaries** around slow data-dependent sections, because streaming sends the shell immediately and progressively fills in content, dramatically improving perceived performance and LCP.

10. **Use parallel routes (`@slot`) and intercepting routes (`(.)`, `(..)`)** for modals, split views, and conditional UI, because these patterns preserve URL state and browser history while supporting complex layouts that would otherwise require client-side routing hacks.

11. **Apply `next/image` with explicit `width`/`height` or `fill` prop** for all images, because the Image component provides automatic WebP/AVIF conversion, responsive srcsets, lazy loading, and CLS prevention that raw `<img>` tags cannot match.

12. **Configure `metadata` or `generateMetadata` exports in every page and layout**, because Next.js merges metadata hierarchically and search engines rely on accurate titles, descriptions, and Open Graph tags for ranking and social sharing.

13. **Place middleware in `middleware.ts` at the project root** for authentication guards, geo-redirects, and header manipulation, because middleware runs at the edge before routing and provides a single enforcement point that cannot be bypassed by direct page navigation.

14. **Separate server-only code with the `server-only` package** and keep database clients, secrets, and ORM calls in files that import it, because accidental inclusion of server code in the client bundle leaks secrets and crashes at runtime.

15. **Write route handler tests with the built-in `next/server` types** and component tests with Vitest + Testing Library, because unit tests verify data logic in isolation while integration tests validate the full request-response cycle.

16. **Pin `next` and `react` versions together** and test upgrades in a branch, because Next.js canary releases tightly couple React features (like Server Components and `use()`) and version mismatches cause cryptic hydration errors.

## Output Format

When delivering Next.js 15+ code:

1. **Route files** -- `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` following App Router conventions
2. **Server Actions** -- Inline `'use server'` functions or dedicated `actions.ts` files
3. **Component files** -- `.tsx` files with explicit `'use client'` directive only when needed
4. **Configuration** -- `next.config.ts` changes with explanatory comments
5. **Type definitions** -- Typed params, searchParams, and action return values
6. **Brief rationale** -- One-sentence explanation for each architectural decision

## References

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Server Components | `references/server-components.md` | RSC patterns, async components, client/server boundaries |
| Server Actions | `references/server-actions.md` | Form mutations, revalidation, error handling, optimistic UI |
| Caching | `references/caching.md` | Request memoization, Data Cache, Full Route Cache, Router Cache |
| Routing | `references/routing.md` | Parallel routes, intercepting routes, route groups, middleware |
| Performance | `references/performance.md` | Images, fonts, metadata, streaming, Partial Prerendering |

## Codex Platform Notes

- Specialists are internal reasoning postures, not spawned subagent processes.
- Reference the repo-root AGENTS instructions for posture definitions and switching contracts.
- Codex operates under network restrictions — skills should not assume outbound HTTP access.
- Use `$ARGUMENTS` to access user-provided arguments when the skill is invoked.
- All skill guidance executes within the sandbox; file I/O is confined to the workspace.
