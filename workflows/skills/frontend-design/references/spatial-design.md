# Spatial Design Reference

## The 8-Point Grid

Base all spacing on multiples of 8px (or 4px for fine adjustments):

```css
:root {
  --space-1: 0.25rem; /* 4px  — fine adjustment */
  --space-2: 0.5rem; /* 8px  — tight */
  --space-3: 0.75rem; /* 12px — compact */
  --space-4: 1rem; /* 16px — default */
  --space-6: 1.5rem; /* 24px — comfortable */
  --space-8: 2rem; /* 32px — generous */
  --space-12: 3rem; /* 48px — section gap */
  --space-16: 4rem; /* 64px — major section */
  --space-24: 6rem; /* 96px — hero spacing */
  --space-32: 8rem; /* 128px — maximum breathing room */
}
```

## Visual Rhythm

Rhythm comes from **variation**, not uniformity. Alternate tight and generous spacing to create a visual beat:

- Group related elements with tight spacing (space-2 to space-4)
- Separate unrelated groups with generous spacing (space-8 to space-16)
- Use progressive spacing in lists (space between items < space between groups < space between sections)

The eye should be guided, not uniform padding everywhere.

## Fluid Spacing

Use `clamp()` for spacing that breathes with viewport:

```css
:root {
  --section-gap: clamp(2rem, 1rem + 5vw, 6rem);
  --content-padding: clamp(1rem, 0.5rem + 2.5vw, 3rem);
}
```

## Grid Systems

### CSS Grid for page-level layout

```css
.page-layout {
  display: grid;
  grid-template-columns:
    [full-start] minmax(var(--content-padding), 1fr)
    [content-start] min(65ch, 100%)
    [content-end] minmax(var(--content-padding), 1fr)
    [full-end];
}
.page-layout > * {
  grid-column: content;
}
.page-layout > .full-bleed {
  grid-column: full;
}
```

### Subgrid for component alignment

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: var(--space-6);
}
```

## Container Queries

Use container queries for component-level responsiveness instead of viewport breakpoints:

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
@container card (max-width: 399px) {
  .card {
    flex-direction: column;
  }
}
```

## Layout Composition Principles

1. **Asymmetry creates interest** — Equal columns feel static. Try 2:3 or 1:2 ratios.
2. **Whitespace is a design element** — Generous whitespace signals confidence and quality.
3. **Break the grid for emphasis** — One element that crosses column boundaries draws the eye.
4. **Proximity = relationship** — Things that are close appear related. Control perceived grouping through spacing, not just borders.
5. **Align to a baseline grid** — Text across columns should align on the same horizontal baseline.

## Anti-Patterns

- Same padding everywhere — monotonous, no visual hierarchy.
- Cards as the default container — not everything needs a border and shadow.
- Cards inside cards — visual noise. Flatten.
- Identical card grids (icon + heading + text × 6) — templated and forgettable.
- Center-everything layouts — asymmetric left-alignment feels more designed.
