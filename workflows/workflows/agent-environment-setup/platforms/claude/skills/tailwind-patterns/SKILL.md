---
name: "tailwind-patterns"
description: "Use for Tailwind CSS v4 architecture, CSS-first theme setup, utility composition, container-query usage, design-token hygiene, and dark-mode strategy."
license: MIT
metadata:
  version: "4.0.0"
  domain: "frontend"
  role: "specialist"
  stack: "tailwindcss"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "Tailwind CSS v4"
  tags:
    [
      "tailwindcss",
      "css",
      "design-tokens",
      "container-queries",
      "frontend",
      "dark-mode",
      "responsive",
      "variants",
    ]
  provenance:
    source: "cubis-foundry canonical"
    snapshot: "2026-03-09 enhanced with v4 depth, dark-mode, variant strategy, and performance guidance"
---

# Tailwind Patterns

## When to use

- Building or refactoring Tailwind-based UI systems.
- Choosing theme token structure and CSS-first configuration.
- Applying container queries, responsive composition, and utility extraction.
- Reviewing class composition for maintainability and scale.
- Setting up dark mode, color-scheme toggling, or multi-theme systems.
- Optimizing Tailwind output for production bundle size.

## When not to use

- React or Next architectural questions with no Tailwind concern.
- Visual design direction with no implementation-system decision.
- Plain CSS work where Tailwind is not the styling system.
- Runtime style changes that require CSS-in-JS rather than utility classes.

## Core workflow

1. Confirm whether the codebase is truly Tailwind-first and which v4 features are active.
2. Establish semantic tokens (color, spacing, type, radius) before piling on utilities.
3. Define dark-mode and color-scheme strategy at the theme level, not per-component.
4. Use responsive and container-query rules deliberately at the component boundary.
5. Extract repeated patterns only when reuse and readability clearly improve.
6. Verify the result stays readable, consistent, and easy to extend.

## Baseline standards

- Prefer CSS-first theme and token definition in v4-era setups.
- Keep utility composition semantic at the component boundary.
- Use container queries for component context, not everything.
- Treat arbitrary values as exceptions, not the system.
- Keep spacing, typography, and color scales coherent.
- Define dark mode via `@custom-variant` or built-in `dark:` — never inline JavaScript toggling of raw classes.
- Use CSS custom properties for tokens that need runtime switching.

## Implementation guidance

- Use `@theme` blocks to define design tokens as CSS custom properties.
- Prefer `@layer` directives to control specificity ordering.
- Use `@variant` for semantic state grouping (e.g., `@variant hover, focus-visible`).
- Keep component-level `@apply` usage to shared design-system primitives, not arbitrary shortcuts.
- Use `@container` at the component wrapper level with named containers for clarity.
- Compose responsive with container queries: responsive for page layout, container queries for component-internal layout.

## Dark mode and theming

- Define color tokens as HSL or OKLCH custom properties for easy theme switching.
- Use `@custom-variant dark` with a class or media-query strategy — pick one per project and enforce it.
- Keep contrast ratios WCAG AA minimum (4.5:1 text, 3:1 large text / UI).
- Test both themes with real content, not just color swatches.

## Performance and production

- Purge unused styles by keeping utility usage in template files Tailwind can scan.
- Avoid dynamic class construction (`bg-${color}-500`) — Tailwind cannot detect these at build time.
- Keep `@apply` chains short — long chains defeat tree-shaking.
- Use `content` configuration to limit scan scope in monorepos.
- Prefer targeted `@import` over importing the entire Tailwind base when only utilities are needed.

## Avoid

- Dumping arbitrary values into every class list.
- Mixing old config habits into a CSS-first setup without reason.
- Repeating long class strings when a component or token should exist.
- Styling choices that fight the design system instead of clarifying it.
- Dynamic class name construction that breaks purge scanning.
- Overriding Tailwind with inline styles or `!important` instead of fixing token conflicts.
- Using `@apply` with responsive or state variants — compose those in the template.

## References

Load on demand. Do not preload all reference files.

| File                                            | Load when                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `references/token-and-composition-checklist.md` | You need deeper Tailwind guidance for v4 token setup, utility composition, container queries, and class extraction rules. |
| `references/dark-mode-and-theming-guide.md`     | The task involves dark mode setup, multi-theme systems, color-scheme toggling, or OKLCH token architecture.               |
| `references/performance-and-purge-checklist.md` | The task involves production build optimization, bundle size reduction, or monorepo content configuration.                |
