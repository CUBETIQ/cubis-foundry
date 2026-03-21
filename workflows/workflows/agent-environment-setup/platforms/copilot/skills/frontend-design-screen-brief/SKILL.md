---
name: frontend-design-screen-brief
description: Turn canonical design state plus overlays into a compact, high-signal screen brief for Stitch, frontend implementation, or Flutter/mobile work.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
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

## Copilot Platform Notes

- Custom agents live under `../../agents/` relative to the mirrored skill directory and use YAML frontmatter such as `name`, `description`, `tools`, `model`, and `handoffs`.
- Agent `handoffs` can guide workflow transitions (for example, `@planner` → `@implementer`).
- Skill files are stored under `.github/skills/` (skill markdown) and `.github/prompts/` (prompt files).
- Path-scoped instructions live under `../../instructions/` and provide file-pattern-targeted guidance via `applyTo` frontmatter.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context: fork` and `allowed-tools` are not natively supported; guidance is advisory.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
- MCP configuration lives in `.vscode/mcp.json`. MCP skill tools are available when configured.
- Rules file relative to the mirrored skill directory: `../../rules/copilot-instructions.md` — broad and stable, not task-specific.
