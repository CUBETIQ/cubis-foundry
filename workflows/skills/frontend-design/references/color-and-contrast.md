# Color & Contrast Reference

## Color Space

Use OKLCH for perceptually uniform color manipulation. Colors that share the same L (lightness) value actually look equally bright, unlike HSL.

```css
:root {
  /* Define palette in OKLCH */
  --brand-primary: oklch(55% 0.2 250); /* vibrant blue-ish */
  --brand-accent: oklch(70% 0.18 150); /* green accent */
  --text-primary: oklch(20% 0.02 250); /* near-black, tinted */
  --text-secondary: oklch(45% 0.02 250); /* medium gray, tinted */
  --bg-primary: oklch(98% 0.005 250); /* near-white, tinted */
  --bg-secondary: oklch(95% 0.01 250); /* subtle off-white */
}
```

## The 60-30-10 Rule

Every palette needs a distribution hierarchy:

- **60%** — Dominant (backgrounds, large surfaces)
- **30%** — Secondary (cards, sections, supporting areas)
- **10%** — Accent (CTAs, highlights, key interactive elements)

Dominant colors with sharp accents outperform timid, evenly distributed palettes.

## Tinted Neutrals

Never use pure gray. Always tint neutrals toward the brand hue:

```css
/* Instead of gray-500: hsl(0, 0%, 50%) */
/* Use brand-tinted neutral: */
--neutral-500: oklch(55% 0.015 250); /* 250 = brand hue */
```

Even a 1-2% chroma hint creates subconscious cohesion. The user won't notice the tint — they'll just feel the palette is "professional."

## Dark Mode

Do not simply invert lightness. Dark mode requires its own decisions:

1. Use elevated surfaces (slightly lighter) instead of borders to create hierarchy
2. Reduce chroma — highly saturated colors on dark backgrounds cause eye strain
3. Use a dark background between 15-20% lightness (not pure black)
4. Increase font weight by one step (light → regular, regular → medium)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: oklch(15% 0.01 250);
    --bg-secondary: oklch(20% 0.015 250);
    --text-primary: oklch(92% 0.01 250);
    --text-secondary: oklch(70% 0.015 250);
    --brand-primary: oklch(70% 0.15 250); /* reduced chroma */
  }
}
```

Or use the `light-dark()` function:

```css
:root {
  color-scheme: light dark;
  --bg: light-dark(oklch(98% 0.005 250), oklch(15% 0.01 250));
}
```

## Contrast Ratios (WCAG 2.1 AA)

| Element                            | Minimum ratio | Check                            |
| ---------------------------------- | ------------- | -------------------------------- |
| Normal text (< 18px)               | 4.5:1         | Body copy, labels, descriptions  |
| Large text (≥ 18px bold or ≥ 24px) | 3:1           | Headings, large buttons          |
| UI components                      | 3:1           | Borders, icons, focus indicators |
| Non-text contrast                  | 3:1           | Charts, data visualizations      |

## Color Psychology by Context

| Context              | Approach                                                               | Avoid                                       |
| -------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| Finance / Banking    | Deep navy, forest green, gold accents. Trust = desaturation.           | Bright red (danger), neon anything          |
| Health / Wellness    | Sage, warm earth tones, soft coral. Calming = low chroma.              | Clinical white, cold blue                   |
| Developer tools      | Any bold direction works. Own the choice.                              | Fintech blue, AI purple-cyan                |
| E-commerce           | Neutral base, single strong accent for CTAs                            | Rainbow — competing accents kill conversion |
| Creative / Portfolio | Match the work. The palette should feel authored.                      | Generic gradients that override the content |
| SaaS / Dashboard     | Functional neutrals, semantic color for status (success/warning/error) | Decorative color that competes with data    |

## Anti-Patterns

- Gray text on colored backgrounds — washed out. Use a tinted shade of the background.
- Pure black (#000) on pure white (#fff) — harsh. Tint both.
- Purple-to-blue gradients — the default AI palette.
- Neon on dark with glow effects — screams "AI generated."
- Gradient text for "impact" on metrics/headings — decorative, not meaningful.
