# UI Regression and Accessibility Checklist

Use this when reviewing frontend code rather than writing new UI from scratch.

## Interaction states

Verify the UI has deliberate handling for:

- loading
- empty
- partial or stale data
- validation errors
- mutation success
- offline or retry-worthy failures

## Accessibility checks

Review these first:

- semantic elements for buttons, links, lists, headings, forms, dialogs, and tables
- accessible names for interactive controls
- keyboard reachability and sensible tab order
- visible focus treatment
- dialog and menu escape paths
- error messaging that points to the failing field or action

## State and rendering checks

- Is state local unless sharing is actually required?
- Are server and client boundaries aligned with the framework instead of convenience?
- Are effects doing real side effects instead of derived-state bookkeeping?
- Does a rerender-heavy subtree need evidence-driven optimization?
- Are memoization or cache choices justified by profile or known hot paths?

## Review findings that deserve a test

- business-critical flows
- tricky async transitions
- auth-gated UI
- forms with branching validation
- hydration-sensitive rendering
- accessibility regressions that can recur silently

## Design-system hygiene

- tokens or utility patterns remain consistent
- component API stays composable and unsurprising
- one-off escape hatches do not leak into shared primitives
- responsive behavior is intentional, not accidental
