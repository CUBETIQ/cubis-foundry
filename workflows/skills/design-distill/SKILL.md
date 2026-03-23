---
name: design-distill
description: Remove clutter and reduce visual noise so the strongest parts of the interface can lead. Use when a UI is overbuilt, over-labeled, over-boxed, or trying to say too many things at once.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---

# Design Distill

## Purpose

Strip the interface down to the choices that matter. This skill should reduce complexity while preserving the product’s point of view and core actions.

## When to Use

- The page has too many cards, labels, or competing surfaces
- A UI feels busy even though the content is correct
- The design needs stronger focus rather than more flair
- Mobile views are especially noisy or over-dense

## Instructions

1. **Remove before restyling** — Cut weak containers, repetitive labels, decorative controls, and duplicate copy before adding new design moves.
2. **Keep the thesis intact** — Distillation should reveal the core design direction, not flatten it into a generic minimal page.
3. **Collapse weak hierarchy levels** — If several adjacent blocks have the same weight, merge or subordinate them.
4. **Reduce component redundancy** — Prefer fewer, stronger surface types over a page full of slightly different panels.
5. **Preserve critical states and actions** — Simplification should not erase wayfinding, feedback, or operational clarity.
6. **Re-check mobile after reduction** — Distilled desktop structure should turn into cleaner mobile staging, not empty space plus hidden actions.

## Output Format

Deliver:

1. Sources of clutter
2. Elements to remove or merge
3. What remains as the core thesis
4. Risks introduced by simplification
5. Recommended next step

## References

| File | Load when |
| --- | --- |
| `../frontend-design/references/visual-direction.md` | Distilling without losing the surface point of view. |
| `../frontend-design/references/component-architecture.md` | Removing redundant component layers while keeping structure coherent. |
