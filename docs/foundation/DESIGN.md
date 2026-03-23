# Design Context

This file is the canonical Foundry design context for this repo.

Refresh it with `design-context-capture` when the product direction changes or when UI work starts drifting into generic defaults.

## Product Thesis

- Product mood: authored, benchmark-driven, system-minded, anti-template UI work
- Audience: operators evaluating whether Foundry can design, remediate, and validate serious frontend surfaces
- Density: medium-to-high on desktop, intentionally re-staged on mobile
- What the interface should feel like in 3-5 adjectives: specific, composed, testable, modern, non-generic

## Typography

- Primary text voice: choose a voice that matches the surface, not one global neutral stack
- Display or accent voice: strong and deliberate; editorial surfaces can use serif display, product surfaces should use disciplined sans or mono accents
- Label/data voice: compact, legible, and visibly separate from headline or prose rhythm
- Explicit defaults to avoid: anonymous Inter-or-system-only type systems, giant hero copy with underweighted companion modules, labels that read like untouched boilerplate

## Color And Surfaces

- Base surface behavior: surfaces should define structure and hierarchy, not just surround content with more boxes
- Accent behavior: one or two intentional accents per surface; accent color should signal action, identity, or severity rather than decorate every card
- Contrast strategy: allow high contrast when the scenario calls for it, but keep text and data legible under every state
- Texture discipline: do not default to faint grid or box overlays as a generic way to add atmosphere; texture must be justified by the style family
- Explicit palette drift to avoid: default SaaS blue-gray neutrality, purple drift, soft beige luxury sameness, neon-for-neon's-sake contrast

## Composition And Rhythm

- Dominant layout move: every screen needs one clear compositional thesis such as a control rail, split editorial spread, shell-preview hybrid, or route canvas
- Repeated motif: rules, ledgers, numbered rails, command bands, poster blocks, or other explicit repeated structures
- Spacing rhythm: vary dense and open zones; do not let every region use the same padding and card treatment
- Geometry coverage: benchmark both hard-edge and rounded/tactile systems; do not let every style collapse to the same zero-radius component kit
- Mobile staging principle: re-prioritize rather than collapse; critical controls and decision context move above descriptive support content

## Motion And Interaction

- Motion character: restrained but meaningful, with transitions that communicate hierarchy or state change rather than generic polish
- Required interaction states: mode switch, entity switch, action confirmation, and at least one meaningful content-zone update per benchmark surface
- Feedback principles: status must be reflected in text, hierarchy, and structure, not just color or animation

## Anti-Patterns

- Do not: ship a hero-plus-cards template and call it a style direction
- Do not: reserve major desktop rails or columns without mounting meaningful content into them
- Do not: treat mobile as a compressed desktop stack
- Do not: use one reusable background texture across unrelated styles
- Do not: let every component set default to sharp corners when the style family calls for rounded, tactile, or sheet-driven behavior

## Notes For Design Skills

- Use this file as the first source of truth before screen-level briefs.
- Keep it short, operational, and specific enough to prevent template drift.
