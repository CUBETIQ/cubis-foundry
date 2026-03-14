---
name: svelte-sveltekit
description: "Use when building web applications with Svelte 5 and SvelteKit. Invoke for rune-based reactivity ($state, $derived, $effect), file-based routing, form actions, server-side rendering, load functions, and deployment."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
  domain: frontend
  triggers: Svelte, SvelteKit, runes, $state, $derived, $effect, form actions, SSR, server load, page load
  role: specialist
  scope: implementation
  output-format: code
  related-skills: typescript-pro, tailwind-patterns, test-master
compatibility: "Claude Code, Codex, GitHub Copilot"
---

# Svelte 5 + SvelteKit

Senior frontend engineer specializing in Svelte 5 rune-based reactivity and SvelteKit full-stack patterns for performant, accessible web applications.

## Purpose

Provide authoritative guidance on building production Svelte 5 + SvelteKit applications. This skill covers the runes reactivity model, file-based routing, server/client load functions, form actions with progressive enhancement, SSR/SSG strategies, and deployment to edge and Node targets.

## When to Use

- Creating or migrating Svelte components to Svelte 5 runes syntax
- Implementing SvelteKit routes with load functions and layouts
- Building forms with SvelteKit form actions and progressive enhancement
- Configuring SSR, SSG, or hybrid rendering strategies
- Optimizing Svelte apps for performance and bundle size
- Writing tests for Svelte components and SvelteKit endpoints
- Deploying SvelteKit apps to Vercel, Cloudflare, or Node servers

## Instructions

1. **Audit the existing codebase for Svelte version** before writing any code, because Svelte 5 runes syntax is incompatible with Svelte 4 reactive declarations (`$:`) and mixing them causes runtime errors.

2. **Use `$state` for all mutable reactive values** instead of `let` assignments, because `$state` creates fine-grained reactivity that Svelte 5 can track across component boundaries and inside plain objects.

3. **Derive computed values with `$derived`** instead of manual recalculation, because `$derived` automatically recomputes when its dependencies change and avoids stale-value bugs that plague imperative approaches.

4. **Isolate side effects in `$effect`** and keep them minimal, because effects run after DOM updates and uncontrolled effects create cascading re-renders that degrade performance and introduce timing bugs.

5. **Structure routes using the `+page.svelte` / `+layout.svelte` / `+server.ts` file conventions** rather than custom routing, because SvelteKit's file-based router enables automatic code-splitting, nested layouts, and typed parameters.

6. **Implement data loading in `+page.server.ts` load functions** to keep secrets and database calls on the server, because load functions run before rendering and provide typed data to pages without exposing backend details to the client bundle.

7. **Use `+page.ts` load functions for client-safe data** that can run universally, because universal load functions enable client-side navigation without round-trips when the data does not require server secrets.

8. **Build form mutations with SvelteKit form actions** (`+page.server.ts` actions) and `use:enhance`, because form actions provide progressive enhancement, CSRF protection, and work without JavaScript enabled.

9. **Apply `use:enhance` to progressively enhance forms** with custom callbacks for pending/success/error states, because this preserves the form-action contract while adding optimistic UI updates and loading indicators.

10. **Validate all form data on the server using a schema library** (Zod, Valibot, or ArkType), because client-side validation can be bypassed and server-side validation is the only trustworthy enforcement boundary.

11. **Configure rendering strategy per route** using `+page.ts` or `+layout.ts` exports (`ssr`, `csr`, `prerender`), because different routes have different latency, SEO, and caching requirements that a single global setting cannot satisfy.

12. **Implement error boundaries with `+error.svelte`** at layout and page levels, because unhandled errors in load functions or components crash the entire page unless caught by the nearest error boundary.

13. **Use SvelteKit hooks (`hooks.server.ts`)** for authentication, logging, and response transformation, because hooks intercept every request before routing and provide a single enforcement point for cross-cutting concerns.

14. **Write component tests with Vitest and `@testing-library/svelte`** and route tests with Playwright, because unit tests verify component logic in isolation while E2E tests validate the full server-client contract.

15. **Optimize bundle size by lazy-loading heavy components** with `{#await import(...)}` or dynamic `import()` in load functions, because SvelteKit code-splits per route but large shared dependencies still inflate initial bundles.

16. **Pin the SvelteKit adapter** (`adapter-auto`, `adapter-node`, `adapter-vercel`, `adapter-cloudflare`) to a specific version, because adapter mismatches between development and production cause silent deployment failures.

## Output Format

When delivering Svelte 5 + SvelteKit code:

1. **Component files** -- `.svelte` files using runes syntax with `<script>`, template, and `<style>` blocks
2. **Route files** -- `+page.svelte`, `+page.server.ts`, `+layout.svelte`, `+layout.server.ts` following SvelteKit conventions
3. **Type definitions** -- `.d.ts` files or inline types for load function return values
4. **Test files** -- `.test.ts` files co-located with components or in a `tests/` directory
5. **Configuration** -- `svelte.config.js`, `vite.config.ts` changes when needed
6. **Brief rationale** -- One-sentence explanation for each architectural decision

## References

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Runes | `references/runes.md` | Using $state, $derived, $effect, $props, $bindable |
| Routing | `references/routing.md` | File-based routes, layouts, params, groups |
| Form Actions | `references/form-actions.md` | Server actions, use:enhance, validation |
| Testing | `references/testing.md` | Vitest, Testing Library, Playwright for Svelte |
| Deployment | `references/deployment.md` | Adapters, SSR/SSG, environment variables |
