---
name: design-typeset
description: Repair or strengthen typography so text has hierarchy, voice, and readability instead of defaulting to generic app copy styling. Use for headlines, labels, body rhythm, and type-scale decisions.
---
# Design Typeset

## Purpose

Fix typography as a first-class design system concern. This skill should improve hierarchy, font choice, sizing, spacing, line length, and label rhythm so the interface stops looking like “default text dropped into boxes.”

## When to Use

- The UI feels generic because the type system is weak
- Headings, labels, and body copy do not create clear hierarchy
- Editorial surfaces need stronger voice
- App surfaces need cleaner, more disciplined text behavior

## Instructions

1. **Audit type as a system** — Review headline scale, body rhythm, labels, buttons, numbers, and metadata together because isolated font changes rarely fix the problem.
2. **Avoid generic defaults without justification** — Do not fall back to Inter, Roboto, Arial, or undifferentiated system stacks unless the product already owns that choice.
3. **Match the scale to the surface** — Favor disciplined fixed scales for product UI and reserve more fluid display behavior for marketing or editorial surfaces.
4. **Use contrast in role, not just size** — Distinguish headings, labels, data, prose, and controls with weight, case, spacing, and family choices where appropriate.
5. **Improve readability and rhythm** — Fix line length, line height, paragraph breaks, widows, label density, and numeric emphasis.
6. **Keep typography tied to the design context** — The type system should reinforce the product mood, not fight it.

## Output Format

Deliver:

1. Current typography diagnosis
2. Revised type system rules
3. Key hierarchy changes
4. Generic-default risks removed
5. Verification notes

## References

| File | Load when |
| --- | --- |
| `../frontend-design/references/visual-direction.md` | Matching type voice to the surface mood and motif. |
| `../frontend-design/references/design-tokens.md` | Encoding type decisions into reusable token rules. |

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
