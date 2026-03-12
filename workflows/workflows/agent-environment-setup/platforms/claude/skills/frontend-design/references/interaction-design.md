# Interaction Design Reference

## Form Design

1. **Labels above inputs** — always visible, never placeholder-only labels
2. **Inline validation** — validate on blur, not on every keystroke
3. **Error placement** — show error text below the field, highlighted in red with an icon
4. **Success confirmation** — subtle check or green border, not a modal
5. **Field grouping** — logical sections with clear headers (Personal, Payment, Shipping)
6. **Smart defaults** — pre-fill when possible (country from locale, email domain suggestions)

```css
/* Input states */
.input {
  border: 1.5px solid var(--border-default);
}
.input:focus {
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px var(--brand-primary-alpha-15);
  outline: none;
}
.input:invalid:blur {
  border-color: var(--color-error);
}
.input:valid {
  border-color: var(--color-success);
}
```

## Focus Management

1. **Visible focus indicators** — never remove `:focus-visible` outlines without providing a better alternative
2. **Focus trapping** — trap focus in modals, dialogs, and drawers
3. **Focus restoration** — return focus to trigger element when closing overlays
4. **Skip links** — provide "Skip to main content" for keyboard users

```css
:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}
/* Remove default only when custom is provided */
:focus:not(:focus-visible) {
  outline: none;
}
```

## Loading Patterns

| Pattern           | When to use                        | When NOT to use               |
| ----------------- | ---------------------------------- | ----------------------------- |
| Skeleton screen   | Content-heavy pages, initial loads | Simple actions, small updates |
| Inline spinner    | Button actions, small areas        | Full-page loads               |
| Progress bar      | File uploads, multi-step processes | Unknown duration              |
| Optimistic update | Toggle, like, bookmark             | Destructive actions           |
| Backdrop overlay  | Modal operations                   | Background tasks              |

Loading buttons should:

- Show a spinner replacing the label or beside it
- Disable the button to prevent double-submission
- Keep the button the same width (no layout shift)

## Progressive Disclosure

Start simple, reveal complexity through interaction:

1. **Progressive forms** — show basic options first, "Advanced settings" expandable
2. **Hover reveals** — secondary actions appear on hover (with keyboard alternative)
3. **Drill-down** — master list → detail view, not everything on one screen
4. **Contextual toolbars** — show relevant actions based on selection
5. **Smart defaults with override** — choose the best default, let users change it

## Empty States

Empty states are teaching moments, not dead ends:

- **Explain** what this space is for
- **Guide** the user to their first action
- **Illustrate** with a relevant visual (not a generic sad-face icon)
- **Provide a CTA** — one clear primary action

Bad: "No items found." / Good: "No projects yet. Create your first project to get started."

## Toast / Notification Patterns

1. **Placement** — bottom-center or top-right (don't stack more than 3)
2. **Timing** — auto-dismiss success after 4-5 seconds, persist errors until dismissed
3. **Actions** — include "Undo" for destructive operations
4. **Accessibility** — use `role="status"` or `aria-live="polite"` for non-critical, `role="alert"` for errors

## Hover & Touch Considerations

- Don't hide essential actions behind hover — they're invisible on touch devices
- Touch targets: minimum 44×44px (iOS) or 48×48dp (Android)
- Provide touch alternatives for all hover interactions (long-press, swipe, tap-to-reveal)
- `@media (hover: hover)` — use to gate hover-only interactions

## Anti-Patterns

- Placeholder-only labels — disappear when typing, fail accessibility
- Modals for simple confirmations — use inline confirmation instead
- Double-confirm dialogs — "Are you sure?" + "Are you really sure?"
- Disabled buttons without explanation — tell the user what's missing
- Infinite scroll without "back to top" — disorienting
- Auto-focusing the wrong field — focus the first empty required field
