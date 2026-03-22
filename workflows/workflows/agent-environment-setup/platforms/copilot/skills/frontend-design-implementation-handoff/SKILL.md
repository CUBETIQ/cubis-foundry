---
name: frontend-design-implementation-handoff
description: Translate design-engine output into repo-native implementation work, preferring real components, Flutter widgets, and existing tokens over pasted generated markup.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---
# Frontend Design Implementation Handoff

## Purpose

Convert the design-engine result into implementation work that matches the repo's real stack and components instead of copying raw generated artifacts.

## When to Use

- After Stitch returns a screen artifact
- After a design screen brief is approved for implementation
- When moving from design state into Flutter, React, or another real UI stack

## Instructions

1. **Prefer existing components and tokens first** — Reuse the repo's real primitives before creating new visual fragments.
2. **Translate semantics, not markup** — A generated artifact is a seed. Rebuild it in the target stack using the same hierarchy and state model.
3. **For Flutter, map into widgets and theme tokens** — Use theme extensions, shared cards, section headers, and navigation widgets instead of porting web structure literally.
4. **Preserve the brief's anti-slop constraints** — Distinctive typography, component rhythm, and motion rules should survive the handoff.
5. **Leave QA hooks behind** — Ensure semantics labels, stable copy, and navigable flows are good enough for `flutter-mobile-qa` or frontend tests.

## Output Format

Deliver:

1. Implementation plan
2. Components/widgets to create or reuse
3. Token/theme mapping
4. QA-readiness notes

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
