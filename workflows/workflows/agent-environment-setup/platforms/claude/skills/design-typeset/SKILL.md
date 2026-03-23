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
