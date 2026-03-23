---
name: design-bolder
description: Increase visual conviction when a UI is safe, bland, or too polite. Use to strengthen hierarchy, contrast, motif repetition, and brand character without making the surface chaotic.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---
# Design Bolder

## Purpose

Push a safe design toward a clearer visual thesis. This skill should make the surface more memorable by strengthening one or two deliberate moves, not by adding random effects.

## When to Use

- The design is competent but forgettable
- Hierarchy is too even and nothing leads the eye
- The current implementation feels like a polite template
- The UI needs stronger voice without a full redesign

## Instructions

1. **Strengthen only a few moves** — Increase conviction through typography, composition, contrast, or motif repetition instead of changing everything at once.
2. **Preserve usability** — Make the interface sharper without damaging scannability, readability, or action clarity.
3. **Prefer systemic changes** — Amplify headline behavior, border treatment, layout contrast, or accent logic across the surface rather than in one isolated section.
4. **Do not substitute noise for conviction** — Avoid gimmick gradients, random shadows, novelty fonts, or decorative motion when they do not support the product job.
5. **Check mobile impact** — Stronger desktop expression must still stage correctly on small screens.

## Output Format

Deliver:

1. What feels too safe
2. The one or two moves to amplify
3. Specific changes to hierarchy, contrast, or motif
4. Usability guardrails
5. Verification notes

## References

| File | Load when |
| --- | --- |
| `../frontend-design/references/visual-direction.md` | Choosing which visual moves to amplify and repeat. |
| `../frontend-design/references/animation.md` | Adding emphasis through motion only when it serves hierarchy or feedback. |

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
