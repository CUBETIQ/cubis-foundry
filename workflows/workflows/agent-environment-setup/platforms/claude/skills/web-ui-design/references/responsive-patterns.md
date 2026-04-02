# Responsive Patterns

## Strategy: Intrinsic Design Over Breakpoints

Prefer layouts that adapt naturally to available space using fluid techniques (clamp, min/max, flex-grow, container queries) rather than hardcoded breakpoints. Use breakpoints only when a layout genuinely needs to restructure at a specific threshold.

### Fluid Typography

```css
/* Scales from 1rem at 320px viewport to 1.5rem at 1200px viewport */
h2 {
  font-size: clamp(1rem, 0.75rem + 1.25vw, 1.5rem);
}

/* General formula: clamp(min, preferred, max)
   preferred = min + (max - min) * (100vw - minViewport) / (maxViewport - minViewport)
   Simplified: use calc with vw units */
```

### Fluid Spacing

```css
:root {
  --space-section: clamp(2rem, 1rem + 4vw, 6rem);
  --space-stack: clamp(1rem, 0.5rem + 2vw, 2rem);
  --space-inline: clamp(0.75rem, 0.5rem + 1vw, 1.5rem);
}
```

## Container Queries

Container queries make components responsive to their container rather than the viewport. This is essential for reusable components that appear in different layout contexts (sidebar, main content, modal, grid cell).

### Setup

```css
/* 1. Define a containment context on the parent */
.card-grid {
  container-type: inline-size;
  container-name: card-area;
}

/* 2. Write queries against the container */
@container card-area (min-width: 400px) {
  .card {
    grid-template-columns: 120px 1fr;
    gap: var(--space-4);
  }
}

@container card-area (min-width: 600px) {
  .card {
    grid-template-columns: 200px 1fr auto;
  }
}
```

### When to Use Container Queries vs. Media Queries

| Use case | Tool | Reason |
|----------|------|--------|
| Component adapts to its slot | `@container` | The same component in a sidebar needs a different layout than in main content |
| Page-level layout changes | `@media` | Sidebar appears/disappears, navigation switches from horizontal to hamburger |
| Typography scaling | `clamp()` + `vw` | Fluid scaling without any queries |
| Image art direction | `<picture>` + `@media` | Different image crops for different viewports |

## Layout Patterns

### The Holy Grail with CSS Grid

```css
.page {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header"
    "main"
    "footer";
  min-height: 100dvh;
}

@media (min-width: 768px) {
  .page {
    grid-template-columns: 240px 1fr;
    grid-template-areas:
      "header header"
      "sidebar main"
      "footer footer";
  }
}
```

### Auto-Fit Grid (No Breakpoints Needed)

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: var(--space-6);
}
```

This grid:
- Creates columns that are at least 280px wide
- Automatically adjusts the number of columns based on available space
- Falls to a single column when the container is narrower than 280px
- Requires zero breakpoints

### Sidebar Layout (Intrinsic)

```css
.with-sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
}

.with-sidebar > :first-child {
  flex-basis: 240px;
  flex-grow: 1;
}

.with-sidebar > :last-child {
  flex-basis: 0;
  flex-grow: 999;
  min-width: 60%;
}
```

When the container is too narrow for both columns, the sidebar wraps below the main content. No breakpoint needed.

### Stack Layout

```css
.stack > * + * {
  margin-block-start: var(--space-stack, 1rem);
}
```

The lobotomized owl selector (`> * + *`) adds spacing between consecutive children without adding space before the first or after the last child.

## Touch Targets

| Standard | Minimum size | Recommended |
|----------|-------------|-------------|
| WCAG 2.1 AA | 24x24px | 44x44px |
| Apple HIG | 44x44pt | 44x44pt |
| Material Design | 48x48dp | 48x48dp |

For touch devices, ensure all interactive targets are at least 44x44px. Use padding rather than scaling the visual element:

```css
.icon-button {
  /* Visual size: 24px icon */
  width: 24px;
  height: 24px;
  /* Touch target: 44px via padding */
  padding: 10px;
  /* Total touch area: 44px x 44px */
}
```

## Responsive Images

### srcset for Resolution Switching

```html
<img
  src="photo-800.webp"
  srcset="photo-400.webp 400w, photo-800.webp 800w, photo-1200.webp 1200w"
  sizes="(min-width: 768px) 50vw, 100vw"
  alt="Product photo"
  loading="lazy"
  decoding="async"
/>
```

### picture for Art Direction

```html
<picture>
  <source media="(min-width: 1024px)" srcset="hero-wide.webp" />
  <source media="(min-width: 640px)" srcset="hero-medium.webp" />
  <img src="hero-narrow.webp" alt="Hero banner" />
</picture>
```

## Responsive Tables

Tables on small screens are notoriously difficult. Three strategies:

### 1. Horizontal Scroll

```css
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

Best for data-heavy tables where all columns are essential.

### 2. Stacked Cards

```css
@container (max-width: 600px) {
  table, thead, tbody, tr, td, th {
    display: block;
  }
  thead { display: none; }
  td::before {
    content: attr(data-label);
    font-weight: 600;
    display: block;
  }
}
```

Best for tables with few columns where each row is a meaningful record.

### 3. Priority Columns

Hide lower-priority columns progressively:

```css
@container (max-width: 800px) { .col-priority-3 { display: none; } }
@container (max-width: 600px) { .col-priority-2 { display: none; } }
```

Best for tables with many columns of varying importance.

## Testing Checklist

| Test | Method | Pass criteria |
|------|--------|--------------|
| Content is readable at 320px | Resize browser or DevTools | No horizontal scroll on text content, no truncated UI |
| Touch targets are 44px+ | DevTools element measurement | All buttons, links, inputs are at least 44x44px on touch |
| Images scale correctly | Resize browser | No overflow, no extreme stretching, appropriate crops |
| Forms are usable on mobile | Test on actual device | Inputs are large enough, keyboard type matches, labels visible |
| Navigation is accessible | Test hamburger/mobile nav | Menu opens, closes, is keyboard navigable, focus is trapped |
| Container queries fire correctly | Place component in different containers | Component adapts to container, not viewport |
