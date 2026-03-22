---
name: stitch-prompt-enhancement
description: Transform rough UI intent into compact, Stitch-ready prompts that encode visual direction, component structure, design-system context, and constrained change scope.
---
# Stitch Prompt Enhancement

## Purpose

Improve UI prompts before they reach Stitch. This skill turns vague product or design requests into compact structured briefs that Stitch can interpret reliably without wasting requests on low-quality prompts.

## When to Use

- A user gives a vague UI or screen request
- A previous Stitch result was too generic or off-target
- A task needs design-system context injected into the prompt
- An existing screen should be edited with one or two precise changes

## Instructions

1. **Start from the real task, not a generic design template** — Restate the actual screen, route, audience, and product goal before writing the Stitch prompt.

2. **Pull the visual direction from `frontend-design` and the design engine** — Use the chosen mood, composition, typography voice, token language, and any `frontend-design-screen-brief` output instead of inventing an unrelated aesthetic.

3. **Read `docs/foundation/DESIGN.md` and overlays when they exist** — Use the canonical design context plus any relevant page, flow, or mobile overlay as the source of truth, then assume `.stitch/DESIGN.md` mirrors the resolved state for Stitch-facing flows.

4. **Keep prompts compact and structured** — Name platform, page purpose, visual style, component hierarchy, and the exact requested change. Do not dump raw repo context or large docs into the prompt.

5. **Use design language Stitch understands** — Prefer concrete UI terms like navigation bar, hero section, card grid, settings form, primary CTA, sticky filter rail, or mobile tab bar over vague requests like “make it nicer”.

6. **For edits, ask Stitch for one or two deltas at a time** — Do not bundle unrelated redesign requests into a single edit prompt once a screen already exists.

7. **Inject design-system details semantically** — Describe token roles and component styles in natural language backed by exact values only when needed.

8. **End with a tool-ready prompt block** — The output should be ready for `generate_screen_from_text`, `edit_screens`, or `generate_variants` without another rewriting pass.

## Output Format

Deliver:

1. **Prompt intent summary** — page purpose, platform, and change scope
2. **Stitch-ready prompt** — the final compact structured prompt
3. **Assumptions** — only the assumptions that meaningfully affected the prompt
4. **Edit mode note** — if applicable, the exact deltas that should be requested instead of a full redesign

## References

| File | Load when |
| --- | --- |
| `references/prompt-structure.md` | Need the preferred structure for a Stitch-ready prompt. |
| `../frontend-design/references/visual-direction.md` | Need the product mood and compositional voice before prompting Stitch. |
| `../frontend-design/references/design-tokens.md` | Need semantic token language for colors, spacing, radius, and typography. |

## Examples

| File | Use when |
| --- | --- |
| `examples/01-dashboard-prompt.md` | Converting a vague dashboard request into a compact structured Stitch prompt. |

## Codex Stitch Prompt Rules

- Convert vague UI intent into a compact prompt that names the target screen, visual direction, component hierarchy, and exact change scope.
- Pull design language from `frontend-design` and `docs/foundation/DESIGN.md` instead of pasting raw repo context or long transcripts into Stitch.
- Keep edit prompts narrow on Codex: request one or two deltas at a time once a screen already exists.

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
