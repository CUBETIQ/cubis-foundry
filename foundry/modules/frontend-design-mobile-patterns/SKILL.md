---
name: frontend-design-mobile-patterns
description: Adapt the design engine to mobile and Flutter surfaces using Foundry's normalized mobile-pattern dataset and implementation-first constraints.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---

# Frontend Design Mobile Patterns

## Purpose

Translate the design engine into mobile-specific decisions that survive real Flutter implementation instead of staying as web-first UI ideas.

## When to Use

- Designing Flutter screens, flows, or navigation
- Adapting a Stitch-inspired concept into a mobile-native screen brief
- Reviewing whether a design will survive small screens and thumb-driven interaction

## Instructions

1. **Load `workflows/design-datasets/mobile-patterns.json` first** — Use it to shape navigation placement, card rhythm, CTA placement, and progress visibility.
2. **Design for thumb reach and scroll rhythm** — Primary actions should stay reachable and section breaks should remain scannable on smaller screens.
3. **Prefer Flutter-feasible patterns** — Avoid browser-specific assumptions like hover-led navigation or overly dense freeform layouts that do not translate well to Flutter widgets.
4. **Write implementation cues, not Figma prose** — Specify scaffold usage, navigation model, card rhythm, token usage, and expected widget states.
5. **Feed the result into `frontend-design-implementation-handoff` and `flutter-mobile-qa`** — Mobile design is not complete until implementation and QA can consume the same brief.

## Output Format

Deliver:

1. Mobile-specific layout notes
2. Navigation and CTA placement rules
3. Widget/state expectations
4. Flutter feasibility notes

