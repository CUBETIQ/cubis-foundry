# Theming Patterns

## CSS Custom Properties (Recommended)

### Light/Dark via data attribute

```css
:root,
[data-theme="light"] {
  --color-text-primary: oklch(15% 0.01 250);
  --color-surface-primary: oklch(98% 0.005 250);
  --color-surface-elevated: oklch(100% 0 0);
  --color-border-default: oklch(85% 0.01 250);
  --color-interactive-primary: oklch(55% 0.18 250);
}

[data-theme="dark"] {
  --color-text-primary: oklch(92% 0.01 250);
  --color-surface-primary: oklch(15% 0.02 250);
  --color-surface-elevated: oklch(20% 0.02 250);
  --color-border-default: oklch(30% 0.02 250);
  --color-interactive-primary: oklch(65% 0.16 250);
}
```

### System preference detection

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* dark tokens here — only if user hasn't explicitly chosen light */
  }
}
```

### Dark mode adjustments

- Reduce chroma by 10-15% to prevent colors from glowing on dark backgrounds
- Increase lightness of surfaces slightly (pure black is harsh; use oklch 12-18%)
- Flip shadow strategy: dark mode uses lighter inner glows or border highlights
- Re-verify contrast ratios — what passes in light may fail in dark

## Brand Theming

Override accent colors only; keep structural tokens (spacing, radius, typography) consistent.

```css
[data-brand="brand-a"] {
  --color-interactive-primary: oklch(55% 0.2 280);
  --color-interactive-hover: oklch(48% 0.2 280);
}

[data-brand="brand-b"] {
  --color-interactive-primary: oklch(55% 0.2 150);
  --color-interactive-hover: oklch(48% 0.2 150);
}
```

## JS Framework Theme Provider

```tsx
// React context pattern
const ThemeContext = createContext<'light' | 'dark'>('light');

function ThemeProvider({ children, theme }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## Token Cascade Rules

1. Component tokens override semantic tokens
2. Semantic tokens override primitive tokens
3. Theme tokens override the defaults at the semantic level
4. Never skip layers — component tokens should reference semantic, not primitive

```
[primitive] → [semantic] → [component]
                  ↑
              [theme override]
```
