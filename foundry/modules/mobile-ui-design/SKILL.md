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

This skill should stay truly phone-first. It should optimize for thumb reach, safe areas, navigation rhythm, and platform-sensitive state changes rather than shrinking desktop content into a small viewport.

## When to Use

- Designing iOS or Android screens, flows, navigation, or section rhythm
- Translating canonical design direction into a mobile-specific screen brief
- Adapting a broad product design into thumb-driven interaction and smaller layouts
- Preparing implementation-aware mobile handoff for Flutter or another native-capable stack

## Instructions

1. Start from the canonical direction chosen in `design`, then restate the mobile job to be done before proposing structure.
2. Recompose for thumb reach, safe areas, section staging, CTA placement, navigation rhythm, and scan-friendly composition instead of shrinking a web layout.
3. Prefer mobile-feasible patterns over browser habits. Avoid hover-led behavior, dense side rails, or desktop-first shell thinking.
4. Specify mobile-native state transitions clearly: entry state, empty state, success/error feedback, keyboard impact, orientation impact, safe-area behavior, and primary-action placement.
5. When the task needs implementation translation, include widget-, theme-, or component-level cues so the output can survive Flutter or native UI work.
6. Keep visual direction deliberate. Reuse `../design/references/visual-direction.md`, `../design/references/design-tokens.md`, and `../design/references/execution-contract.md` only when they materially affect the mobile design choice.
7. End with a handoff that QA and implementation can consume: layout rhythm, navigation model, interaction states, anti-slop constraints, and platform-sensitive notes.

## Mobile Direction Rules

- thumb reach must influence primary-action placement
- safe areas must be accounted for explicitly
- no desktop compression disguised as mobile design
- motion should support flow clarity, not decoration

## Anti-patterns

- Do not route or critique the task from this surface; those belong in `design`.
- Do not compress a desktop layout onto a phone and call it mobile design.
- Do not hide primary actions below awkward reach zones or bury key state changes.
- Do not use generic mobile clichés without product-specific hierarchy and pacing.

## Output Format

Return:

1. Mobile job and visual thesis
2. Screen or flow structure
3. Navigation, reachability, and CTA placement rules
4. Widget, state, and platform-sensitive cues
5. Implementation-ready handoff notes

## References

- `../design/SKILL.md`
- `../design/references/execution-contract.md`
- `../design/references/visual-direction.md`
- `../design/references/design-tokens.md`
