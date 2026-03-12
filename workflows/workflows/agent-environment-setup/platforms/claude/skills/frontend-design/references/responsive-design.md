# Responsive Design Reference

## Mobile-First Approach

Write base styles for mobile, then layer on complexity:

```css
/* Base: mobile */
.layout {
  padding: var(--space-4);
}

/* Tablet+ */
@media (min-width: 768px) {
  .layout {
    padding: var(--space-8);
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

/* Desktop+ */
@media (min-width: 1024px) {
  .layout {
    grid-template-columns: 1fr 2fr 1fr;
    max-width: 1200px;
    margin-inline: auto;
  }
}
```

## Fluid Design

Replace fixed breakpoints with fluid values where possible:

```css
/* Fluid container */
.container {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto;
}

/* Fluid typography */
h1 {
  font-size: clamp(1.875rem, 1.4rem + 2.4vw, 3rem);
}

/* Fluid spacing */
.section {
  padding-block: clamp(2rem, 1rem + 5vw, 6rem);
}

/* Fluid grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: clamp(1rem, 0.5rem + 2vw, 2rem);
}
```

## Container Queries

Use container queries for component-level responsiveness:

```css
/* Define container */
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* Component responds to its container, not viewport */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: var(--space-4);
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
  .card img {
    aspect-ratio: 16/9;
    object-fit: cover;
  }
}
```

## Breakpoint Strategy

| Name | Width         | Target                      |
| ---- | ------------- | --------------------------- |
| xs   | < 480px       | Small phones                |
| sm   | 480px–767px   | Large phones, small tablets |
| md   | 768px–1023px  | Tablets, small laptops      |
| lg   | 1024px–1279px | Laptops, desktops           |
| xl   | 1280px–1535px | Large desktops              |
| 2xl  | ≥ 1536px      | Ultra-wide, presentations   |

Prefer fluid design over hard breakpoints. Use breakpoints only when the layout fundamentally changes (e.g., sidebar collapse, navigation switch).

## Adaptation Principles

1. **Adapt, don't amputate** — all functionality should be accessible on all devices. Reorganize, don't remove.
2. **Touch targets** — minimum 44×44px on mobile. Space interactive elements at least 8px apart.
3. **Navigation** — mobile: bottom tab bar or hamburger with full-screen overlay. Desktop: persistent sidebar or top nav.
4. **Data tables** — don't horizontally scroll on mobile. Transform into card layout or priority-column format.
5. **Images** — serve appropriate sizes with `srcset` and `sizes`. Use `aspect-ratio` to prevent layout shift.

```html
<img
  srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1200.webp 1200w"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
  src="hero-800.webp"
  alt="Descriptive alt text"
  loading="lazy"
  decoding="async"
  width="800"
  height="450"
/>
```

## Testing Checklist

- [ ] Content readable without horizontal scroll at 320px
- [ ] Touch targets ≥ 44px on mobile
- [ ] No text smaller than 16px on mobile (prevents iOS zoom)
- [ ] Forms usable with on-screen keyboard (inputs not obscured)
- [ ] Images scale correctly, aspect ratios preserved
- [ ] Navigation accessible on all breakpoints
- [ ] Landscape orientation handled gracefully
