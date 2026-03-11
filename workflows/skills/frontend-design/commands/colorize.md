# /colorize

Rework the color palette: harmonies, contrast, dark mode, semantic tokens.

## What It Does

Evaluates and improves the color system. Generates harmonious palettes using OKLCH, ensures sufficient contrast, builds semantic color tokens, and creates dark mode variants.

## Color Workflow

### 1. Audit Current Palette

- List all unique colors in the codebase
- Check contrast ratios against WCAG 2.2 AA
- Identify redundant or near-duplicate colors

### 2. Build Semantic Tokens

```css
:root {
  /* Surface */
  --color-surface-primary: oklch(98% 0.005 250);
  --color-surface-secondary: oklch(95% 0.008 250);
  --color-surface-elevated: oklch(100% 0 0);

  /* Text */
  --color-text-primary: oklch(20% 0.02 250);
  --color-text-secondary: oklch(45% 0.02 250);
  --color-text-muted: oklch(60% 0.01 250);

  /* Interactive */
  --color-interactive-primary: oklch(55% 0.18 250);
  --color-interactive-hover: oklch(48% 0.18 250);
  --color-interactive-active: oklch(42% 0.18 250);

  /* Feedback */
  --color-success: oklch(55% 0.15 145);
  --color-warning: oklch(70% 0.15 80);
  --color-error: oklch(55% 0.2 25);
  --color-info: oklch(55% 0.15 250);
}
```

### 3. Dark Mode

- Swap lightness values — don't just invert
- Reduce chroma slightly in dark mode to avoid glowing
- Test contrast ratios in both modes

### 4. Apply the 60-30-10 Rule

- 60% dominant (surface/background)
- 30% secondary (cards, sections, nav)
- 10% accent (CTAs, highlights, active states)

## Usage

- `/colorize` — full color system review and rebuild
- `/colorize dark-mode` — create or fix dark mode
- `/colorize contrast` — fix contrast issues only
- `/colorize tokens` — extract hardcoded colors into tokens
