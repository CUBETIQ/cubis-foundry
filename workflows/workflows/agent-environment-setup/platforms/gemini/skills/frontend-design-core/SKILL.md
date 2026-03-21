---
name: frontend-design-core
description: Establish the design-engine execution order, canonical design-state model, and the repo-first constraints for serious frontend or mobile design work.
---
# Frontend Design Core

## Purpose

Define the design-engine control flow before any UI generation or implementation work starts. This skill resolves canonical design state, chooses the right overlays, and keeps design prep ahead of Stitch or implementation.

## When to Use

- Starting a design-heavy feature, redesign, or new screen set
- Resolving `docs/foundation/DESIGN.md` and page/flow/mobile overlays
- Turning vague UX intent into a design-engine plan before code or Stitch calls
- Coordinating design work across web, Stitch, and Flutter/mobile outputs

## Instructions

1. **Treat `docs/foundation/DESIGN.md` as canonical** — Every design-heavy task starts from the canonical design system document. `.stitch/DESIGN.md` is a generated compatibility mirror only.
2. **Resolve overlays in a fixed order** — Start with the canonical design system, then load any relevant overlay from `docs/foundation/design/pages`, `docs/foundation/design/flows`, or `docs/foundation/design/mobile`, then produce the task-specific screen brief.
3. **Keep external research out of the runtime path** — Use only Foundry-owned normalized datasets from `workflows/design-datasets/*.json` during execution. Do not paste raw external source text into prompts.
4. **Choose the smallest design capability set** — Use `frontend-design-style-selector` to choose the visual direction, `frontend-design-system` when the design state is missing or stale, `frontend-design-screen-brief` when the task needs a concrete screen brief, `frontend-design-mobile-patterns` for Flutter/mobile-specific adaptation, and `frontend-design-implementation-handoff` when translating the result into production code.
5. **Do not let Stitch lead the thinking** — Stitch generation or edits happen only after the design state and screen brief are ready.

## Output Format

Deliver:

1. Canonical design inputs used
2. Applied overlays
3. Design-engine capability stack selected
4. Next action: design-system, screen-brief, Stitch, or implementation

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
