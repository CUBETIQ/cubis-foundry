---
name: "react-expert"
description: "Use for framework-agnostic React architecture with React 19 patterns, state design, and performance tuning."
license: MIT
metadata:
  version: "2.0.0"
  domain: "frontend"
  role: "specialist"
  stack: "react"
  baseline: "React 19"
---
# React Expert

## Scope

- Use this for React component and state architecture.
- Use `nextjs-developer` for Next.js routing/App Router specifics.

## When to use

- Building reusable component systems.
- Designing local/shared/remote state boundaries.
- Refactoring for rendering performance.
- Implementing robust form and async UI flows.

## Core workflow

1. Model component responsibilities and ownership boundaries.
2. Decide state location and mutation strategy.
3. Implement with accessible markup and predictable effects.
4. Measure rerender behavior before applying memoization.
5. Validate with component and interaction tests.

## Baseline standards

- Prefer pure render logic and explicit side-effect boundaries.
- Use transitions/suspense intentionally for UX.
- Keep effects idempotent and cleanup-safe.
- Derive state instead of duplicating it.
- Keep mutation logic centralized when state grows.

## Avoid

- Blanket memoization without profiling evidence.
- Effect-driven derived state loops.
- Hidden shared mutable module state.

## Reference files

- `references/react-19-features.md`
- `references/hooks-patterns.md`
- `references/state-management.md`
- `references/performance.md`
- `references/testing-react.md`
- `references/server-components.md`
