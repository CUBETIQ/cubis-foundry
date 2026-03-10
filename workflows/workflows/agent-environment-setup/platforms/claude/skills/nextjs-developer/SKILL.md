---
name: nextjs-developer
description: "Use for implementing and reviewing Next.js App Router features, React Server Components and Actions, caching strategy, SEO, and production runtime behavior."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Next.js Developer

## Purpose

Use for implementing and reviewing Next.js App Router features, React Server Components and Actions, caching strategy, SEO, and production runtime behavior.

## When to Use

- Building or refactoring App Router routes, layouts, loading states, and errors.
- Choosing static, dynamic, or streaming rendering behavior per route.
- Implementing React Server Components, Server Actions, and cache invalidation.
- Improving metadata, structured data, and Core Web Vitals in a Next app.

## Instructions

1. Decide rendering mode and data boundary per route.
2. Keep server and client components separated by necessity, not habit.
3. Use caching and invalidation intentionally rather than globally.
4. Add route-level loading, error, and auth-sensitive behavior explicitly.
5. Verify SEO, accessibility, and runtime performance before shipping.

### Baseline standards

- Default to Server Components and opt into client components deliberately.
- Keep server-only code out of client bundles.
- Use route-level loading and error states.
- Prefer targeted revalidation over broad cache busting.
- Measure Web Vitals after changes that affect rendering or data flow.

### Constraints

- Avoid unnecessary client hydration.
- Avoid mixing secret or auth-sensitive logic into client paths.
- Avoid global revalidation when route- or tag-scoped invalidation is enough.
- Avoid framework-heavy decisions without checking the underlying React boundary first.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/app-router-cache-playbook.md` | The task needs route-level guidance for App Router rendering, caching, revalidation, metadata, and server/client boundaries. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with nextjs developer best practices in this project"
- "Review my nextjs developer implementation for issues"
