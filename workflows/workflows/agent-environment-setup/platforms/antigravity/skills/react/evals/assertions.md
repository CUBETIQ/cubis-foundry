# React 19+ -- Eval Assertions

## Eval 01: use() hook with Suspense for data fetching

This eval validates correct usage of the React 19 `use()` hook with Suspense boundaries for promise-based data fetching.

### Assertions

| # | Type | Target | Rationale |
|---|------|--------|-----------|
| 1 | contains | `use(` | Verifies the skill uses the React 19 `use()` hook to read promises. `use()` replaces the `useEffect` + `useState` data fetching pattern with Suspense integration and can be called conditionally. |
| 2 | contains | `<Suspense` | Verifies the skill wraps the data-consuming component in a `<Suspense>` boundary. Without Suspense, `use()` would suspend to the nearest ancestor boundary or crash the tree. |
| 3 | contains | `fallback` | Verifies a fallback prop is provided to Suspense. The fallback renders while the promise is pending, providing a loading skeleton to the user. |
| 4 | pattern | `ErrorBoundary\|error.boundary\|componentDidCatch` | Verifies the skill includes error handling. Promise rejections from `use()` propagate to the nearest Error Boundary, so one must be present to prevent full-tree crashes. |
| 5 | pattern | `interface\|type\s+\w+\s*=` | Verifies the skill defines TypeScript types for props. Explicit typing ensures the promise shape and component API are documented and enforced at compile time. |

### What a passing response looks like

A passing response creates:
- A `UserProfile` component that calls `use(userPromise)` to read the resolved user data
- A parent component or wrapper that passes the promise and wraps `UserProfile` in `<Suspense fallback={<Skeleton />}>`
- An `ErrorBoundary` component (class-based or from `react-error-boundary`) wrapping the Suspense boundary
- TypeScript interfaces for `User` (name, email, avatar) and the component props (`{ userPromise: Promise<User> }`)
- No `useEffect` or `useState` for data fetching

---

## Eval 02: Form with useActionState and useOptimistic

This eval validates correct implementation of React 19 form handling with `useActionState` for state management and `useOptimistic` for instant UI feedback.

### Assertions

| # | Type | Target | Rationale |
|---|------|--------|-----------|
| 1 | contains | `useActionState` | Verifies the skill uses `useActionState` to manage form action state. This hook encapsulates the action, pending state, and previous result in a single API. |
| 2 | contains | `useOptimistic` | Verifies the skill uses `useOptimistic` for instant feedback. Optimistic updates make the UI feel responsive while the server processes the mutation, with automatic revert on failure. |
| 3 | pattern | `action[=:]\|<form.*action` | Verifies the skill passes the action to a form element. React 19 form actions integrate with the `action` prop for built-in pending states and progressive enhancement. |
| 4 | pattern | `useFormStatus\|pending` | Verifies the skill tracks pending state. A loading indicator on the submit button prevents double submission and provides feedback. |
| 5 | contains | `'use server'` | Verifies the skill includes a server action. The mutation handler must run on the server for data persistence and security. |

### What a passing response looks like

A passing response provides:
- A server action marked with `'use server'` that saves a todo and returns the updated list
- A Client Component using `useActionState` bound to the server action
- `useOptimistic` to immediately append the new todo to the displayed list
- A `<form action={formAction}>` that passes the action state handler
- A `SubmitButton` component using `useFormStatus` to show pending state
- Error handling that reverts the optimistic update when the server action fails
