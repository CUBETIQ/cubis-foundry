# Performance Budgets

## Core Web Vitals Targets

| Metric                          | Good    | Needs Improvement | Poor    |
| ------------------------------- | ------- | ----------------- | ------- |
| LCP (Largest Contentful Paint)  | < 2.5s  | 2.5–4.0s          | > 4.0s  |
| INP (Interaction to Next Paint) | < 200ms | 200–500ms         | > 500ms |
| CLS (Cumulative Layout Shift)   | < 0.1   | 0.1–0.25          | > 0.25  |

## Bundle Size Budgets

| Resource                 | Budget         | Measurement                           |
| ------------------------ | -------------- | ------------------------------------- |
| Initial JS (compressed)  | < 150 KB       | gzip/brotli size of critical-path JS  |
| Initial CSS (compressed) | < 50 KB        | gzip/brotli size of critical-path CSS |
| Per-route JS chunk       | < 50 KB        | code-split chunk per route            |
| Single component         | < 10 KB        | component + its direct dependencies   |
| New dependency           | Justify > 5 KB | check bundlephobia before adding      |

## Rendering Budgets

| Check                | Target                            |
| -------------------- | --------------------------------- |
| Component re-renders | ≤ 1 per user interaction          |
| DOM nodes per page   | < 1500 total                      |
| DOM depth            | < 15 levels                       |
| Event listeners      | No duplicates, cleanup on unmount |
| Third-party scripts  | ≤ 3 per page, all async/defer     |

## Image Budgets

| Image Type    | Format       | Max Size |
| ------------- | ------------ | -------- |
| Hero/banner   | WebP/AVIF    | < 200 KB |
| Content image | WebP/AVIF    | < 100 KB |
| Thumbnail     | WebP         | < 30 KB  |
| Icon          | SVG (inline) | < 3 KB   |
| Avatar        | WebP         | < 15 KB  |

## Font Budgets

| Check               | Target                                           |
| ------------------- | ------------------------------------------------ |
| Total web fonts     | ≤ 2 families                                     |
| Font file size      | < 50 KB per weight (WOFF2)                       |
| Font weights loaded | ≤ 3 per family                                   |
| Font display        | `font-display: swap` with size-adjusted fallback |

## How to Measure

- **Lighthouse**: Overall performance score, CWV metrics
- **WebPageTest**: Real connection testing, filmstrip
- **Bundle analyzer**: webpack-bundle-analyzer, source-map-explorer
- **React DevTools Profiler**: Component render counts and timing
- **Performance API**: `performance.mark()` / `performance.measure()` for custom timings
