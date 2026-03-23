---
name: design-typeset
description: Repair or strengthen typography so text has hierarchy, voice, and readability instead of defaulting to generic app copy styling. Use for headlines, labels, body rhythm, and type-scale decisions.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
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
