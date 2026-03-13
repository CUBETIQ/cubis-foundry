````markdown
---
inclusion: manual
name: react-best-practices
description: "Use for performance-focused React and Next.js optimization audits, rerender analysis, bundle reduction, and server-rendering efficiency reviews."
license: MIT
metadata:
  author: cubis-foundry
  version: "2.0.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# React Best Practices

## Purpose

Structured optimization review checklist for React and Next.js code. Pair with implementation skills (`react-expert`, `nextjs-developer`) when code changes are required — this skill focuses on identifying performance issues and recommending minimal safe fixes.

## When to Use

- Running structured performance audits on React or Next.js applications.
- Identifying async waterfalls, bundle bloat, or hydration overhead.
- Reviewing rerender churn, unstable props, or server-to-client payload size.
- Prioritizing optimization work by measurable impact.
- Validating that recent changes haven't introduced rendering regressions.

## Instructions

1. **Start with async waterfalls and request parallelization.** Identify sequential data fetches that could run in parallel. Async waterfalls are usually the highest-impact performance issue.

2. **Audit bundle and hydration footprint.** Identify unnecessary client components, heavy modules in the critical path, and components that could remain server-rendered. Eliminate unnecessary client hydration.

3. **Review server rendering and serialization overhead.** Check for oversized server-to-client payloads, redundant data serialization, and components that fetch more data than they render.

4. **Analyze client data-fetching and rerender churn.** Look for unstable props that trigger deep rerenders, derived-state duplication, and effect-driven state loops. Verify that memoization is applied only where profiling shows benefit.

5. **Profile JS/runtime hot paths.** Identify expensive computations in render paths, unnecessary object/array allocations per render, and heavy event handlers that block the main thread.

6. **For each finding, assess impact before recommending a fix.** Prioritize by user-visible latency and interaction responsiveness. Small measured gains on hot paths outweigh large theoretical gains on cold paths.

7. **Recommend minimal safe changes.** Each fix should be the smallest change that addresses the issue. Avoid cascading refactors when a targeted fix suffices.

8. **Specify a verification method for every recommendation.** Each finding needs a concrete way to confirm the fix worked — a profile metric, a bundle-size diff, a Lighthouse score change, or a specific test.

## Output Format

Return a prioritized list of findings. Each finding includes:

1. **Issue** — what the problem is and its performance impact.
2. **Fix** — the minimal safe change to resolve it.
3. **Verification** — the profile metric, test, or measurement that confirms the fix.

Group findings by category: async/network, bundle/hydration, server rendering, client rerenders, runtime hot paths.

## References

Detailed rules are organized under `rules/` by prefix:

| Prefix        | Coverage                                     |
| ------------- | -------------------------------------------- |
| `async-*`     | Async waterfalls and request parallelization |
| `bundle-*`    | Bundle size and tree-shaking                 |
| `server-*`    | Server rendering and serialization           |
| `client-*`    | Client data-fetching patterns                |
| `rerender-*`  | Rerender churn and prop stability            |
| `rendering-*` | Rendering pipeline efficiency                |
| `js-*`        | JavaScript runtime hot paths                 |
| `advanced-*`  | Advanced optimization patterns               |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Run a performance audit on this Next.js app — focus on async waterfalls and bundle size."
- "Review this component tree for rerender churn and unstable prop patterns."
- "Identify server-to-client serialization overhead in these Server Components."
````
