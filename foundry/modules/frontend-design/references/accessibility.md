# Accessibility

## WCAG 2.1 Compliance Levels

| Level | Requirement | Target |
|-------|-------------|--------|
| A | Minimum accessibility | Mandatory baseline |
| AA | Standard accessibility | Production target for most applications |
| AAA | Enhanced accessibility | Target for government, healthcare, education |

Production applications should target WCAG 2.1 Level AA at minimum. Level AAA is recommended for applications serving diverse or vulnerable populations.

## Color Contrast

### Ratios

| Element | Minimum ratio (AA) | Enhanced ratio (AAA) |
|---------|-------------------|---------------------|
| Normal text (< 18px / < 14px bold) | 4.5:1 | 7:1 |
| Large text (>= 18px / >= 14px bold) | 3:1 | 4.5:1 |
| UI components and graphical objects | 3:1 | 3:1 |
| Focus indicators | 3:1 against adjacent colors | 3:1 |

### Testing contrast with OKLCH

OKLCH lightness values provide a quick heuristic: a difference of 0.40+ in lightness between text and background usually meets AA for normal text.

```css
/* Background: L=0.95, Text: L=0.25 → difference 0.70 → easily meets AA */
--bg: oklch(0.95 0.005 250);
--text: oklch(0.25 0.010 250);

/* Background: L=0.95, Text: L=0.60 → difference 0.35 → likely fails AA for small text */
--bg: oklch(0.95 0.005 250);
--text-muted: oklch(0.60 0.010 250);
```

Always verify with a contrast checker tool. The OKLCH heuristic is an approximation, not a guarantee.

## Semantic HTML

Use the correct HTML element before reaching for ARIA:

| Need | Use | Not |
|------|-----|-----|
| Navigation | `<nav>` | `<div role="navigation">` |
| Button | `<button>` | `<div onClick>` |
| Link | `<a href>` | `<span onClick>` |
| Heading | `<h1>`-`<h6>` | `<div class="heading">` |
| List | `<ul>` / `<ol>` | `<div>` with styled items |
| Form field | `<input>` / `<select>` / `<textarea>` | Custom `<div>` widget |
| Table | `<table>` with `<thead>`, `<tbody>` | `<div>` grid layout |
| Dialog | `<dialog>` | `<div role="dialog">` |
| Section | `<section>` with heading | `<div>` |

The first rule of ARIA: do not use ARIA if a native HTML element provides the semantics.

## ARIA Attributes

### States

| Attribute | Purpose | Used on |
|-----------|---------|---------|
| `aria-expanded` | Indicates whether a collapsible section is open | Buttons that toggle panels, accordions |
| `aria-selected` | Indicates selected item in a set | Tabs, listbox options |
| `aria-checked` | Indicates checkbox/switch state | Custom checkboxes, toggle switches |
| `aria-disabled` | Indicates non-interactive state | Disabled buttons (prefer over HTML `disabled` for custom elements) |
| `aria-busy` | Indicates loading state | Containers being updated, buttons during submission |
| `aria-invalid` | Indicates validation failure | Form inputs with errors |
| `aria-current` | Indicates current item in a set | Active navigation link, current page |
| `aria-pressed` | Indicates toggle button state | Like/bookmark buttons |

### Relationships

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `aria-labelledby` | Labels an element using another element's text | Dialog title labels the dialog |
| `aria-describedby` | Provides additional description | Error message describes an input |
| `aria-controls` | Identifies the element controlled by this one | Tab controls its panel |
| `aria-owns` | Establishes parent-child in accessibility tree | Combobox owns its listbox |
| `aria-live` | Announces dynamic content changes | `polite` for status updates, `assertive` for errors |

### Live Regions

| `aria-live` value | Behavior | Use for |
|------------------|----------|---------|
| `polite` | Announces after current speech finishes | Status updates, progress, non-critical feedback |
| `assertive` | Interrupts current speech immediately | Error alerts, urgent notifications |
| `off` | No announcement | Default, or regions that update too frequently |

Use `role="alert"` as a shorthand for `aria-live="assertive"` with `aria-atomic="true"`.
Use `role="status"` as a shorthand for `aria-live="polite"` with `aria-atomic="true"`.

## Keyboard Navigation

### Focus Management

- Every interactive element must be reachable via Tab key.
- Tab order must follow the visual reading order (left-to-right, top-to-bottom for LTR languages).
- Use `tabindex="0"` to add custom elements to the tab order.
- Use `tabindex="-1"` to make elements focusable programmatically but not via Tab.
- Never use `tabindex` values greater than 0. They create an unpredictable tab order.

### Focus Trapping

Dialogs and modals must trap focus:
1. When opened, move focus to the first focusable element inside the dialog.
2. Tab and Shift+Tab cycle within the dialog only.
3. Escape key closes the dialog and returns focus to the trigger element.

Use the native `<dialog>` element with `showModal()` for built-in focus trapping, or implement a focus trap manually for custom overlays.

### Keyboard Patterns by Widget

| Widget | Keys | Behavior |
|--------|------|----------|
| Tabs | Arrow Left/Right | Move between tabs |
| Menu | Arrow Up/Down | Navigate items |
| Combobox | Arrow Down | Open suggestions |
| Accordion | Enter/Space | Toggle section |
| Slider | Arrow Left/Right | Adjust value |
| Tree | Arrow Up/Down/Left/Right | Navigate and expand/collapse |
| Dialog | Escape | Close dialog |
| All interactive | Enter/Space | Activate |

### Focus Visibility

```css
/* Remove default outline only when using mouse */
:focus:not(:focus-visible) {
  outline: none;
}

/* Custom focus ring for keyboard users */
:focus-visible {
  outline: 2px solid var(--focus-ring-color);
  outline-offset: 2px;
}
```

## Motion Accessibility

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

Do not disable motion entirely. Reduce it to near-instant transitions so that state changes are still communicated visually (elements appear in their final position) without sustained movement that can cause motion sickness.

## Screen Reader Testing Checklist

| Check | Tool | Pass criteria |
|-------|------|--------------|
| Page has a unique `<title>` | Any screen reader | Page purpose is announced on load |
| Headings form a logical hierarchy | Heading navigation (H key in NVDA/JAWS) | No skipped levels, hierarchy matches visual layout |
| Images have `alt` text | Image navigation | Decorative images have `alt=""`, informative images have descriptive alt |
| Forms are labeled | Tab through form | Every field is announced with its label and required state |
| Errors are announced | Trigger validation | Error message is announced when field receives focus |
| Dynamic content is announced | Trigger an update | Live regions announce changes without requiring page refresh |
| Dialog focus is managed | Open a dialog | Focus moves into dialog, traps there, returns on close |
