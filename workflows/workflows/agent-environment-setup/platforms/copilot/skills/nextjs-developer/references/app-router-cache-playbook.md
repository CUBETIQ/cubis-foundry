# App Router And Cache Playbook

Load this when route-level Next.js behavior is the real problem.

## Rendering mode

- Decide per route whether the target is static, dynamic, or streaming.
- Default to Server Components and add client components only where interactivity requires them.
- Keep secret, auth-sensitive, and server-only logic out of client bundles.

## Data and cache

- Choose the narrowest caching strategy that matches the data lifecycle.
- Prefer targeted revalidation over global cache busting.
- Make route, tag, or mutation-driven invalidation explicit.

## UX and SEO

- Add route-level loading and error states intentionally.
- Keep metadata and structured data close to the route they describe.
- Verify hydration cost when adding new client boundaries.

## Operational checks

- Re-check auth, cache invalidation, and user-specific data paths together.
- Measure Web Vitals after changing route rendering or data flow.
