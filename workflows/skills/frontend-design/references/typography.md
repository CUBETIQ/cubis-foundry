# Typography Reference

## Type Scale

Use a modular scale with fluid sizing. The scale creates consistent hierarchy without arbitrary sizes.

```css
/* Fluid type scale using clamp() */
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
--text-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
--text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
--text-lg: clamp(1.125rem, 1rem + 0.6vw, 1.25rem);
--text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
--text-2xl: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
--text-3xl: clamp(1.875rem, 1.4rem + 2.4vw, 2.75rem);
--text-4xl: clamp(2.25rem, 1.5rem + 3.75vw, 4rem);
```

## Font Pairing Principles

1. **Contrast** — Pair display with body: a distinctive display font (serif, slab, or geometric sans) with a highly readable body font.
2. **Shared DNA** — Fonts should share proportions or baseline characteristics even when their styles differ.
3. **Max two families** — Use weight and style variations within a family rather than adding a third font.

### Pairing approaches that create distinction

| Display          | Body                                        | Feeling                |
| ---------------- | ------------------------------------------- | ---------------------- |
| Playfair Display | Source Sans 3                               | Editorial, luxury      |
| Space Grotesk    | Libre Baskerville                           | Technical yet warm     |
| Fraunces         | Work Sans                                   | Playful sophistication |
| Instrument Serif | Inter (exception — acceptable as body only) | Modern editorial       |
| Cabinet Grotesk  | Satoshi                                     | Clean contemporary     |
| Clash Display    | General Sans                                | Bold geometric         |

### Fonts to avoid as primary choices

Inter, Roboto, Arial, Open Sans, Helvetica Neue, SF Pro — these are system/default fonts. They're invisible. They signal "I didn't choose a font."

Exception: Inter or system fonts are acceptable as body text in data-heavy applications (dashboards, admin panels) where readability at small sizes matters more than aesthetic distinction.

## Font Loading Strategy

1. Use `font-display: swap` for body text (content first)
2. Use `font-display: optional` for display text when layout shift is unacceptable
3. Preload the primary body font: `<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>`
4. Subset fonts to needed character ranges when possible
5. Use variable fonts to reduce total font weight

## Readability Rules

- **Line height**: 1.5–1.7 for body text, 1.1–1.3 for headings
- **Line length**: 45–75 characters per line (use `max-width: 65ch` as a baseline)
- **Paragraph spacing**: Use `margin-bottom` equal to line-height for natural rhythm
- **Letter spacing**: Tighten headings slightly (-0.01em to -0.03em), leave body at default
- **Font weight for contrast**: Use at least 2 weight steps of difference (e.g., 400 body, 700 heading)

## OpenType Features

Enable useful OpenType features when available:

```css
.body-text {
  font-feature-settings:
    "kern" 1,
    "liga" 1,
    "calt" 1;
  font-variant-numeric: oldstyle-nums proportional-nums;
}
.heading {
  font-feature-settings:
    "kern" 1,
    "liga" 1,
    "ss01" 1; /* stylistic set */
  font-variant-numeric: lining-nums tabular-nums;
}
.data-table {
  font-variant-numeric: tabular-nums; /* aligned columns */
}
```
