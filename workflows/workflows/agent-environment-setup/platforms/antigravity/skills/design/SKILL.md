---
name: design
description: Top-level design routing and critique skill for choosing the right system, web, mobile, or desktop design path, running audit-first diagnosis, and keeping downstream execution aligned to one clear contract.
---
# Design

## Purpose

Provide the routing and critique layer for design work once the UI-design intent is established. Use it directly for audit-first diagnosis or downstream of `frontend-design` when the task now needs route selection, critique language, and strict execution boundaries.

## Working Model

Before any execution route is chosen, require four explicit inputs:

- style contract
- visual thesis
- content plan
- interaction thesis

Use these to keep the request focused on the real design problem instead of drifting into generic visual advice.

Normalize the brief before routing when the request is messy. Capture product, users, top tasks, target surfaces, states, accessibility target, motion tolerance, and brand adjectives using `references/foundation.md`, `references/output-template.md`, and `assets/brief-template.json`.

## When to Use

- Diagnosing why a UI feels generic, inconsistent, or weak before making edits
- Choosing between browser-first, mobile-first, and desktop-first design execution
- Establishing or refreshing system-level visual direction before screen work
- Keeping multiple design improvements aligned under one direction

## Instructions

1. Start by classifying the request as routing, critique, systemization, browser execution, mobile execution, or desktop execution.
2. Require the style contract plus the visual thesis, content plan, and interaction thesis before selecting the owning surface.
3. Run audit-first when the interface already exists and quality is uncertain. Use the scoring cues in `references/scoring-rubric.md`, identify the primary failure dimension, and route from that diagnosis instead of from taste alone.
4. Load `references/foundation.md` first when the task spans more than one surface so shared nouns, tokens, and state language are settled before platform-specific execution.
5. Use `../design-system/SKILL.md` when the canonical visual language, token language, or component vocabulary must be refreshed before screen work.
6. Choose `../web-ui-design/SKILL.md` for browser-first execution, `../mobile-ui-design/SKILL.md` for phone-first execution, and `../desktop-ui-design/SKILL.md` for desktop-first execution. Do not flatten those surfaces into one copied layout.
7. Use `references/responsive-adaptive-systems.md` plus the surface-specific reference docs when the same product spans more than one surface family or major size class.
8. Keep this surface at the routing and critique layer: return the route, why it fits, the next owning surface, and the non-negotiable constraints.
9. Use `references/execution-contract.md` and `references/output-template.md` when the answer needs a stricter handoff contract.

## Deterministic Helper

When the user needs a structured audit, adaptive matrix, or reusable prompt pack for multiple surfaces, use `scripts/ui_blueprint_tool.py` with `assets/brief-template.json` or `assets/sample-brief.json` instead of improvising the schema each time.

## Route-First Constraints

- preserve the style contract the design direction depends on
- preserve the visual thesis the user actually needs
- preserve the content plan the layout must serve
- preserve the interaction thesis that changes how the UI feels
- reject generic advice that does not change the chosen route or the downstream artifact

## Anti-patterns

- Do not give generic style advice detached from product purpose, state design, or interaction cost.
- Do not skip hierarchy, readability, or affordance in favor of pure aesthetics.
- Do not collapse routing, systemization, and execution into one blended answer.
- Do not bypass `frontend-design` when the public request is still ambiguous and needs a clearer UI-design front door.
- Do not keep users on the fragmented `frontend-design-*` helper stack when a simpler route through `frontend-design`, `design-system`, `web-ui-design`, `mobile-ui-design`, or `desktop-ui-design` is clearer.

## Output Format

Return:

1. The chosen design route
2. The primary diagnosis or reason that route fits the task
3. The next owning surface and exact artifact it should produce
4. The non-negotiable anti-generic constraints that must survive downstream execution

## References

- `../frontend-design/SKILL.md`
- `references/scoring-rubric.md`
- `references/foundation.md`
- `references/design-directions.md`
- `references/web-ui-design.md`
- `references/mobile-app-ui-design.md`
- `references/desktop-app-ui-design.md`
- `references/responsive-adaptive-systems.md`
- `references/output-template.md`
- `references/agent-driven-ui.md`
- `references/polish-accessibility-motion.md`
- `references/visual-direction.md`
- `references/design-tokens.md`
- `references/execution-contract.md`
- `../design-system/SKILL.md`
- `../web-ui-design/SKILL.md`
- `../mobile-ui-design/SKILL.md`
- `../desktop-ui-design/SKILL.md`
- `assets/brief-template.json`
- `assets/sample-brief.json`
- `scripts/ui_blueprint_tool.py`
