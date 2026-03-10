# Token And Composition Checklist

Load this when Tailwind structure needs more detail than the root skill.

## Tokens first

- Start with semantic color, spacing, type, and radius tokens in `@theme` blocks.
- Use OKLCH or HSL for color tokens — they compose better for dark-mode switching.
- Map raw scale values to semantic names: `--color-surface`, `--color-text-primary`, not `--gray-900`.
- Keep arbitrary values exceptional and document them when unavoidable.
- Prefer system-level consistency over local styling convenience.
- Use CSS custom properties for tokens that must change at runtime (theme switching).

## Composition

- Use utilities directly when the pattern is local and clear.
- Extract components or semantic wrappers when repetition and intent justify it.
- Use `@apply` only for true design-system primitives (`.btn-primary`, `.card-surface`), not for shortcuts.
- Prefer composition via component abstraction (React/Vue components) over `@apply` chains.
- Use container queries deliberately for component-internal context, not for page-level layout.
- Name containers explicitly: `@container sidebar` is clearer than anonymous containers.

## Responsive vs container queries

- Responsive breakpoints: page layout decisions (sidebar visibility, grid columns).
- Container queries: component-internal decisions (card layout, nav style based on parent width).
- Never mix both for the same layout decision — pick the one that matches the context.

## Variant strategy

- Use `@variant` for grouped hover/focus/active states when multiple utilities share the same trigger.
- Keep variant nesting shallow — `group-hover:focus:dark:` chains are unreadable.
- Prefer `focus-visible` over `focus` for keyboard-accessible focus rings.

## Maintainability

- Keep class lists readable — break long lists across multiple lines in templates.
- Avoid mixing incompatible config-era habits into a CSS-first v4 setup.
- Re-check whether a design-system primitive should exist before copying long utility sets.
- Use Tailwind Prettier plugin or consistent class ordering to reduce merge conflicts.
- Keep utilities grouped by concern: layout → spacing → typography → color → effects.
