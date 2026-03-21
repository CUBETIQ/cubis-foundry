---
name: frontend-design-style-selector
description: Select a non-generic visual direction from Foundry's normalized design datasets and align it to the product's domain, audience, and platform.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---
# Frontend Design Style Selector

## Purpose

Choose the visual direction before any screen or component work starts so the result has a deliberate point of view instead of a generic app-template look.

## When to Use

- Starting a new design system or screen family
- Improving a weak or generic UI prompt before Stitch generation
- Choosing a consistent mood for a Flutter/mobile app

## Instructions

1. **Use only Foundry datasets** — Load `workflows/design-datasets/style-directions.json`, `layout-patterns.json`, and `component-motifs.json` first.
2. **Select one primary direction and one supporting motif** — Avoid mixing many vibes. State the lead direction, supporting motif, and what should be excluded.
3. **Tie the direction to the product domain** — State why the chosen direction fits the product audience, task density, and emotional tone.
4. **Write anti-slop constraints** — Explicitly call out the visual clichés to avoid, such as generic wellness gradients, default dashboard cards, or unstructured glassmorphism.
5. **Feed the result into `frontend-design-system` or `frontend-design-screen-brief`** — This skill chooses direction; it does not finish the design state by itself.

## Output Format

Deliver:

1. Primary style direction
2. Supporting motif
3. Excluded clichés
4. Typography, palette, shape, and motion intent summary

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
