# WCAG Audit Checklist

Load this when running a full accessibility audit against WCAG 2.2 AA.

## Perceivable

- [ ] All images have appropriate alt text (or `alt=""` for decorative).
- [ ] Video has captions; audio has transcripts.
- [ ] Content structure uses proper heading hierarchy (h1 → h2 → h3, no skips).
- [ ] Color is not the sole means of conveying information.
- [ ] Text contrast meets 4.5:1 (normal) and 3:1 (large text) ratios.
- [ ] Non-text contrast meets 3:1 for UI components and graphical objects.
- [ ] Content reflows at 400% zoom without horizontal scrolling.
- [ ] Text spacing can be overridden without breaking layout.

## Operable

- [ ] All functionality is available via keyboard.
- [ ] No keyboard traps — user can always leave any component.
- [ ] Focus order is logical and matches visual order.
- [ ] Focus indicators are visible in all themes.
- [ ] No content flashes more than 3 times per second.
- [ ] Skip links exist for repeated navigation blocks.
- [ ] Touch targets are at least 24x24 CSS pixels (WCAG 2.2).
- [ ] Dragging operations have non-dragging alternatives (WCAG 2.2).
- [ ] Timeouts are adjustable or warned about in advance.

## Understandable

- [ ] Page language is declared (`<html lang="en">`).
- [ ] Form inputs have visible labels (not just placeholder text).
- [ ] Error messages identify the field and suggest correction.
- [ ] Required fields are indicated before submission.
- [ ] Navigation is consistent across pages.
- [ ] Consistent identification for components with same function.

## Robust

- [ ] HTML validates with no duplicate IDs or broken ARIA references.
- [ ] ARIA roles, states, and properties are used correctly.
- [ ] Status messages are programmatically announced without requiring focus.
- [ ] Custom components expose correct name, role, and value to assistive technology.
