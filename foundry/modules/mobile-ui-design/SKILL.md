---
name: mobile-ui-design
description: Design mobile-first interfaces with strong small-screen hierarchy,
  thumb-reachable interaction design, native-feeling flow structure, and
  implementation-aware handoff for Flutter or other app surfaces.
triggers:
  - mobile ui design
  - ios screen
  - android screen
  - app design
  - mobile flow
  - flutter ui
  - simulator-ready design
domains:
  - design
  - frontend
  - mobile
whenToUse: When the main output is a mobile-first screen, flow, or app surface.
priority: primary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
metadata:
  aliases:
    - frontend-design-mobile-patterns
---

# Mobile UI Design

## Purpose

Provide the mobile-first execution surface for design work. Use it when the task needs a concrete phone-sized screen, flow, or app interaction model that must survive real implementation instead of staying web-shaped.

## When to Use

- Designing iOS or Android screens, flows, navigation, or section rhythm
- Translating canonical design direction into a mobile-specific screen brief
- Adapting a broad product design into thumb-driven interaction and smaller layouts
- Preparing implementation-aware mobile handoff for Flutter or another native-capable stack

## Instructions

1. Start from the canonical direction chosen in `design`, then adapt it to mobile constraints instead of shrinking a web layout.
2. Treat thumb reach, section staging, CTA placement, navigation rhythm, and scan-friendly composition as first-class constraints rather than afterthoughts.
3. Prefer mobile-feasible patterns over browser habits. Avoid hover-led behavior, dense side rails, or desktop-first shell thinking.
4. Specify mobile states and flow transitions clearly: entry state, empty state, success/error feedback, keyboard impact, safe-area behavior, and primary-action placement.
5. When the task needs implementation translation, include widget-, theme-, or component-level cues so the output can survive Flutter or native UI work.
6. Keep visual direction deliberate. Reuse `../design/references/visual-direction.md` and `../design/references/design-tokens.md` only when they materially affect the mobile design choice.
7. End with a handoff that QA and implementation can consume: layout rhythm, navigation model, interaction states, anti-slop constraints, and platform-sensitive notes.

## Anti-patterns

- Do not compress a desktop layout onto a phone and call it mobile design.
- Do not hide primary actions below awkward reach zones or bury key state changes.
- Do not use generic mobile clichés without product-specific hierarchy and pacing.

## Output Format

Return:

1. Mobile direction summary
2. Screen or flow structure
3. Navigation and CTA placement rules
4. Widget, state, and token cues
5. Implementation-ready handoff notes

## References

- `../design/SKILL.md`
- `../design/references/visual-direction.md`
- `../design/references/design-tokens.md`
