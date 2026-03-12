# /optimize

Improve rendering performance: layout shifts, paint costs, asset loading.

## What It Does

Reviews frontend code for performance issues that affect perceived speed and visual stability. Targets layout shifts, expensive paint operations, unoptimized assets, and render-blocking patterns.

## Performance Targets

| Metric | Good    | Needs Work |
| ------ | ------- | ---------- |
| LCP    | < 2.5s  | > 4.0s     |
| CLS    | < 0.1   | > 0.25     |
| INP    | < 200ms | > 500ms    |

## Checklist

### Layout Stability

- Images and embeds have explicit `width`/`height` or `aspect-ratio`
- Fonts use `font-display: swap` with size-adjusted fallbacks
- Dynamic content reserves space before loading

### Paint Performance

- Animations use `transform`/`opacity` only (compositor-friendly)
- Avoid animating `width`, `height`, `top`, `left`, `margin`, `padding`
- Use `will-change` sparingly and only on elements about to animate
- Avoid `filter: blur()` on large areas

### Asset Loading

- Images use modern formats (WebP, AVIF) with `<picture>` fallback
- Above-fold images use `loading="eager"`, below-fold use `loading="lazy"`
- Critical CSS is inlined; non-critical is deferred
- Fonts are preloaded with `<link rel="preload">`

### Rendering

- Reduce DOM depth — flatten unnecessary wrapper elements
- Use CSS containment (`contain: layout style paint`) on isolated components
- Virtualize long lists (> 100 items)

## Usage

- `/optimize` — full performance review
- `/optimize images` — focus on image loading
- `/optimize animations` — focus on animation performance
