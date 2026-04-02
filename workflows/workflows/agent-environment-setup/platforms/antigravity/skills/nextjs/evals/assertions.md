# Next.js 15+ App Router -- Eval Assertions

## Eval 01: Server Component data fetching with caching

This eval validates correct usage of Next.js 15 async Server Components for data fetching with appropriate caching and streaming configuration.

### Assertions

| # | Type | Target | Rationale |
|---|------|--------|-----------|
| 1 | contains | `async` | Verifies the skill uses async Server Component functions for data fetching. In Next.js 15 App Router, pages and layouts can be async functions that fetch data directly without client-side hooks. |
| 2 | pattern | `revalidate\|next:\s*\{` | Verifies the skill configures caching or revalidation. Next.js 15 no longer caches fetch requests by default, so explicit `revalidate` or `next` options are required to avoid unnecessary refetches. |
| 3 | contains | `generateMetadata` | Verifies the skill exports `generateMetadata` for dynamic SEO. Each page should generate metadata from its data to provide accurate titles, descriptions, and Open Graph tags. |
| 4 | contains | `loading.tsx` | Verifies the skill creates or references `loading.tsx` for streaming. This file automatically wraps the page in a Suspense boundary, enabling progressive content delivery. |
| 5 | excludes | `useEffect` | Verifies the skill does NOT use `useEffect` for data fetching. Server Components fetch data on the server; using `useEffect` would require a Client Component and cause unnecessary waterfalls. |

### What a passing response looks like

A passing response creates:
- An `app/blog/[slug]/page.tsx` as an async Server Component that fetches post data directly
- A `revalidate = 60` segment config export or `next: { revalidate: 60 }` fetch option
- A `generateMetadata` async function that reads the post title/description for SEO
- A `loading.tsx` file with a skeleton UI for streaming
- An `error.tsx` Client Component with error boundary UI
- No `useEffect`, `useState`, or `'use client'` in the page component

---

## Eval 02: Server Action form with validation and revalidation

This eval validates correct implementation of a Server Action with Zod validation, structured error returns, and cache revalidation after mutation.

### Assertions

| # | Type | Target | Rationale |
|---|------|--------|-----------|
| 1 | contains | `'use server'` | Verifies the skill marks the action function with the `'use server'` directive. Server Actions must be explicitly marked to create the RPC boundary between client and server. |
| 2 | contains | `useActionState` | Verifies the skill uses `useActionState` for form state. This React 19 hook manages pending state, previous results, and error display in a single call. |
| 3 | pattern | `z\.(string\|object)\|zod` | Verifies the skill validates inputs with Zod. Server Actions are publicly accessible endpoints, so all inputs must be validated server-side. |
| 4 | contains | `revalidatePath` | Verifies the skill revalidates cached data after mutation. Without revalidation, users see stale data after form submission. |
| 5 | contains | `'use client'` | Verifies the skill marks the form component as a Client Component. Components using hooks like `useActionState` must be Client Components. |

### What a passing response looks like

A passing response provides:
- An `actions.ts` file with `'use server'` directive containing the form action
- Zod schema validation for name (min 2, max 100) and email (valid format)
- Structured error return with field-level messages on validation failure
- A call to `revalidatePath('/messages')` after successful submission
- A Client Component form using `useActionState` with pending state indicator
- Progressive enhancement: the form works as a standard POST without JavaScript
