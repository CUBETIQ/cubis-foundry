---
name: "react-best-practices"
description: "Performance-focused React/Next.js review checklist. Use for audits and optimization passes, not as primary implementation skill."
license: MIT
metadata:
  author: vercel
  version: "2.0.0"
  domain: "frontend"
  role: "review-checklist"
---
# React Best Practices

## Purpose

Use this skill to run structured optimization reviews on React/Next.js code. Pair it with implementation skills (`react-expert`, `nextjs-developer`) when code changes are required.

## Review order

1. Async waterfalls and request parallelization.
2. Bundle and hydration footprint.
3. Server rendering and serialization overhead.
4. Client data-fetching and rerender churn.
5. JS/runtime hot paths.

## High-impact checks

- Parallelize independent async work.
- Eliminate unnecessary client components.
- Remove heavy modules from critical path.
- Avoid unstable props that trigger deep rerenders.
- Keep server-to-client payloads minimal.

## Output format

Return prioritized findings with:

1. Issue and impact.
2. Minimal safe change.
3. Verification method (profile metric or test).

## Rule catalog

Detailed rules are under `rules/` and grouped by prefix:

- `async-*`
- `bundle-*`
- `server-*`
- `client-*`
- `rerender-*`
- `rendering-*`
- `js-*`
- `advanced-*`
