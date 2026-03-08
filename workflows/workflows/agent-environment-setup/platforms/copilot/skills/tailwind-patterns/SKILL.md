---
name: "tailwind-patterns"
description: "Use for Tailwind CSS v4 architecture, CSS-first theme setup, utility composition, container-query usage, and design-token hygiene."
license: MIT
metadata:
  version: "3.0.0"
  domain: "frontend"
  role: "specialist"
  stack: "tailwindcss"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "Tailwind CSS v4"
  tags: ["tailwindcss", "css", "design-tokens", "container-queries", "frontend"]
---
# Tailwind Patterns

## When to use

- Building or refactoring Tailwind-based UI systems.
- Choosing theme token structure and CSS-first configuration.
- Applying container queries, responsive composition, and utility extraction.
- Reviewing class composition for maintainability and scale.

## When not to use

- React or Next architectural questions with no Tailwind concern.
- Visual design direction with no implementation-system decision.
- Plain CSS work where Tailwind is not the styling system.

## Core workflow

1. Confirm whether the codebase is truly Tailwind-first and which v4 features are active.
2. Establish semantic tokens before piling on utilities.
3. Use responsive and container-query rules deliberately at the component boundary.
4. Extract repeated patterns only when reuse and readability clearly improve.
5. Verify the result stays readable, consistent, and easy to extend.

## Baseline standards

- Prefer CSS-first theme and token definition in v4-era setups.
- Keep utility composition semantic at the component boundary.
- Use container queries for component context, not everything.
- Treat arbitrary values as exceptions, not the system.
- Keep spacing, typography, and color scales coherent.

## Avoid

- Dumping arbitrary values into every class list.
- Mixing old config habits into a CSS-first setup without reason.
- Repeating long class strings when a component or token should exist.
- Styling choices that fight the design system instead of clarifying it.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/token-and-composition-checklist.md` | You need deeper Tailwind guidance for v4 token setup, utility composition, container queries, and class extraction rules. |
