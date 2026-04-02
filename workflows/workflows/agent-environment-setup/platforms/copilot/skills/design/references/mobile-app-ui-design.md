# Mobile App UI Design

## Table of contents
1. Core stance
2. Navigation
3. Layout and density
4. Forms and input
5. States and feedback
6. Phone to tablet adaptation
7. Mobile checklist

## Core stance

Design mobile around touch, limited viewport, intermittent attention, and frequent context switching. Assume users will often be interrupted. Reduce memory load, shorten paths, and keep the next best action obvious.

## Navigation

Pick the smallest navigation model that fits the product:

- Bottom tabs for 3 to 5 top destinations.
- Stack navigation for deeper flows.
- Segmented control for local mode changes.
- Search as a first-class entry point for large collections.
- Bottom sheets for contextual actions and secondary decisions.
- Floating action buttons only when there is one dominant create action.

Rules:

- Keep primary destinations stable.
- Avoid nesting tabs inside tabs.
- Avoid hamburger-only navigation for task-heavy apps.
- Make the back path obvious and predictable.

## Layout and density

- Default to single-column flow on phones.
- Group information into clear vertical sections with strong headings.
- Keep primary actions near thumb-reachable zones when possible.
- Use persistent summary bars only when the task benefits from always-visible context.
- Show the minimum needed to decide and act.
- Use lists, tiles, and cards carefully. Lists often outperform cards for dense utility flows.

## Forms and input

- Keep forms short and chunked.
- Match keyboard type to the field.
- Use inline validation for high-friction fields.
- Prefer smart defaults, pickers, chips, and scanning when appropriate.
- Design for error recovery, not just success.
- Consider camera, location, biometrics, or offline capture when the brief calls for it.

## States and feedback

Mobile needs immediate and localized feedback:

- confirm saves without blocking the user
- use destructive confirms when actions cannot be undone
- show sync and offline states clearly
- keep loading indicators near the changing content
- use haptics sparingly and only for meaningful feedback

## Phone to tablet adaptation

Move from responsive stacking to adaptive structure when space increases:

- Phone: single primary pane, progressive disclosure
- Large phone: optional two-up metrics or richer cards
- Tablet: sidebar, split view, secondary pane, or persistent filters

Do not simply scale every card larger on tablet. Introduce more context and faster cross-view comparison.

## Mobile checklist

- Is one-handed use considered?
- Are top tasks reachable in one or two taps from the primary entry point?
- Are touch targets large enough and visually distinct?
- Does the flow survive poor network conditions?
- Are loading, empty, error, and offline states designed?
- Does tablet behavior introduce useful context instead of only more whitespace?
