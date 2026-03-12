# /harden

Strengthen accessibility: ARIA, keyboard nav, screen reader support, contrast.

## What It Does

Reviews code for accessibility violations and hardens it to WCAG 2.2 AA standards. Covers semantic HTML, ARIA usage, keyboard navigation, screen reader announcements, and color contrast.

## Accessibility Checklist

### Semantic HTML

- Use `<button>` for actions, `<a>` for navigation — never `<div onclick>`
- Use heading hierarchy (`h1` → `h2` → `h3`) without skipping levels
- Use `<nav>`, `<main>`, `<aside>`, `<footer>` landmarks
- Lists use `<ul>`/`<ol>`, not styled `<div>` sequences

### ARIA

- Prefer native HTML semantics over ARIA — `<button>` over `role="button"`
- Dynamic content uses `aria-live` regions (polite for updates, assertive for errors)
- Modals trap focus and use `aria-modal="true"` + `role="dialog"`
- Custom widgets have appropriate `role`, `aria-label`, and state attributes

### Keyboard Navigation

- All interactive elements are reachable via Tab
- Tab order matches visual order (no positive `tabindex`)
- Escape closes modals/dropdowns and returns focus to trigger
- Arrow keys navigate within composite widgets (tabs, menus, radio groups)
- Skip-to-content link is the first focusable element

### Color & Contrast

- Text contrast ratio ≥ 4.5:1 (normal text), ≥ 3:1 (large text, 18px+ or 14px+ bold)
- UI component contrast ≥ 3:1 against adjacent colors
- Information is never conveyed by color alone — use icons, patterns, or text

### Forms

- Every input has a visible `<label>` (or `aria-label` for icon-only inputs)
- Required fields use `aria-required="true"` and visible indicator
- Error messages are linked to inputs via `aria-describedby`
- Form submission errors announce via `aria-live` region

## Usage

- `/harden` — full accessibility audit
- `/harden keyboard` — keyboard navigation only
- `/harden contrast` — color contrast check only
- `/harden forms` — form accessibility only
