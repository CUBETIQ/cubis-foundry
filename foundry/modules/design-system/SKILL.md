---
name: design-system
description: Build or refresh the canonical design-system state for a repo,
  including DESIGN.md, overlays, token language, and platform-specific
  adaptation notes.
triggers:
  - frontend design system
  - design system
  - canonical design system
  - frontend
  - design
  - build
  - overlays
  - token language
  - stale
  - component vocabulary
domains:
  - frontend
  - design
whenToUse: When `docs/foundation/DESIGN.md` is missing or stale.
priority: primary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
metadata:
  aliases:
    - frontend-design-system
---

# Design System

## Purpose

Author and refresh the project's canonical design-system state so design, Stitch generation, and implementation share the same visual language. This is the systemization surface, not a screen execution surface.

This surface should define the typography system, token language, spacing system, interaction/state language, and component vocabulary that downstream screen work must respect.

## When to Use

- `docs/foundation/DESIGN.md` is missing or stale
- A new design direction needs to be made durable
- Multi-screen work needs consistent tokens and component vocabulary
- A Flutter/mobile app needs a stable design foundation before implementation

## Instructions

1. **Normalize the canonical system first** — Create or refresh `docs/foundation/DESIGN.md` before anything else. This file is the source of truth for visual direction, token language, component vocabulary, and motion rules.
2. **Write scoped overlays only when needed** — Use the page overlays directory under `docs/foundation/design/pages/`, the flow overlays directory under `docs/foundation/design/flows/`, or the mobile overlays directory under `docs/foundation/design/mobile/` when a narrower slice of the product needs additional detail.
3. **Use semantic token naming** — Load `workflows/design-datasets/token-language.json` and preserve semantic roles instead of raw color dumps.
4. **Keep screen execution out of this surface** — Summarize the system language, not the UI of an individual page or flow.
5. **Preserve source metadata in the authoring process, not the final doc body** — The final design docs should be crisp and implementation-oriented, but the chosen direction should come from normalized datasets with source provenance.
6. **Mirror to `.stitch/DESIGN.md` when Stitch flows are in scope** — The mirror should be generated from the canonical state and applicable overlays, never hand-maintained separately.

## System Rules

- define the typography system before screen-specific treatment
- keep token language semantic and stable
- keep interaction/state language explicit enough for implementation and QA
- treat `.stitch/DESIGN.md` as a compatibility mirror only

## Output Format

Deliver:

1. Canonical design-system summary
2. Token language and semantic aliases
3. Component vocabulary and usage rules
4. Overlay files created or refreshed
5. Whether `.stitch/DESIGN.md` was updated and which downstream surfaces should consume the refresh

## References

- `../design/references/execution-contract.md`
