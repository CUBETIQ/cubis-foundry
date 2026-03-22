---
name: frontend-design-screen-brief
description: Turn canonical design state plus overlays into a compact, high-signal screen brief for Stitch, frontend implementation, or Flutter/mobile work.
---
# Frontend Design Screen Brief

## Purpose

Produce the compact screen-level brief that downstream tools or engineers can execute without losing the product's visual and interaction intent.

## When to Use

- Preparing a Stitch generation or edit prompt
- Creating a Flutter/mobile screen implementation brief
- Turning a broad design system into a concrete page or flow

## Instructions

1. **Resolve the design state first** — Read `docs/foundation/DESIGN.md` and any relevant overlay before writing the brief.
2. **Describe behavior, not just appearance** — Include hierarchy, interaction states, content priority, empty states, and success/failure feedback.
3. **Keep the prompt compact** — The screen brief should be concise enough for a remote service like Stitch and concrete enough for a human implementer.
4. **Choose platform-specific emphasis** — For Flutter/mobile, emphasize thumb reach, section staging, safe areas, and navigation patterns. For web, emphasize layout elasticity and information density.
5. **Write acceptance constraints** — Explicitly state what must be preserved and what generic shortcuts are not acceptable.

## Output Format

Deliver:

1. Screen goal
2. Hierarchy and layout summary
3. Token and component cues
4. Interaction/motion notes
5. Anti-slop constraints

## Antigravity Platform Notes

- Skills are stored under `.agents/skills/<skill-id>/SKILL.md` (shared Agent Skills standard path).
- TOML command files in `.gemini/commands/` provide slash-command entry points for workflows and agent routes.
- Rules file relative to the mirrored skill directory: `../../rules/GEMINI.md`.
- Use Agent Manager for parallel agent coordination and multi-specialist delegation (equivalent to `@orchestrator`).
- Specialist routes are compiled into `.gemini/commands/agent-*.toml` command files — not project-local agent markdown.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when Cubis Foundry MCP is configured.
- User arguments are passed as natural language via `{{args}}` in TOML command prompts.
