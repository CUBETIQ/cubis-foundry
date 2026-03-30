---
name: design
description: Top-level design routing and critique skill for choosing the right
  system, web, or mobile design path, running audit-first diagnosis, and
  keeping downstream execution aligned to one clear contract.
triggers:
  - design
  - frontend
  - design route
  - design critique
  - audit a ui
  - system direction
  - design system routing
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

Provide the top-level routing and critique skill for design work. Use it to decide whether the task needs audit, canonical systemization, browser-first execution, mobile-first execution, or a tighter implementation handoff rather than jumping straight into arbitrary visual changes.

## Working Model

Before any execution route is chosen, require three explicit inputs:

- visual thesis
- content plan
- interaction thesis

Use these to keep the request focused on the real design problem instead of drifting into generic visual advice.

## When to Use

- Diagnosing why a UI feels generic, inconsistent, or weak before making edits
- Choosing between browser-first and mobile-first design execution
- Establishing or refreshing system-level visual direction before screen work
- Keeping multiple design improvements aligned under one direction

## Instructions

1. Start by classifying the request as routing/critique, systemization, browser execution, or mobile execution.
2. Run audit-first when the interface already exists and quality is uncertain. Use the scoring cues in `references/scoring-rubric.md` and name the primary gap before anything else.
3. Use `../design-system/SKILL.md` when the canonical visual language, token language, or component vocabulary needs to be refreshed before screen work.
4. Choose `../web-ui-design/SKILL.md` for browser-first execution and `../mobile-ui-design/SKILL.md` for phone-first execution. Do not mix the two paths.
5. Keep this surface at the routing/critique layer: return the route, why it fits, the next owning surface, and the non-negotiable constraints.
6. Use `references/execution-contract.md` when the answer needs a stricter handoff contract.

## Route-First Constraints

- preserve the visual thesis the user actually needs
- preserve the content plan the layout must serve
- preserve the interaction thesis that changes how the UI feels
- reject generic advice that does not change the chosen route or the downstream artifact

## Anti-patterns

- Do not give generic style advice detached from product purpose, state design, or interaction cost.
- Do not skip hierarchy, readability, or affordance in favor of pure aesthetics.
- Do not collapse routing, systemization, and execution into one blended answer.
- Do not keep users on the fragmented `frontend-design*` stack when a simpler route through `design`, `design-system`, `web-ui-design`, or `mobile-ui-design` is clearer.

## Output Format

Return:

1. The chosen design route
2. The primary diagnosis or reason that route fits the task
3. The next owning surface and exact artifact it should produce
4. The non-negotiable anti-generic constraints that must survive downstream execution

## References

- `references/scoring-rubric.md`
- `references/visual-direction.md`
- `references/design-tokens.md`
- `references/execution-contract.md`
- `../design-system/SKILL.md`
- `../web-ui-design/SKILL.md`
- `../mobile-ui-design/SKILL.md`
