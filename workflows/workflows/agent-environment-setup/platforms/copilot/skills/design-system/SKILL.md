---
name: design-system
description: Build or refresh the canonical design-system state for a repo, including DESIGN.md, overlays, token language, and platform-specific adaptation notes across web, mobile, and desktop.
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---
# Design System

## Purpose

Author and refresh the project's canonical design-system state so design, generation, and implementation share the same visual language. This is the systemization surface, not a screen execution surface.

This surface should define the direction name, style contract, thesis set, typography system, token language, spacing and layout logic, depth and material rules, interaction and motion language, component vocabulary, and responsive adaptation rules that downstream screen work must respect across web, mobile, and desktop.

## When to Use

- `docs/foundation/DESIGN.md` is missing or stale
- A new design direction needs to be made durable
- Multi-surface work needs consistent tokens and component vocabulary
- Stitch or implementation work needs a canonical design document before screen execution

## Instructions

1. Normalize the canonical system first - Create or refresh `docs/foundation/DESIGN.md` before anything else. This file is the source of truth for visual direction, token language, component vocabulary, and motion rules.
2. Write the canonical sections in a stable order - direction name, style contract, visual/content/interaction theses, color-role logic, typography, spacing and layout rhythm, depth and material, interaction and motion rules, component vocabulary, responsive and adaptive rules, explicit do and do not guidance, then prompt or implementation cues.
3. Use semantic token naming - Load `workflows/design-datasets/token-language.json` and preserve semantic roles instead of raw color dumps.
4. Define adaptive behavior explicitly - Use `../design/references/responsive-adaptive-systems.md`, `../design/references/web-ui-design.md`, `../design/references/mobile-app-ui-design.md`, and `../design/references/desktop-app-ui-design.md` to record what stays shared and what intentionally diverges across web, mobile, and desktop surfaces.
5. Write scoped overlays only when needed - Use the page overlays directory under `docs/foundation/design/pages/`, the flow overlays directory under `docs/foundation/design/flows/`, or the mobile overlays directory under `docs/foundation/design/mobile/` when a narrower slice of the product needs additional detail.
6. Keep screen execution out of this surface - Summarize the system language, not the UI of an individual page or flow.
7. Treat Stitch as a consumer, not the source of truth - When Stitch is in the loop, `docs/foundation/DESIGN.md` remains canonical and any Stitch-facing mirror is derived from it.
8. Preserve source metadata in the authoring process, not the final doc body - The final design docs should be crisp and implementation-oriented, but the chosen direction should come from normalized datasets with source provenance.

## System Rules

- define the typography system before screen-specific treatment
- keep token language semantic and stable
- keep interaction/state language explicit enough for implementation and QA
- keep cross-surface adaptation rules explicit instead of assuming one layout scales everywhere
- keep do and do not guidance explicit so downstream generation does not drift into generic defaults

## Output Format

Deliver:

1. Canonical design-system summary
2. Style contract and thesis set
3. Token language and semantic aliases
4. Component vocabulary and usage rules
5. Cross-surface adaptation notes for web, mobile, and desktop
6. Overlay files created or refreshed
7. Which downstream surfaces should consume the refresh

## References

- `../design/references/execution-contract.md`
- `../design/references/foundation.md`
- `../design/references/web-ui-design.md`
- `../design/references/mobile-app-ui-design.md`
- `../design/references/desktop-app-ui-design.md`
- `../design/references/responsive-adaptive-systems.md`
- `../design/references/output-template.md`
- `../design/references/agent-driven-ui.md`
- `../design/references/polish-accessibility-motion.md`
