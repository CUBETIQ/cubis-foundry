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

## Codex Platform Notes

- Codex supports native subagents via `.codex/agents/*.toml` files with `name`, `description`, and `developer_instructions`.
- Each subagent TOML can specify `model` and `model_reasoning_effort` to optimize cost per task difficulty:
  - Light tasks (exploration, docs): `model = "gpt-5.3-codex-spark"`, `model_reasoning_effort = "medium"`
  - Heavy tasks (security audit, orchestration): `model = "gpt-5.4"`, `model_reasoning_effort = "high"`
  - Standard tasks (implementation): inherit parent model (omit `model` field).
- Built-in agents: `default`, `worker`, `explorer`. Custom agents extend these via TOML definitions.
- Codex operates under network restrictions — skills should not assume outbound HTTP access.
- Use `$ARGUMENTS` to access user-provided arguments when the skill is invoked.
- All skill guidance executes within the sandbox; file I/O is confined to the workspace.
- Skills are installed at `.agents/skills/<skill-id>/SKILL.md`. Workflow skills can also be compiled to `.agents/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
- Codex supports three autonomy levels: `suggest`, `auto-edit`, `full-auto`.
- MCP skill tools are available when the Cubis Foundry MCP server is connected.
