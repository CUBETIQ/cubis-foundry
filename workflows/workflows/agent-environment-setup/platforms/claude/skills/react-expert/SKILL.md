---
name: "react-expert"
description: "Use for framework-agnostic React architecture with React 19 patterns, state design, component boundaries, and rendering-performance decisions."
license: MIT
metadata:
  version: "3.0.0"
  domain: "frontend"
  role: "specialist"
  stack: "react"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "React 19"
  tags: ["react", "components", "state", "performance", "frontend", "hooks"]
---

# React Expert

## When to use

- Designing reusable component and state boundaries.
- Refactoring React code for predictable rendering and side-effect control.
- Choosing local, shared, server, or async UI state placement.
- Reviewing hooks, forms, transitions, and accessibility-sensitive UI flows.

## When not to use

- Next.js App Router and route-level rendering policy when framework behavior is primary.
- Pure CSS, design-token, or database concerns.
- Plain JavaScript questions with no React runtime impact.

## Core workflow

1. Define component ownership and server/client boundaries first.
2. Place state at the lowest level that preserves correctness.
3. Keep effects explicit, idempotent, and cleanup-safe.
4. Profile rerender behavior before reaching for memoization.
5. Validate accessible interaction states and error/loading behavior.

## Baseline standards

- Prefer pure render logic and explicit mutation boundaries.
- Derive state instead of duplicating it.
- Use transitions and suspense intentionally for UX, not fashion.
- Keep form and async flows predictable.
- Pair implementation with focused component or interaction tests.

## Avoid

- Blanket memoization with no evidence.
- Effect-driven derived-state loops.
- Hidden shared mutable module state.
- Client-only patterns when server rendering would simplify the surface.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/rendering-state-checklist.md` | The task needs a deeper playbook for state placement, effect discipline, rendering cost, and interaction-level verification. |
