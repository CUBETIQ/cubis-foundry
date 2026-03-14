---
name: remix
description: "Use when building Remix v2+ applications with nested routing, loaders, actions, progressive enhancement, streaming, server-side rendering, and full-stack data flow patterns."
---
# Remix

## Purpose

Guide the design and implementation of production-grade Remix v2+ applications using nested routing, loader/action data flows, progressive enhancement, streaming with `defer` and `Await`, error boundaries, form handling, and server-side rendering. Every instruction prioritizes web-standards alignment, progressive enhancement as a default, and the Remix mental model of treating the browser as a thin client that enhances server-rendered HTML.

## When to Use

- Scaffolding a new Remix v2 application or migrating from Remix v1 / React Router to Remix v2 conventions.
- Designing nested route hierarchies with shared layouts, pathless routes, and resource routes.
- Implementing loaders and actions for server-side data fetching and form mutations.
- Adding streaming with `defer`, `Await`, and `Suspense` for slow data sources.
- Building progressively enhanced forms that work without JavaScript.
- Configuring error and catch boundaries for graceful degradation.
- Deploying Remix to edge runtimes (Cloudflare Workers, Vercel Edge, Deno Deploy).
- Reviewing Remix code for waterfall data fetching, missing revalidation, or broken progressive enhancement.

## Instructions

1. **Confirm the Remix version and runtime adapter before generating code** because Remix v2 introduced Vite as the default bundler, flat file routing, and breaking changes to route module exports that invalidate patterns from v1. See `references/routing-conventions.md`.

2. **Organize routes using flat file conventions with dot-delimited nesting** because Remix v2 uses `routes/parent.child.tsx` instead of folder nesting, and incorrect naming produces route mismatches that silently render the wrong layout without any build error.

3. **Use `loader` functions for all GET-request data fetching and return plain objects or `json()` responses** because loaders run on the server before rendering, eliminating client-side fetch waterfalls and ensuring the initial HTML contains meaningful content for SEO and perceived performance. See `references/loaders-actions.md`.

4. **Use `action` functions for all non-GET mutations and return redirect responses on success** because actions follow the POST/Redirect/GET pattern that prevents duplicate form submissions on refresh and ensures the browser history stack reflects the user's intent rather than intermediate mutation states.

5. **Build forms with the Remix `<Form>` component instead of `<form>` for progressive enhancement** because `<Form>` intercepts submissions with JavaScript when available for instant optimistic UI, but falls back to a standard HTML form submission when JavaScript fails or is disabled, preserving full functionality.

6. **Implement optimistic UI with `useNavigation` and `useFetcher` instead of local state** because Remix tracks all in-flight navigations and fetcher submissions, providing `navigation.state`, `navigation.formData`, and `fetcher.formData` that reflect the pending mutation without manual state management or race condition handling. See `references/progressive-enhancement.md`.

7. **Use `defer` with `Await` and `Suspense` for data that is not critical to the initial render** because `defer` streams the shell HTML immediately and resolves slow promises on the server, sending the completed HTML chunks as they finish without blocking time-to-first-byte for the entire page. See `references/streaming-defer.md`.

8. **Define `ErrorBoundary` exports in every route segment that can fail independently** because Remix renders the nearest ancestor ErrorBoundary when a loader or action throws, isolating failures to the affected route segment while the rest of the page remains interactive.

9. **Use `shouldRevalidate` to prevent unnecessary loader re-execution after mutations** because Remix revalidates all active loaders by default after any action, and skipping revalidation for loaders whose data is unaffected by the mutation reduces server load and improves post-action render speed.

10. **Colocate route-specific meta, links, and headers exports in the route module** because Remix merges these exports from the entire route hierarchy at render time, and missing or conflicting exports produce incorrect `<head>` content, duplicate stylesheets, or wrong cache headers.

11. **Use resource routes (modules that export only a loader or action, no default component) for API endpoints, webhooks, and file downloads** because resource routes share the same authentication middleware, session handling, and deployment infrastructure as UI routes without requiring a separate API server. See `references/resource-routes.md`.

12. **Handle sessions and cookies with the Remix `createCookieSessionStorage` or `createSessionStorage` utilities** because these utilities sign and encrypt session data by default, preventing tampering, and integrate with the loader/action request flow so sessions are available server-side without client-side storage.

13. **Type loader and action data with `typeof loader` inference instead of manual interfaces** because TypeScript infers the exact return shape from the loader function, and manual interfaces drift out of sync with the actual server response, causing runtime type mismatches that TypeScript cannot detect.

14. **Validate action form data on the server using Zod or a similar schema library and return structured validation errors** because client-side validation is bypassable, and returning a `{ errors }` object from the action allows the form to re-render with field-level error messages without losing user input.

15. **Use `useFetcher` for mutations that should not trigger a navigation** because `useFetcher` submits to an action and receives the response without changing the URL or scroll position, making it appropriate for inline edits, toggles, and background saves that happen within the current page context.

16. **Configure cache headers in loader `headers` exports and use `stale-while-revalidate` for static-ish content** because Remix does not add caching by default, and proper cache headers at the route level reduce origin server load, improve TTFB for repeat visitors, and enable CDN edge caching without a separate caching layer.

## Output Format

Provide implementation code, route module definitions, loader/action functions, form components, and deployment configuration as appropriate. Include file paths relative to the `app/` directory using Remix v2 flat file conventions. When generating route modules, always show the complete module exports (`loader`, `action`, `default`, `ErrorBoundary`, `meta`, `headers`) relevant to the task.

## References

Load only what the current task requires.

| File | Load when |
| --- | --- |
| `references/routing-conventions.md` | Task involves route hierarchy design, flat file naming, pathless routes, or layout routes. |
| `references/loaders-actions.md` | Task involves data fetching, form mutations, server-side validation, or revalidation control. |
| `references/progressive-enhancement.md` | Task involves optimistic UI, useFetcher, useNavigation, or forms that work without JavaScript. |
| `references/streaming-defer.md` | Task involves defer, Await, Suspense, streaming SSR, or slow data source handling. |
| `references/resource-routes.md` | Task involves API endpoints, webhooks, file downloads, or headless route modules. |

## Gemini Platform Notes

- Use `activate_skill` to invoke skills by name from Gemini CLI or Gemini Code Assist.
- Skill files are stored under `.gemini/skills/` in the project root.
- Gemini does not support `context: fork` — all skill execution is inline.
- User arguments are passed as natural language in the activation prompt.
- Reference files are loaded relative to the skill directory under `.gemini/skills/<skill-id>/`.
