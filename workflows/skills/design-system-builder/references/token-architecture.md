# Token Architecture

## Naming Convention

Tokens follow a 3-tier naming pattern: `{category}-{property}-{variant}-{state}`

```
color-text-primary          → semantic token for primary text
color-text-primary-hover    → with state modifier
color-surface-elevated      → semantic token for elevated surfaces
spacing-4                   → spacing scale value (4 × base unit)
radius-md                   → medium border radius
shadow-lg                   → large elevation shadow
```

## Token Layers

### Layer 1: Primitives (raw values)

```css
:root {
  --blue-50: oklch(97% 0.02 250);
  --blue-100: oklch(93% 0.04 250);
  --blue-500: oklch(55% 0.18 250);
  --blue-900: oklch(25% 0.08 250);
  --gray-50: oklch(97% 0.005 250);
  --gray-900: oklch(15% 0.01 250);
}
```

Never reference primitive tokens in components directly.

### Layer 2: Semantic (meaning-based)

```css
:root {
  --color-text-primary: var(--gray-900);
  --color-text-secondary: var(--gray-600);
  --color-surface-primary: var(--gray-50);
  --color-surface-elevated: var(--white);
  --color-interactive-primary: var(--blue-500);
  --color-border-default: var(--gray-200);
}
```

Semantic tokens encode intent, not appearance.

### Layer 3: Component (local overrides)

```css
.button {
  --button-bg: var(--color-interactive-primary);
  --button-text: var(--color-text-on-interactive);
  --button-radius: var(--radius-md);
  --button-padding-x: var(--spacing-4);
  --button-padding-y: var(--spacing-2);
}
```

Component tokens allow local overrides without breaking the system.

## Spacing Scale

Use a consistent base unit (4px or 8px):

| Token | 4px base | 8px base |
|-------|----------|----------|
| `spacing-1` | 4px | 8px |
| `spacing-2` | 8px | 16px |
| `spacing-3` | 12px | 24px |
| `spacing-4` | 16px | 32px |
| `spacing-6` | 24px | 48px |
| `spacing-8` | 32px | 64px |
| `spacing-12` | 48px | 96px |

## Typography Scale

```css
:root {
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

## Shadow Scale

```css
:root {
  --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.05);
  --shadow-md: 0 4px 6px oklch(0% 0 0 / 0.07), 0 2px 4px oklch(0% 0 0 / 0.06);
  --shadow-lg: 0 10px 15px oklch(0% 0 0 / 0.1), 0 4px 6px oklch(0% 0 0 / 0.05);
  --shadow-xl: 0 20px 25px oklch(0% 0 0 / 0.1), 0 8px 10px oklch(0% 0 0 / 0.04);
}
```

Use layered shadows (ambient + direct) for realistic depth.
