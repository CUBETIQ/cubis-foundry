---
name: frontend-design-style-selector
description: Select a non-generic visual direction from Foundry's normalized design datasets and align it to the product's domain, audience, and platform.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---

# Frontend Design Style Selector

## Purpose

Choose the visual direction before any screen or component work starts so the result has a deliberate point of view instead of a generic app-template look.

## When to Use

- Starting a new design system or screen family
- Improving a weak or generic UI prompt before Stitch generation
- Choosing a consistent mood for a Flutter/mobile app

## Instructions

1. **Use only Foundry datasets** — Load `workflows/design-datasets/style-directions.json`, `layout-patterns.json`, and `component-motifs.json` first.
2. **Select one primary direction and one supporting motif** — Avoid mixing many vibes. State the lead direction, supporting motif, and what should be excluded.
3. **Tie the direction to the product domain** — State why the chosen direction fits the product audience, task density, and emotional tone.
4. **Write anti-slop constraints** — Explicitly call out the visual clichés to avoid, such as generic wellness gradients, default dashboard cards, or unstructured glassmorphism.
5. **Feed the result into `frontend-design-system` or `frontend-design-screen-brief`** — This skill chooses direction; it does not finish the design state by itself.

## Output Format

Deliver:

1. Primary style direction
2. Supporting motif
3. Excluded clichés
4. Typography, palette, shape, and motion intent summary

