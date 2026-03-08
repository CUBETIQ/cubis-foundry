# Token And Composition Checklist

Load this when Tailwind structure needs more detail than the root skill.

## Tokens first

- Start with semantic color, spacing, type, and radius tokens.
- Keep arbitrary values exceptional.
- Prefer system-level consistency over local styling convenience.

## Composition

- Use utilities directly when the pattern is local and clear.
- Extract components or semantic wrappers when repetition and intent justify it.
- Use container queries deliberately for component context.

## Maintainability

- Keep class lists readable.
- Avoid mixing incompatible config-era habits into a CSS-first setup.
- Re-check whether a design-system primitive should exist before copying long utility sets.
