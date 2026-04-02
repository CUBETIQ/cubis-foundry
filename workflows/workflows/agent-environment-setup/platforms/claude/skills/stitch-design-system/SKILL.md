---
name: stitch-design-system
description: Create or refresh a Stitch-compatible design-system context by maintaining docs/foundation/DESIGN.md as the canonical source and mirroring it to a Stitch-facing design file when Stitch flows need persistent visual consistency.
---

# Stitch Design System

## Purpose

Maintain the design context that lets Stitch generate consistent screens across a project. This skill keeps `docs/foundation/DESIGN.md` as the canonical design document and mirrors it to a Stitch-facing design file for Stitch-oriented generation flows.

## When to Use

- A Stitch project needs consistent visual language across multiple screens
- `docs/foundation/DESIGN.md` is missing or stale
- A repo already has tokens and component patterns that should be reflected in Stitch prompts
- A team wants to refresh Stitch design context from an existing screen or artifact

## Instructions

1. **Keep `docs/foundation/DESIGN.md` canonical** — The project-owned design context lives under `docs/foundation/DESIGN.md`. The Stitch-facing design mirror is generated compatibility state for Stitch workflows.

2. **Derive from repo evidence first** — Prefer existing tokens, CSS variables, typography scales, component primitives, and brand docs from the repo before extracting from Stitch output.

3. **Use Stitch artifacts only when they add real missing context** — When the repo design system is incomplete, inspect Stitch screens with `get_screen` and extract the visual language from the real artifact.

4. **Describe the system semantically** — Write colors by role, typography by hierarchy, spacing by rhythm, shape by character, and motion by purpose. Include exact values only when they help generation consistency.

5. **Capture component vocabulary** — Document how buttons, cards, forms, navigation, tables, and empty states should look and feel so future prompts stay consistent.

6. **Keep the scope proportional** — Do not build or refresh the design-system document for every one-off component task. Use this skill when the work spans multiple screens, iterative Stitch work, or a real design refresh.

7. **Mirror the canonical file into the Stitch-facing design file** — When this skill updates the canonical file, it must also update the Stitch compatibility mirror so Stitch-oriented flows read the same design language.

8. **Mark unknowns clearly** — If a color role, typography rule, or motion style is inferred rather than directly evidenced, call that out instead of presenting it as a verified fact.

## Output Format

Deliver:

1. **Canonical design path** — `docs/foundation/DESIGN.md`
2. **Mirror path** — Stitch-facing design mirror
3. **Design-system summary** — palette roles, typography, spacing, shape, components, and motion
4. **Evidence notes** — what came from repo truth vs Stitch artifact inference

## References

| File | Load when |
| --- | --- |
| `references/design-template.md` | Need the canonical structure for `docs/foundation/DESIGN.md` and the Stitch mirror. |
| `../design-system/SKILL.md` | Need the canonical section order and system rules before mirroring to Stitch. |
| `../design/references/design-tokens.md` | Need token structure and semantic value naming. |

## Examples

| File | Use when |
| --- | --- |
| `examples/01-design-context.md` | Need a minimal template for the canonical design doc and Stitch mirror. |
