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

## Antigravity Platform Notes

- Skills are stored under `.agents/skills/<skill-id>/SKILL.md` (shared Agent Skills standard path).
- TOML command files in `.gemini/commands/` provide slash-command entry points for workflows and agent routes.
- Rules file relative to the mirrored skill directory: `../../rules/GEMINI.md`.
- Use Agent Manager for parallel agent coordination and multi-specialist delegation (equivalent to `@orchestrator`).
- Specialist routes are compiled into `.gemini/commands/agent-*.toml` command files — not project-local agent markdown.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when Cubis Foundry MCP is configured.
- User arguments are passed as natural language via `{{args}}` in TOML command prompts.
