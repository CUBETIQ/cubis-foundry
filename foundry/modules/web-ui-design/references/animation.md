# Animation and Motion Design

## Purpose of Motion

Motion serves four functions in an interface. Every animation must serve at least one:

| Function | Description | Example |
|----------|-------------|---------|
| **Feedback** | Confirm that an action was received | Button press scale, toggle switch slide |
| **Orientation** | Show where something came from or went to | Slide-in panel, expand/collapse |
| **Focus** | Direct attention to something important | Pulse on new notification, highlight on error |
| **Continuity** | Maintain context during state changes | Page transition, list reorder |

If an animation does not serve any of these, remove it. Decorative motion is visual noise.

## Timing and Duration

### Duration Scale

| Category | Duration | Use for |
|----------|----------|---------|
| Instant | 0-100ms | Hover states, color changes, opacity toggles |
| Fast | 100-200ms | Button feedback, small element transitions |
| Normal | 200-350ms | Panel slides, accordion expand, modal enter |
| Slow | 350-500ms | Page transitions, large layout shifts |
| Deliberate | 500ms+ | Onboarding sequences, complex data visualizations |

Rules:
- Small elements move faster than large elements.
- Elements entering the screen take longer than elements leaving.
- Exit animations should be 20-30% shorter than enter animations (users already understand the context).

### The 100ms Rule

Users perceive responses under 100ms as instantaneous. Use this for:
- Hover state changes
- Toggle switches
- Active/pressed states
- Focus rings

If an interaction response takes more than 100ms, it needs an animation to bridge the gap. If it takes more than 300ms, show a loading indicator.

## Easing Functions

### Use Exponential Easing

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);    /* ease-out-expo: fast start, slow end */
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);      /* ease-in-expo: slow start, fast end */
  --ease-in-out: cubic-bezier(0.87, 0, 0.13, 1);  /* ease-in-out-expo: symmetric */
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1); /* slight overshoot */
}
```

| Pattern | Easing | Why |
|---------|--------|-----|
| Element entering | ease-out | Fast arrival, gentle settle — feels responsive |
| Element leaving | ease-in | Gentle departure, fast exit — feels snappy |
| State change | ease-in-out | Smooth transition between two states |
| Playful interaction | ease-out-back | Slight overshoot adds personality (use sparingly) |

### Avoid These

- `linear` — Feels mechanical and robotic. Nothing in nature moves linearly.
- `ease` (CSS default) — The asymmetry is wrong: slow start on enters feels sluggish.
- `bounce` / `elastic` — Feels dated (2015-era Material Design). Use only for game-like interfaces.

## Animation Properties

### Animate Only Compositor Properties

The browser can animate these properties on the GPU without triggering layout or paint:

| Property | Performance | Use for |
|----------|------------|---------|
| `transform` | GPU-composited | Move, scale, rotate elements |
| `opacity` | GPU-composited | Fade in/out |
| `filter` | GPU-composited (mostly) | Blur, brightness transitions |
| `clip-path` | GPU-composited | Reveal animations |

Never animate: `width`, `height`, `padding`, `margin`, `top`, `left`, `border-width`, `font-size`. These trigger layout recalculation on every frame.

### Height Animation Pattern

Animating `height` from `0` to `auto` is a common need but cannot use `height` directly. Use `grid-template-rows`:

```css
.collapsible {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-normal) var(--ease-out);
}

.collapsible[data-open="true"] {
  grid-template-rows: 1fr;
}

.collapsible > .content {
  overflow: hidden;
}
```

This animates the row from 0 fraction to 1 fraction, smoothly expanding the content.

## Staggered Animations

When multiple elements enter as a group (list items, cards, menu items), stagger their entrance:

```css
.stagger-item {
  opacity: 0;
  transform: translateY(8px);
  animation: stagger-in 300ms var(--ease-out) forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
.stagger-item:nth-child(4) { animation-delay: 150ms; }

@keyframes stagger-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Rules for stagger:
- 30-80ms delay between items (faster for many items).
- Maximum total stagger duration: 400ms. Beyond that, users lose patience.
- Cap at 6-8 staggered items. Animate the rest simultaneously.
- Use a smaller translateY (4-8px) — large movements are distracting.

## Micro-Interactions

### Button Press

```css
.button:active {
  transform: scale(0.97);
  transition: transform 80ms var(--ease-out);
}
```

### Toggle Switch

```css
.toggle-thumb {
  transition: transform 200ms var(--ease-out);
}
.toggle[aria-checked="true"] .toggle-thumb {
  transform: translateX(20px);
}
```

### Skeleton Loading

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-raised) 25%,
    var(--color-surface) 50%,
    var(--color-surface-raised) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Reduced Motion

Always respect `prefers-reduced-motion`:

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

This approach:
- Sets duration to near-zero rather than disabling entirely, so `animationend` events still fire.
- Preserves the final state of animations (elements appear in their target position).
- Disables smooth scrolling.
- Stops infinite animations after one iteration.

For critical motion (e.g., a progress indicator), provide an alternative:

```css
@media (prefers-reduced-motion: reduce) {
  .progress-spinner {
    /* Replace spinning with a static indicator */
    animation: none;
    border-style: dotted; /* Visual differentiation without motion */
  }
}
```

## View Transitions API

For page-level transitions in SPAs:

```css
::view-transition-old(root) {
  animation: fade-out 200ms var(--ease-in);
}

::view-transition-new(root) {
  animation: fade-in 300ms var(--ease-out);
}

/* Named transitions for specific elements */
.hero-image {
  view-transition-name: hero;
}

::view-transition-group(hero) {
  animation-duration: 350ms;
  animation-timing-function: var(--ease-out);
}
```

## Performance Monitoring

| Metric | Target | Measured with |
|--------|--------|---------------|
| Frame rate during animation | 60fps (16.6ms/frame) | DevTools Performance tab |
| Composite layers | < 30 active layers | DevTools Layers panel |
| Layout shifts during animation | 0 CLS | Lighthouse / Web Vitals |
| Paint regions | Minimal repaint area | DevTools Rendering > Paint flashing |

If animations drop below 60fps:
1. Check if you are animating layout properties (height, width, margin).
2. Check if too many elements are animating simultaneously.
3. Use `will-change: transform` sparingly on elements that will animate.
4. Reduce the number of animated properties per element.
