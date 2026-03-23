---
name: design-arrange
description: Repair layout, spacing, and visual rhythm when a UI has the right ingredients but the composition still feels templated, monotonous, or badly prioritized.
---
# Design Arrange

## Purpose

Recompose the surface so hierarchy, rhythm, and repeated motifs feel intentional. This skill is for layout repair, not generic beautification.

## When to Use

- The page has a “cards on cards” or “hero plus sidebar” feel
- Content is technically present but visually monotone
- Mobile layout simply collapses instead of re-composing
- The interface lacks one repeated compositional move

## Instructions

1. **Change the composition, not just the padding** — Rearrange zones, hierarchy, and emphasis when the page structure is weak.
2. **Pick one compositional thesis** — Use a dominant move such as a control rail, split editorial feature, anchored canvas, or strong divider rhythm and repeat it.
3. **Kill dead boxes** — Remove containers that only decorate content instead of clarifying hierarchy or action.
4. **Eliminate dead shell tracks** — If a major page column or rail is mostly empty, collapse it, fill it with real content, or move the composition to a single-shell structure.
5. **Design the mobile composition separately** — Re-stage order, density, and action placement instead of only stacking columns.
6. **Use spacing to create rhythm** — Differentiate tight, normal, and spacious zones so every block does not feel equally weighted.
7. **Preserve testability** — Rearrangement should still yield clear landmarks, headings, and meaningful interaction zones.

## Output Format

Deliver:

1. Composition diagnosis
2. Dominant layout move
3. Structural changes required
4. Mobile re-composition notes
5. Risks or follow-on skills

## References

| File | Load when |
| --- | --- |
| `../frontend-design/references/visual-direction.md` | Choosing the repeated compositional move and emphasis thesis. |
| `../frontend-design/references/responsive-patterns.md` | Reworking layout behavior across breakpoints without simple collapse. |

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
