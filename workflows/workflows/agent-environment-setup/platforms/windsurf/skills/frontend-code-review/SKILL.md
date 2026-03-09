---
name: "frontend-code-review"
description: "Use when reviewing web UI code for regressions in accessibility, state flow, responsiveness, loading and error behavior, rendering cost, and design-system consistency."
license: MIT
metadata:
  version: "1.0.0"
  domain: "frontend"
  role: "specialist"
  stack: "react-web"
  category: "workflow-specialists"
  layer: "workflow-specialists"
  canonical: true
  maturity: "stable"
  baseline: "modern frontend review for React, Next.js, Tailwind, and component-system code"
  tags: ["frontend", "code-review", "accessibility", "ui", "react", "nextjs", "performance", "review"]
---

# Frontend Code Review

## When to use

- Reviewing React, Next.js, or browser UI changes for correctness and regression risk.
- Checking accessibility, semantics, focus flow, and interaction-state behavior.
- Auditing component API shape, state placement, hydration boundaries, or rendering cost.
- Reviewing styling and design-system consistency before merge.

## When not to use

- Pure visual design direction with no code under review.
- Browser automation implementation where the main task is writing tests.
- Backend or database code review with no meaningful UI behavior impact.

## Core workflow

1. Review the user-visible states first: loading, empty, error, success, and edge conditions.
2. Check semantics, keyboard flow, and focus behavior before pixel polish.
3. Confirm state lives in the right place and rerenders are proportional to the interaction.
4. Verify responsiveness, theming, and component API consistency against the current system.
5. Flag missing tests where UI behavior or interaction risk is high.

## Baseline standards

- Prefer semantic HTML and explicit labels over div-heavy interaction surfaces.
- Make loading and error behavior as deliberate as happy-path content.
- Keep client boundaries as small as the framework allows.
- Review component APIs for clarity, not just whether the current screen works.
- Pair review findings with concrete reproduction or verification steps.

## Avoid

- Treating visual approval as proof of accessibility or state correctness.
- Focusing only on styling nits while missing broken interaction flow.
- Blanket memoization or client-only rendering with no measured need.
- Merging component-system concerns and one-off product logic into the same abstraction.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/ui-regression-and-accessibility-checklist.md` | You need a deeper checklist for review findings around semantics, focus, loading and error states, responsive behavior, component API shape, or rendering cost. |
