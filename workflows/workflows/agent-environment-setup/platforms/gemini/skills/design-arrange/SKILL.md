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
