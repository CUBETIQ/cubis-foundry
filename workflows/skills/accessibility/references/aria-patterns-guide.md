# ARIA Patterns Guide

Load this when building custom widgets that need correct ARIA patterns.

## Dialog (Modal)

- Container: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title.
- Focus: move to first focusable element on open; return to trigger on close.
- Keyboard: Escape closes; Tab/Shift+Tab cycles within modal (focus trap).
- Background: `aria-hidden="true"` on content behind the modal, or use `<dialog>` element.

## Tabs

- Tab list: `role="tablist"`.
- Tabs: `role="tab"`, `aria-selected="true|false"`, `aria-controls` pointing to panel.
- Panels: `role="tabpanel"`, `aria-labelledby` pointing to tab.
- Keyboard: Arrow keys switch tabs; Tab moves into panel content.

## Menu / Dropdown

- Trigger: `aria-haspopup="true"`, `aria-expanded="true|false"`.
- Menu: `role="menu"`.
- Items: `role="menuitem"`.
- Keyboard: Enter/Space opens; Arrow keys navigate; Escape closes.

## Combobox (Autocomplete)

- Input: `role="combobox"`, `aria-expanded`, `aria-controls` pointing to listbox.
- Listbox: `role="listbox"`.
- Options: `role="option"`, `aria-selected`.
- Keyboard: Arrow keys navigate options; Enter selects; Escape closes.
- Live region or `aria-activedescendant` announces current option.

## Accordion

- Headers: `<button>` or `role="button"` with `aria-expanded` and `aria-controls`.
- Panels: referenced by `aria-controls`, hidden via `hidden` attribute (not `display: none` with no ARIA).
- Keyboard: Enter/Space toggles; optionally Arrow keys between headers.

## Toast / Notification

- Container: `role="status"` and `aria-live="polite"` for non-critical; `role="alert"` for critical.
- Dismissible: include a close button with accessible label.
- Auto-dismiss: never auto-dismiss error notifications; status messages can auto-dismiss after 5+ seconds.

## General principles

- Test with screen reader BEFORE shipping — automated tools catch only ~30% of issues.
- Keep ARIA attributes in sync with visual state — stale `aria-expanded` is worse than no ARIA.
- Prefer `aria-labelledby` over `aria-label` when a visible label already exists.
- Use `aria-describedby` for supplementary help text, not as a replacement for labels.
