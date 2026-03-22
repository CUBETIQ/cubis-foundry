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
