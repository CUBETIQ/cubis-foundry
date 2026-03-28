# Testing

Load this when Next.js work needs route-handler tests, server-action checks, middleware coverage, or a decision about when to hand off to `web-testing`.

## Ownership

- Keep App Router, route-handler, middleware, and caching-boundary tests in the Next.js skill.
- Keep generic TypeScript utility tests in `typescript-best-practices`.
- Keep generic React component tests in `react` unless the behavior depends on Next.js runtime primitives.
- Use `web-testing` for live browser evidence, route verification in a real page, or end-to-end release-readiness checks.

## Route handlers and server actions

- Test route handlers as request/response units using the built-in `next/server` types or the repo's existing helper layer.
- Test server actions at the boundary where inputs, validation errors, redirects, and revalidation behavior are visible.
- Keep fixture setup deterministic and avoid touching real external services unless the test is explicitly integration-scoped.

## Middleware and app-router boundaries

- Add focused coverage when auth, rewrites, headers, or locale logic lives in middleware.
- Test App Router seams where params, layouts, caching, or server/client boundaries are easy to regress.
- Treat framework caching and streaming behavior as Next.js-owned integration concerns, not generic unit tests.

## Escalation rules

- Move into `web-testing` when the task requires real browser navigation, DOM evidence, accessibility snapshots, or visual proof.
- Move into `playwright-interactive` only when deeper browser suite authoring is needed after `web-testing` has already been selected as the runtime surface.
