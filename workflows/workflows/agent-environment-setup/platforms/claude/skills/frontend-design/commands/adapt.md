# /adapt

Make it responsive: mobile-first, fluid scaling, container queries.

## What It Does

Reviews and improves responsive behavior. Ensures the design works across screen sizes using mobile-first CSS, fluid scaling, and modern container queries. Targets real device breakpoints and interaction patterns.

## Responsive Strategy

### Mobile-First Cascade

```css
/* Base: mobile (320px+) */
.layout {
  padding: var(--space-4);
}

/* Tablet (768px+) */
@media (min-width: 48em) {
  .layout {
    padding: var(--space-6);
  }
}

/* Desktop (1024px+) */
@media (min-width: 64em) {
  .layout {
    padding: var(--space-8);
  }
}
```

### Fluid Design

- Use `clamp()` for font sizes, spacing, and widths
- Size formula: `clamp(min, preferred, max)`
- Preferred value uses `vi` or `vw` units for viewport-relative scaling

### Container Queries

```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
```

### Adaptation Checklist

- [ ] Navigation collapses to hamburger or bottom nav on mobile
- [ ] Tables become cards or scrollable on narrow screens
- [ ] Images scale with `max-width: 100%` and proper `aspect-ratio`
- [ ] Touch targets are ≥ 44×44px on mobile
- [ ] Side-by-side layouts stack vertically on mobile
- [ ] Font sizes remain readable without zooming (≥ 16px body)
- [ ] Horizontal scroll is eliminated on all breakpoints

## Usage

- `/adapt` — make the component fully responsive
- `/adapt mobile` — optimize specifically for mobile
- `/adapt tablet` — optimize for tablet layout
