---
name: design
description: Top-level design routing and critique skill for choosing the right
  web or mobile design path, running audit-first diagnosis, and keeping system
  direction coherent across screens and products.
triggers:
  - design
  - frontend
  - design route
  - design critique
  - audit a ui
  - system direction
  - choose web or mobile design path
domains:
  - design
  - frontend
whenToUse: When a task is primarily about visual hierarchy, interaction quality,
  or selecting the right downstream web or mobile design path.
priority: primary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
metadata:
  aliases:
    - frontend-design
    - frontend-design-core
    - frontend-design-implementation-handoff
    - frontend-design-screen-brief
    - frontend-design-style-selector
    - design-audit
---

# Design

## Purpose

Provide the top-level routing and critique skill for design work. Use it to decide whether the task needs audit, system-direction work, browser-first design execution, mobile-first design execution, or a tighter implementation handoff rather than jumping straight into arbitrary visual changes.

## When to Use

- Diagnosing why a UI feels generic, inconsistent, or weak before making edits
- Choosing between browser-first and mobile-first design execution
- Establishing or refreshing system-level visual direction before screen work
- Keeping multiple design improvements aligned under one direction

## Instructions

1. Start with the problem shape: audit, system direction, web-first execution, or mobile-first execution.
2. Run audit-first when the interface already exists and quality is uncertain. Use the scoring cues in `references/scoring-rubric.md`.
3. Choose `web-ui-design` when the output is a browser screen, landing page, dashboard, or desktop/tablet-heavy surface.
4. Choose `mobile-ui-design` when the output is a phone-first screen, app flow, or Flutter/native-sensitive surface.
5. Keep design output tied to user goals, hierarchy, state communication, and system coherence, not decoration alone.
6. Use `../design-system/SKILL.md` only when canonical design state needs to be refreshed before screen work, not as the default public route.
7. End by naming the exact next design surface and the artifact it should produce.

## Anti-patterns

- Do not give generic style advice detached from product purpose, state design, or interaction cost.
- Do not skip hierarchy, readability, or affordance in favor of pure aesthetics.
- Do not keep users on the fragmented `frontend-design*` stack when a simpler route through `web-ui-design` or `mobile-ui-design` is clearer.

## Output Format

Return:

1. The chosen design route
2. Why that route fits the task
3. The concrete artifact expected next
4. The anti-generic constraints that must survive downstream execution

## References

- `references/scoring-rubric.md`
- `references/visual-direction.md`
- `references/design-tokens.md`
- `../design-system/SKILL.md`
- `../web-ui-design/SKILL.md`
- `../mobile-ui-design/SKILL.md`
