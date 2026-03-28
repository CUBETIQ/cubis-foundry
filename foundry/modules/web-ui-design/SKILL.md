---
name: web-ui-design
description: Design browser-first interfaces with strong visual direction,
  component architecture, responsive layout strategy, accessibility, and
  implementation-aware handoff for real web products.
triggers:
  - web ui design
  - browser ui
  - landing page
  - dashboard
  - browser-first interface
  - responsive layout
  - web design brief
domains:
  - design
  - frontend
  - web
whenToUse: When the main output is a browser-first screen, page family, or component surface.
priority: primary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# Web UI Design

## Purpose

Provide the browser-first execution surface for design work. Use it when the task needs a concrete web interface direction, layout system, screen brief, or implementation-ready handoff rather than a generic design discussion.

## When to Use

- Designing a landing page, dashboard, product shell, or complex browser screen
- Translating canonical design direction into a concrete web page or component brief
- Tightening hierarchy, density, layout elasticity, accessibility, and motion for web
- Converting design intent into a browser-aware implementation plan

## Instructions

1. Start from the canonical direction chosen in `design`, then turn it into a browser-specific screen or system decision.
2. Commit to one strong visual direction before choosing components or layout patterns. Use `../frontend-design/references/visual-direction.md`.
3. Prefer web-native layout logic: hierarchy, information density, grid rhythm, container-aware composition, and browser accessibility.
4. Keep component boundaries explicit. Use `../frontend-design/references/component-architecture.md` when the task needs reusable primitives, composites, or layout shells.
5. Make token usage concrete. Use `../frontend-design/references/design-tokens.md` when color, spacing, typography, or semantic aliasing needs to be defined or refreshed.
6. Add responsive and accessibility guidance only when it changes the real design decision. Use `../frontend-design/references/responsive-patterns.md` and `../frontend-design/references/accessibility.md` selectively.
7. When motion matters, specify why it exists, what it communicates, and how it degrades. Use `../frontend-design/references/animation.md` only when the request genuinely depends on motion.
8. End with a web-ready handoff: layout summary, component vocabulary, interaction states, anti-generic constraints, and implementation cues that a real frontend engineer can build.

## Anti-patterns

- Do not produce vague aesthetic prose without layout, hierarchy, or component consequences.
- Do not treat browser UI like a poster; define states, density, navigation, and empty/error behavior.
- Do not default to generic card grids, inert dashboards, or anonymous SaaS hero sections.

## Output Format

Return:

1. Visual direction summary
2. Layout and hierarchy plan
3. Component and token cues
4. Web accessibility and responsive constraints
5. Implementation-ready handoff notes

## References

- `../design/SKILL.md`
- `../frontend-design/references/visual-direction.md`
- `../frontend-design/references/design-tokens.md`
- `../frontend-design/references/component-architecture.md`
- `../frontend-design/references/responsive-patterns.md`
- `../frontend-design/references/accessibility.md`
- `../frontend-design/references/animation.md`
