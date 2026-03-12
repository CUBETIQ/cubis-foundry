# Motion Design Reference

## Timing Guidelines

| Animation type                                  | Duration        | Note                     |
| ----------------------------------------------- | --------------- | ------------------------ |
| Micro-interaction (button press, toggle)        | 100–200ms       | Fast, snappy feedback    |
| State transition (expand, collapse, tab switch) | 200–350ms       | Noticeable but not slow  |
| Entry animation (fade in, slide up)             | 300–500ms       | Gentle, welcoming        |
| Exit animation                                  | 150–300ms       | Always faster than entry |
| Page transition                                 | 300–600ms       | Smooth handoff           |
| Complex orchestration (staggered list)          | 400–800ms total | 50–80ms stagger per item |

Rule: exits should be 30-50% faster than entries. Users want content to leave faster than it arrives.

## Easing Curves

Use exponential easing for natural deceleration:

```css
/* Preferred curves */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

/* Spring-like (for playful UIs only) */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

Never use `linear` for UI motion — it feels mechanical. Never use `ease-in` alone — it accelerates into the stop, which feels unnatural.

Avoid bounce and elastic easing — they feel dated and tacky. Real objects decelerate smoothly.

## What to Animate

**GPU-friendly (transform + opacity only):**

```css
.element {
  transition:
    transform 300ms var(--ease-out-quart),
    opacity 300ms var(--ease-out-quart);
  will-change: transform; /* hint, use sparingly */
}
```

**Never animate these directly** — they trigger layout recalculation:

- `width`, `height`, `padding`, `margin`, `top`, `left`
- Use `transform: scale()` or `translate()` instead

**Height animation trick** — use CSS Grid:

```css
.collapsible {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 350ms var(--ease-out-quart);
}
.collapsible.open {
  grid-template-rows: 1fr;
}
.collapsible > .inner {
  overflow: hidden;
}
```

## Staggered Reveals

Focus on one well-orchestrated page load with staggered reveals rather than scattered micro-interactions:

```css
.stagger-item {
  opacity: 0;
  transform: translateY(12px);
  animation: reveal 500ms var(--ease-out-expo) forwards;
}
.stagger-item:nth-child(1) {
  animation-delay: 0ms;
}
.stagger-item:nth-child(2) {
  animation-delay: 60ms;
}
.stagger-item:nth-child(3) {
  animation-delay: 120ms;
}
/* 50-80ms per item, cap at ~6 items then batch the rest */
```

## Reduced Motion

Always respect user preference:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

For critical state changes (tab switch, panel expand), use a simple crossfade instead of removing all motion.

## Perceived Performance

Motion can make loading feel faster:

1. **Skeleton screens** — show layout structure immediately, fill in content
2. **Progressive reveal** — show the first visible content immediately, animate in the rest
3. **Optimistic updates** — animate the change immediately, sync with server in background
4. **Loading indicators** — use progress bars (deterministic) over spinners (indeterminate) when possible

## Anti-Patterns

- Bounce/elastic easing — feels dated, tacky
- Animating all properties at once — layout thrashing
- 1-second+ transitions — feels sluggish
- Animation for decoration only — motion should communicate state
- Scroll-jacking — hostile to user control
- Auto-playing animations that can't be stopped — accessibility violation
