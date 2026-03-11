# /animate

Add or improve motion: entrances, transitions, loading states.

## What It Does

Adds purposeful animation to the UI. Every animation must serve a function — guiding attention, showing relationships, or providing feedback. Never animate for decoration alone.

## Motion Principles

1. **Functional, not decorative** — animation explains spatial relationships or state changes
2. **Fast by default** — 150–250ms for micro-interactions, 300–500ms for layout changes
3. **Ease appropriately** — ease-out for entrances, ease-in for exits, ease-in-out for transitions
4. **Respect preferences** — always wrap in `@media (prefers-reduced-motion: no-preference)`

## Animation Recipes

### Entrance

```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.enter {
  animation: fade-in-up 300ms ease-out both;
}
```

### Staggered List

```css
.list-item {
  animation: fade-in-up 300ms ease-out both;
  animation-delay: calc(var(--i) * 60ms);
}
```

### Expand/Collapse

```css
.collapsible {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease-in-out;
}
.collapsible[open] {
  grid-template-rows: 1fr;
}
.collapsible > * {
  overflow: hidden;
}
```

### Skeleton Loading

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-3) 25%,
    var(--gray-2) 50%,
    var(--gray-3) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
```

## Usage

- `/animate` — add appropriate motion to the component
- `/animate entrance` — add entrance animations
- `/animate loading` — add loading state animations
