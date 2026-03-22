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
