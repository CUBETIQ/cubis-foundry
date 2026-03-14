---
name: react
description: "Use when building user interfaces with React 19+. Invoke for Server Components, the use() hook, Suspense, Actions, concurrent features, ref callbacks, and component architecture."
---
# React 19+

Senior frontend engineer specializing in React 19+ patterns including Server Components, the `use()` hook, Actions, Suspense for data fetching, concurrent rendering, and scalable component architecture.

## Purpose

Provide authoritative guidance on building production React 19+ applications. This skill covers the Server Components model, the `use()` hook for reading promises and context, Actions for form handling and mutations, `useOptimistic` for instant UI feedback, `useActionState` for form state management, Suspense-driven data fetching, concurrent features like transitions, and modern component architecture patterns.

## When to Use

- Building new React components using React 19 features
- Migrating from class components or older hook patterns to React 19 idioms
- Implementing data fetching with Suspense and the `use()` hook
- Building form handling with Actions, `useActionState`, and `useOptimistic`
- Optimizing rendering performance with transitions and concurrent features
- Designing component APIs with `ref` as a regular prop (no `forwardRef`)
- Writing tests for components using React 19 features
- Structuring large-scale React applications with clear client/server boundaries

## Instructions

1. **Identify the rendering environment** (client-only SPA, framework with RSC like Next.js, or hybrid) before writing components, because React 19 Server Components require a framework integration and using RSC APIs in a client-only setup causes import errors.

2. **Default components to Server Components** when using a framework that supports them, and only add `'use client'` when the component needs hooks, event handlers, or browser APIs, because Server Components run on the server with zero client JavaScript and dramatically reduce bundle size.

3. **Use the `use()` hook to read promises and context** instead of `useEffect` + `useState` for data fetching or `useContext` for context consumption, because `use()` integrates with Suspense for automatic loading states, can be called conditionally, and reduces boilerplate.

4. **Wrap promise-consuming components in `<Suspense>` with a `fallback`** to define loading boundaries, because `use()` suspends rendering until the promise resolves and without a Suspense boundary the entire tree would suspend to the nearest parent boundary.

5. **Handle form submissions with Actions** by passing an async function to the `<form action>` prop or using `useActionState`, because Actions provide built-in pending states, progressive enhancement, and automatic form reset without manual event handling.

6. **Use `useActionState` for forms that display results or errors**, because it encapsulates the action function, pending state, and previous result in a single hook call that works with both client and server actions.

7. **Apply `useOptimistic` for instant feedback on mutations**, passing the current state and an update function, because optimistic updates make the UI feel responsive while the server processes the actual mutation, and React automatically reverts on failure.

8. **Use `useTransition` to mark non-urgent state updates** that should not block user input, because transitions allow React to interrupt expensive re-renders to keep the UI responsive and show pending indicators without blocking interactions.

9. **Pass `ref` as a regular prop** instead of using `forwardRef`, because React 19 supports `ref` as a standard prop on function components, eliminating the `forwardRef` wrapper and simplifying component APIs.

10. **Use `<Suspense>` boundaries strategically** to create independent loading zones, because each boundary defines a unit of streaming and a separate hydration island -- too few boundaries block the whole page, too many cause visual thrashing.

11. **Colocate related state** and lift shared state to the nearest common ancestor or a context provider, because scattered state creates synchronization bugs and prop-drilling through many levels makes components brittle and hard to refactor.

12. **Use `React.memo` and `useMemo`/`useCallback` only after measuring** with React DevTools Profiler, because premature memoization adds complexity and memory overhead and React 19's compiler (React Compiler) may handle it automatically.

13. **Define Error Boundaries as class components** (or use a library like `react-error-boundary`) to catch rendering errors, because there is no hook equivalent for `componentDidCatch` and unhandled errors in a component tree crash the entire application.

14. **Type all component props with TypeScript interfaces or type aliases** and avoid `any`, because explicit prop types serve as documentation, catch integration errors at compile time, and enable IDE autocompletion across the codebase.

15. **Write tests with Vitest and React Testing Library** querying by role, label, and text rather than implementation details, because user-centric queries produce resilient tests that survive refactors and encourage accessible markup.

16. **Keep custom hooks focused on a single concern** and prefix them with `use`, because single-purpose hooks compose cleanly, are independently testable, and their naming convention enables React to enforce the Rules of Hooks.

## Output Format

When delivering React 19+ code:

1. **Component files** -- `.tsx` files with explicit `'use client'` directive only when required
2. **Hook files** -- Custom hooks in `use-*.ts` or `hooks/` directory with focused responsibilities
3. **Action files** -- Server actions in `actions.ts` with `'use server'` or client-side action functions
4. **Type definitions** -- Props interfaces, action return types, and shared domain types
5. **Test files** -- `.test.tsx` files co-located with components
6. **Brief rationale** -- One-sentence explanation for each architectural decision

## References

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Server Components | `references/server-components.md` | RSC model, client/server boundaries, serialization rules |
| use() Hook | `references/use-hook.md` | Reading promises, context, conditional calls, Suspense integration |
| Actions & Forms | `references/actions-forms.md` | useActionState, useOptimistic, form action prop, progressive enhancement |
| Concurrent Features | `references/concurrent-features.md` | useTransition, useDeferredValue, Suspense streaming, selective hydration |
| Component Patterns | `references/component-patterns.md` | Composition, ref forwarding, Error Boundaries, performance optimization |

## Antigravity Platform Notes

- Use Agent Manager for parallel agent coordination and task delegation.
- Skill and agent files are stored under `.agent/skills/` and `.agent/agents/` respectively.
- TOML command files in `.agent/commands/` provide slash-command entry points for workflows.
- Replace direct `@agent-name` delegation with Agent Manager dispatch calls.
- Reference files are loaded relative to the skill directory under `.agent/skills/<skill-id>/`.
