# Frontend Design Eval Assertions

## Eval 1: Design System Component (Button)

This eval tests the core design system workflow: building a reusable component with proper token usage, accessibility, state management, and composable API.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `aria-` — ARIA attribute usage | Buttons must communicate state (disabled, busy, expanded) to assistive technologies. Visual indicators alone exclude screen reader users. |
| 2 | contains | `--` — CSS custom property tokens | Hardcoded values create maintenance debt and break theme switching. Tokens enforce system-wide consistency from a single source. |
| 3 | contains | `disabled` — Disabled state handling | A disabled button must prevent interaction, remove from tab order or mark as aria-disabled, and be visually distinct. Missing any of these creates confusion. |
| 4 | contains | `loading` — Loading state support | Users need feedback during async operations. A loading button must show a spinner, suppress clicks, and announce the busy state to screen readers. |
| 5 | contains | `variant` — Variant prop for visual styles | A single component must serve multiple semantic contexts (primary action, destructive action, secondary option) through a typed prop rather than ad-hoc class overrides. |

### What a passing response looks like

- A `Button` component with TypeScript props interface defining `variant`, `size`, `loading`, `disabled`, `icon`, and `children`.
- CSS custom properties (`--button-bg`, `--button-color`, `--button-radius`) mapped to variant-specific values.
- Disabled state: `aria-disabled="true"`, visual opacity change, pointer-events removed.
- Loading state: spinner element, `aria-busy="true"`, click handler suppressed.
- Focus styles: visible outline using `:focus-visible` that is not removed globally.
- At least primary, secondary, ghost, and danger variant styles with distinct visual treatment.

---

## Eval 2: Accessible Form Pattern

This eval tests accessible form construction: label associations, validation feedback, keyboard flow, error handling, and responsive layout.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `htmlFor` — Label-input association | Without programmatic label association, screen readers cannot announce what a field is for. This is the most common accessibility failure in forms. |
| 2 | contains | `aria-describedby` — Error message linking | Error messages must be announced when their field receives focus. Without aria-describedby, screen reader users have no way to discover field-level errors. |
| 3 | contains | `role` — ARIA roles for dynamic content | Dynamic feedback (error summaries, strength indicators) must use roles like alert or status to trigger screen reader announcements without focus changes. |
| 4 | contains | `required` — Required field indication | Required fields must be marked with the required attribute or aria-required so that the requirement is communicated programmatically, not just visually with an asterisk. |
| 5 | contains | `onSubmit` — Form submission handling | Proper form handling prevents default submission, validates all fields, and moves focus to the first error so that users do not have to hunt for what went wrong. |

### What a passing response looks like

- All `<input>` elements have associated `<label>` elements with matching `htmlFor`/`id` pairs.
- Error messages wrapped in elements with `id` values referenced by `aria-describedby` on the input.
- Password strength indicator using `role="status"` or `role="progressbar"` with `aria-valuenow`.
- Required fields marked with `required` attribute and visual indicator.
- Form `onSubmit` handler that validates, prevents default, and focuses the first invalid field.
- Responsive layout using CSS Grid or Flexbox that collapses from two columns to one on narrow viewports.
