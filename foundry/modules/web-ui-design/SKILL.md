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

Provide the browser-first execution surface for design work. Use it when the task needs a concrete web interface direction, layout system, screen brief, or implementation-ready handoff rather than routing or systemization.

This skill should produce work that feels deliberate and current, not generic SaaS-card first. The first viewport must have a strong visual anchor, and the layout must stay cardless by default unless a card is the real interaction.

## When to Use

- Designing a landing page, dashboard, product shell, or complex browser screen
- Translating canonical design direction into a concrete web page or component brief
- Tightening hierarchy, density, layout elasticity, accessibility, and motion for web
- Converting design intent into a browser-aware implementation plan

## Instructions

1. Start from the canonical direction chosen in `design`, then restate the browser-specific job to be done before proposing layout.
2. Commit to one strong visual direction before choosing components or layout patterns. Use `../design/references/visual-direction.md` and `../design/references/execution-contract.md` when the contract needs to stay strict.
3. Lock hierarchy, density, and navigation before component selection. Prefer web-native layout logic: information density, grid rhythm, container-aware composition, and browser accessibility.
4. Keep component boundaries explicit. Use `references/component-architecture.md` when the task needs reusable primitives, composites, or layout shells.
5. Make token usage concrete. Use `../design/references/design-tokens.md` when color, spacing, typography, or semantic aliasing needs to be defined or refreshed.
6. Add responsive and accessibility guidance only when it changes the real design decision. Use `references/responsive-patterns.md` and `references/accessibility.md` selectively.
7. When motion matters, specify why it exists, what it communicates, and how it degrades. Use `references/animation.md` only when the request genuinely depends on motion. Favor 2-3 intentional motions over scattered micro-interactions.
8. End with a web-ready handoff: layout summary, component vocabulary, interaction states, anti-generic constraints, and implementation cues that a real frontend engineer can build.

## Web Direction Rules

- full-bleed hero rule: branded landing pages should run edge-to-edge and keep the inner text/action column constrained instead of boxing the hero
- image-led hierarchy: the first viewport should work because of the anchor image or dominant visual plane, not in spite of it
- utility-copy mode: product UIs should stay focused on orientation, status, and action instead of campaign-style language
- reject generic SaaS card-grid first impressions
- reject cards when plain layout communicates better

## Anti-patterns

- Do not route or critique the task from this surface; those belong in `design`.
- Do not describe a mobile layout as if it were a browser shell.
- Do not produce vague aesthetic prose without layout, hierarchy, or component consequences.
- Do not treat browser UI like a poster; define states, density, navigation, and empty/error behavior.
- Do not default to generic card grids, inert dashboards, or anonymous SaaS hero sections.

## Output Format

Return:

1. Visual direction summary
2. Layout and hierarchy plan
3. Component, navigation, and token cues
4. States, responsive behavior, and accessibility constraints
5. Implementation-ready handoff notes

## References

- `../design/SKILL.md`
- `../design/references/execution-contract.md`
- `../design/references/visual-direction.md`
- `../design/references/design-tokens.md`
- `references/component-architecture.md`
- `references/responsive-patterns.md`
- `references/accessibility.md`
- `references/animation.md`
