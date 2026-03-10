---
name: "accessibility"
description: "Use when auditing, implementing, or reviewing web accessibility (WCAG, ARIA, keyboard navigation, screen reader support, and inclusive interaction patterns)."
license: MIT
metadata:
  version: "1.0.0"
  domain: "frontend"
  role: "specialist"
  stack: "web-accessibility"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "WCAG 2.2 AA"
  tags:
    [
      "accessibility",
      "a11y",
      "wcag",
      "aria",
      "screen-reader",
      "keyboard",
      "inclusive-design",
    ]
  provenance:
    source: "cubis-foundry canonical"
    snapshot: "2026-03-09 initial from deep research on awesome-copilot a11y agents and WCAG 2.2"
---
# Accessibility

## When to use

- Auditing existing UI for WCAG 2.2 AA compliance.
- Building new components that must be keyboard-navigable and screen-reader friendly.
- Reviewing PR diffs for accessibility regressions.
- Fixing focus management, ARIA labeling, or color contrast issues.
- Choosing between native HTML semantics and ARIA attributes.

## When not to use

- Pure backend API work with no user-facing interface.
- Visual design decisions where the concern is aesthetics, not usability.
- Performance optimization with no accessibility dimension.

## Core workflow

1. Identify the interaction pattern and which WCAG success criteria apply.
2. Use semantic HTML first — only add ARIA when native semantics are insufficient.
3. Verify keyboard flow: focus order, focus visibility, escape/close behavior.
4. Check screen reader announcements for dynamic content and state changes.
5. Validate contrast ratios and motion preferences before shipping.

## Baseline standards

- Use native HTML elements (`<button>`, `<nav>`, `<dialog>`, `<details>`) before custom ARIA widgets.
- Every interactive element must be keyboard-reachable and operable.
- Every image has `alt` text (or `alt=""` for decorative images).
- Color alone is never the only way to convey information.
- Focus indicators are visible in all themes (light, dark, high contrast).
- Dynamic content changes are announced via live regions or focus management.
- Forms have visible labels, error messages linked to inputs, and clear required-field indicators.

## ARIA rules

- First rule of ARIA: don't use ARIA if a native HTML element does the job.
- Never change native semantics unless absolutely necessary (`<button>` is always better than `<div role="button">`).
- All interactive ARIA elements must be keyboard-operable.
- All ARIA references (`aria-labelledby`, `aria-describedby`, `aria-controls`) must point to existing element IDs.
- Use `aria-live="polite"` for status updates, `aria-live="assertive"` only for critical errors.

## Testing checklist

- Tab through every interactive element — focus order must be logical.
- Operate every control with keyboard only (Enter, Space, Escape, Arrow keys).
- Run axe-core or Lighthouse accessibility audit — zero critical/serious violations.
- Test with a screen reader (VoiceOver, NVDA, or JAWS) on at least one real flow.
- Check `prefers-reduced-motion` — animations must respect this media query.
- Verify contrast with a tool (minimum 4.5:1 for normal text, 3:1 for large text and UI).
- Test with zoom at 200% — layout must not break or hide content.

## Avoid

- Using `div` or `span` with click handlers instead of `<button>`.
- Suppressing focus outlines globally (`outline: none` without replacement).
- Using `aria-hidden="true"` on elements that contain interactive content.
- Auto-playing audio or video without user consent or a stop mechanism.
- Using only color to indicate errors, status, or selected state.
- Positive `tabindex` values — they create unpredictable focus order.
- Tooltip-only labels with no accessible name on the trigger element.

## References

Load on demand. Do not preload all reference files.

| File                                 | Load when                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `references/wcag-audit-checklist.md` | You need a structured WCAG 2.2 AA audit checklist for a full-page or full-app review.                      |
| `references/aria-patterns-guide.md`  | The task involves custom widgets (modals, menus, tabs, trees, comboboxes) that need correct ARIA patterns. |
