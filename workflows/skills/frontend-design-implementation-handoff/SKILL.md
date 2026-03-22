---
name: frontend-design-implementation-handoff
description: Translate design-engine output into repo-native implementation work, preferring real components, Flutter widgets, and existing tokens over pasted generated markup.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---

# Frontend Design Implementation Handoff

## Purpose

Convert the design-engine result into implementation work that matches the repo's real stack and components instead of copying raw generated artifacts.

## When to Use

- After Stitch returns a screen artifact
- After a design screen brief is approved for implementation
- When moving from design state into Flutter, React, or another real UI stack

## Instructions

1. **Prefer existing components and tokens first** — Reuse the repo's real primitives before creating new visual fragments.
2. **Translate semantics, not markup** — A generated artifact is a seed. Rebuild it in the target stack using the same hierarchy and state model.
3. **For Flutter, map into widgets and theme tokens** — Use theme extensions, shared cards, section headers, and navigation widgets instead of porting web structure literally.
4. **Preserve the brief's anti-slop constraints** — Distinctive typography, component rhythm, and motion rules should survive the handoff.
5. **Leave QA hooks behind** — Ensure semantics labels, stable copy, and navigable flows are good enough for `flutter-mobile-qa` or frontend tests.

## Output Format

Deliver:

1. Implementation plan
2. Components/widgets to create or reuse
3. Token/theme mapping
4. QA-readiness notes

