# Dark Mode And Theming Guide

Load this when the task involves dark mode, multi-theme systems, or color-scheme toggling.

## Strategy selection

- **Class strategy** (`dark` class on `<html>`): Best when user preference must persist across visits, or when more than two themes exist.
- **Media strategy** (`prefers-color-scheme`): Best for respecting OS-level preference with no user toggle.
- Pick one per project and enforce it. Do not mix strategies.

## Token architecture for theming

- Define color tokens as OKLCH or HSL custom properties:
  ```css
  @theme {
    --color-surface: oklch(98% 0.01 250);
    --color-text: oklch(15% 0.02 250);
  }
  @custom-variant dark {
    --color-surface: oklch(12% 0.01 250);
    --color-text: oklch(92% 0.01 250);
  }
  ```
- Keep token names semantic: `--color-surface`, `--color-text-muted`, `--color-border`.
- Never reference raw palette values (`gray-900`) in components — always go through tokens.

## Contrast and accessibility

- Maintain WCAG AA contrast ratios: 4.5:1 for normal text, 3:1 for large text and UI components.
- Test with forced-colors mode (Windows High Contrast) — utility classes may be overridden.
- Use `forced-color-adjust: none` sparingly and only on decorative elements.
- Test focus rings in both themes — they must remain visible.

## Implementation checklist

- [ ] Color tokens defined as custom properties, not static values.
- [ ] Dark variant applied at the theme level, not scattered per-component.
- [ ] Images and media have appropriate dark-mode treatment (invert, opacity, or alternate assets).
- [ ] Shadows use OKLCH with alpha for theme-aware depth, not hardcoded hex values.
- [ ] Borders and dividers use token references, not raw colors.
- [ ] Form elements and inputs tested in both themes.
- [ ] Code blocks and syntax highlighting tested in both themes.

## Multi-theme systems (beyond dark/light)

- Use CSS custom properties as the switching mechanism.
- Keep theme definitions in a single `themes.css` file, not scattered across components.
- Use a `data-theme` attribute on `<html>` for theme selection.
- Keep each theme self-contained — no theme should depend on another theme's tokens.
