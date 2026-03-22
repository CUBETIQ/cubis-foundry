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

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents live under `../../agents/` relative to the mirrored skill directory and support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Current project-memory agents are `orchestrator` and `planner`; use them for durable project context.
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules live under `../../rules/` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
