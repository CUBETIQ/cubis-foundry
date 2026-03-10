---
name: frontend-code-review
description: "Use when reviewing web UI code for regressions in accessibility, state flow, responsiveness, loading and error behavior, rendering cost, and design-system consistency."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Frontend Code Review

## Purpose

Use when reviewing web UI code for regressions in accessibility, state flow, responsiveness, loading and error behavior, rendering cost, and design-system consistency.

## When to Use

- Reviewing React, Next.js, or browser UI changes for correctness and regression risk.
- Checking accessibility, semantics, focus flow, and interaction-state behavior.
- Auditing component API shape, state placement, hydration boundaries, or rendering cost.
- Reviewing styling and design-system consistency before merge.

## Instructions

1. Review the user-visible states first: loading, empty, error, success, and edge conditions.
2. Check semantics, keyboard flow, and focus behavior before pixel polish.
3. Confirm state lives in the right place and rerenders are proportional to the interaction.
4. Verify responsiveness, theming, and component API consistency against the current system.
5. Flag missing tests where UI behavior or interaction risk is high.

### Baseline standards

- Prefer semantic HTML and explicit labels over div-heavy interaction surfaces.
- Make loading and error behavior as deliberate as happy-path content.
- Keep client boundaries as small as the framework allows.
- Review component APIs for clarity, not just whether the current screen works.
- Pair review findings with concrete reproduction or verification steps.

### Constraints

- Avoid treating visual approval as proof of accessibility or state correctness.
- Avoid focusing only on styling nits while missing broken interaction flow.
- Avoid blanket memoization or client-only rendering with no measured need.
- Avoid merging component-system concerns and one-off product logic into the same abstraction.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/ui-regression-and-accessibility-checklist.md` | You need a deeper checklist for review findings around semantics, focus, loading and error states, responsive behavior, component API shape, or rendering cost. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with frontend code review best practices in this project"
- "Review my frontend code review implementation for issues"
