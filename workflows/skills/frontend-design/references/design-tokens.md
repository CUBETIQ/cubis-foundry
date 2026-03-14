# Design Tokens

## Token Architecture

Design tokens are the atomic values of a design system: colors, spacing, typography, shadows, radii, and motion. They replace hardcoded values with named variables that enforce visual consistency and enable theme switching.

### Three-Layer Token Structure

```
Raw Tokens        →  Semantic Tokens     →  Component Tokens
--color-blue-500  →  --color-primary     →  --button-bg-primary
--space-4         →  --space-element-gap →  --card-padding
--font-size-lg    →  --heading-size-2    →  --modal-title-size
```

**Layer 1: Raw Tokens** — The complete palette of available values. Named by their intrinsic property (blue-500, space-4, font-size-lg). Never used directly in component code.

**Layer 2: Semantic Tokens** — Named by intent (primary, danger, success, surface, on-surface). These are what components reference. Theme switching replaces the mappings in this layer.

**Layer 3: Component Tokens** — Optional. Scoped to a specific component (--button-bg, --card-border). Useful when a component needs unique values not covered by semantic tokens.

## CSS Custom Properties Implementation

```css
/* Layer 1: Raw tokens — defined once, never consumed directly */
:root {
  --raw-blue-50: oklch(0.97 0.02 250);
  --raw-blue-100: oklch(0.93 0.04 250);
  --raw-blue-200: oklch(0.87 0.08 250);
  --raw-blue-300: oklch(0.78 0.12 250);
  --raw-blue-400: oklch(0.68 0.15 250);
  --raw-blue-500: oklch(0.55 0.18 250);
  --raw-blue-600: oklch(0.48 0.18 250);
  --raw-blue-700: oklch(0.40 0.16 250);
  --raw-blue-800: oklch(0.32 0.14 250);
  --raw-blue-900: oklch(0.24 0.10 250);

  --raw-neutral-50: oklch(0.98 0.005 250);
  --raw-neutral-100: oklch(0.96 0.005 250);
  --raw-neutral-200: oklch(0.92 0.005 250);
  --raw-neutral-300: oklch(0.87 0.008 250);
  --raw-neutral-400: oklch(0.70 0.010 250);
  --raw-neutral-500: oklch(0.55 0.010 250);
  --raw-neutral-600: oklch(0.45 0.010 250);
  --raw-neutral-700: oklch(0.35 0.010 250);
  --raw-neutral-800: oklch(0.25 0.010 250);
  --raw-neutral-900: oklch(0.15 0.010 250);

  /* Spacing scale: 4px base */
  --raw-space-0: 0;
  --raw-space-1: 0.25rem;   /* 4px */
  --raw-space-2: 0.5rem;    /* 8px */
  --raw-space-3: 0.75rem;   /* 12px */
  --raw-space-4: 1rem;      /* 16px */
  --raw-space-5: 1.25rem;   /* 20px */
  --raw-space-6: 1.5rem;    /* 24px */
  --raw-space-8: 2rem;      /* 32px */
  --raw-space-10: 2.5rem;   /* 40px */
  --raw-space-12: 3rem;     /* 48px */
  --raw-space-16: 4rem;     /* 64px */

  /* Font sizes: modular scale (1.25 ratio) */
  --raw-font-xs: 0.75rem;
  --raw-font-sm: 0.875rem;
  --raw-font-md: 1rem;
  --raw-font-lg: 1.125rem;
  --raw-font-xl: 1.25rem;
  --raw-font-2xl: 1.5rem;
  --raw-font-3xl: 1.875rem;
  --raw-font-4xl: 2.25rem;
  --raw-font-5xl: 3rem;

  /* Radii */
  --raw-radius-sm: 0.25rem;
  --raw-radius-md: 0.5rem;
  --raw-radius-lg: 0.75rem;
  --raw-radius-xl: 1rem;
  --raw-radius-full: 9999px;
}

/* Layer 2: Semantic tokens — light theme */
:root {
  --color-primary: var(--raw-blue-500);
  --color-primary-hover: var(--raw-blue-600);
  --color-primary-active: var(--raw-blue-700);
  --color-on-primary: var(--raw-neutral-50);

  --color-surface: var(--raw-neutral-50);
  --color-surface-raised: var(--raw-neutral-100);
  --color-on-surface: var(--raw-neutral-900);
  --color-on-surface-muted: var(--raw-neutral-600);

  --color-border: var(--raw-neutral-200);
  --color-border-strong: var(--raw-neutral-300);

  --color-danger: oklch(0.55 0.2 25);
  --color-success: oklch(0.55 0.15 145);
  --color-warning: oklch(0.75 0.15 80);
}

/* Layer 2: Semantic tokens — dark theme */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: var(--raw-blue-400);
    --color-primary-hover: var(--raw-blue-300);
    --color-primary-active: var(--raw-blue-200);
    --color-on-primary: var(--raw-neutral-900);

    --color-surface: var(--raw-neutral-900);
    --color-surface-raised: var(--raw-neutral-800);
    --color-on-surface: var(--raw-neutral-100);
    --color-on-surface-muted: var(--raw-neutral-400);

    --color-border: var(--raw-neutral-700);
    --color-border-strong: var(--raw-neutral-600);
  }
}
```

## OKLCH Color Space

Use OKLCH (`oklch(lightness chroma hue)`) for perceptually uniform colors:

- **Lightness (0-1):** How light or dark. 0 is black, 1 is white.
- **Chroma (0-0.4):** Saturation intensity. 0 is gray.
- **Hue (0-360):** Color wheel angle. 0/360 is red, 120 is green, 250 is blue.

Advantages over HSL:
- Perceptually uniform: equal lightness values actually look equally bright across hues.
- Programmatic palette generation: adjust one axis and the result is predictable.
- Better for accessibility: lightness values directly correlate with perceived contrast.

## Tinting Neutrals

Never use pure gray. Tint all neutrals toward the brand hue for subconscious cohesion:

```css
/* Pure gray — feels disconnected from brand */
--neutral-500: oklch(0.55 0 0);

/* Brand-tinted neutral — same lightness, tiny chroma toward blue hue */
--neutral-500: oklch(0.55 0.010 250);
```

The chroma value (0.005-0.015) is subtle enough to be invisible in isolation but creates warmth and cohesion when the entire palette is tinted consistently.

## Fluid Tokens with clamp()

Replace fixed breakpoint values with fluid tokens that scale smoothly:

```css
:root {
  --font-heading: clamp(1.5rem, 1rem + 2vw, 3rem);
  --space-section: clamp(2rem, 1rem + 4vw, 6rem);
  --container-max: clamp(20rem, 90vw, 72rem);
}
```

The formula `clamp(min, preferred, max)`:
- Below the minimum viewport: uses the `min` value.
- At the maximum viewport: uses the `max` value.
- Between: interpolates smoothly using the `preferred` value.

## Token Naming Convention

| Category | Pattern | Example |
|----------|---------|---------|
| Color | `--color-{role}` or `--color-{role}-{state}` | `--color-primary`, `--color-primary-hover` |
| Spacing | `--space-{number}` or `--space-{semantic}` | `--space-4`, `--space-section-gap` |
| Typography | `--font-{property}-{size}` | `--font-size-lg`, `--font-weight-bold` |
| Radius | `--radius-{size}` | `--radius-md`, `--radius-full` |
| Shadow | `--shadow-{level}` | `--shadow-sm`, `--shadow-lg` |
| Motion | `--duration-{speed}` / `--easing-{type}` | `--duration-fast`, `--easing-out` |
| Z-index | `--z-{layer}` | `--z-dropdown`, `--z-modal`, `--z-toast` |

## Anti-Patterns

- Never use raw tokens in component code. Always go through semantic tokens.
- Never use `!important` to override tokens. If a token is wrong, fix the token.
- Never define tokens inside component stylesheets. Tokens live in a central file.
- Never create one-off values that bypass the token system. If the value is needed, add a token.
- Never use more than 10-12 steps in a color scale. Human perception cannot distinguish finer gradations.
