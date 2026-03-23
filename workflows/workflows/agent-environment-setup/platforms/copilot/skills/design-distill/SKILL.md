---
name: design-distill
description: Remove clutter and reduce visual noise so the strongest parts of the interface can lead. Use when a UI is overbuilt, over-labeled, over-boxed, or trying to say too many things at once.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---
# Design Distill

## Purpose

Strip the interface down to the choices that matter. This skill should reduce complexity while preserving the product’s point of view and core actions.

## When to Use

- The page has too many cards, labels, or competing surfaces
- A UI feels busy even though the content is correct
- The design needs stronger focus rather than more flair
- Mobile views are especially noisy or over-dense

## Instructions

1. **Remove before restyling** — Cut weak containers, repetitive labels, decorative controls, and duplicate copy before adding new design moves.
2. **Keep the thesis intact** — Distillation should reveal the core design direction, not flatten it into a generic minimal page.
3. **Collapse weak hierarchy levels** — If several adjacent blocks have the same weight, merge or subordinate them.
4. **Reduce component redundancy** — Prefer fewer, stronger surface types over a page full of slightly different panels.
5. **Preserve critical states and actions** — Simplification should not erase wayfinding, feedback, or operational clarity.
6. **Re-check mobile after reduction** — Distilled desktop structure should turn into cleaner mobile staging, not empty space plus hidden actions.

## Output Format

Deliver:

1. Sources of clutter
2. Elements to remove or merge
3. What remains as the core thesis
4. Risks introduced by simplification
5. Recommended next step

## References

| File | Load when |
| --- | --- |
| `../frontend-design/references/visual-direction.md` | Distilling without losing the surface point of view. |
| `../frontend-design/references/component-architecture.md` | Removing redundant component layers while keeping structure coherent. |

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
