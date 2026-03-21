---
name: frontend-design-system
description: Build or refresh the canonical design-system state for a repo, including DESIGN.md, overlays, token language, and platform-specific adaptation notes.
---
# Frontend Design System

## Purpose

Author and refresh the project's canonical design-system state so design, Stitch generation, and implementation share the same visual language.

## When to Use

- `docs/foundation/DESIGN.md` is missing or stale
- A new design direction needs to be made durable
- Multi-screen work needs consistent tokens and component vocabulary
- A Flutter/mobile app needs a stable design foundation before implementation

## Instructions

1. **Create or refresh `docs/foundation/DESIGN.md`** — This file is the source of truth for visual direction, token language, component vocabulary, and motion rules.
2. **Write scoped overlays only when needed** — Use the page overlays directory under `docs/foundation/design/pages/`, the flow overlays directory under `docs/foundation/design/flows/`, or the mobile overlays directory under `docs/foundation/design/mobile/` when a narrower slice of the product needs additional detail.
3. **Use semantic token naming** — Load `workflows/design-datasets/token-language.json` and preserve semantic roles instead of raw color dumps.
4. **Preserve source metadata in the authoring process, not the final doc body** — The final design docs should be crisp and implementation-oriented, but the chosen direction should come from normalized datasets with source provenance.
5. **Mirror to `.stitch/DESIGN.md` when Stitch flows are in scope** — The mirror should be generated from the canonical state and applicable overlays, never hand-maintained separately.

## Output Format

Deliver:

1. Canonical design-system summary
2. Token language
3. Component vocabulary
4. Overlay files created or refreshed
5. Whether `.stitch/DESIGN.md` was updated

## Gemini Platform Notes

- Workflow and agent routes are compiled into `.gemini/commands/*.toml` TOML command files.
- Commands use `{{args}}` for user input, `!{shell command}` for shell output, `@{file}` for file content.
- Specialists are internal postures (modes of reasoning), not spawned subagent processes.
- Gemini does not support `context: fork` — all skill execution is inline within the current session.
- Skills are loaded via MCP when the Cubis Foundry MCP server is configured. Local `.agents/skills/` paths serve as hints.
- User arguments are passed as natural language in the activation prompt.
- Rules file relative to the mirrored skill directory: `../../rules/GEMINI.md`.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when MCP is connected.
