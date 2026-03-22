---
name: frontend-design-core
description: Establish the design-engine execution order, canonical design-state model, and the repo-first constraints for serious frontend or mobile design work.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---
# Frontend Design Core

## Purpose

Define the design-engine control flow before any UI generation or implementation work starts. This skill resolves canonical design state, chooses the right overlays, and keeps design prep ahead of Stitch or implementation.

## When to Use

- Starting a design-heavy feature, redesign, or new screen set
- Resolving `docs/foundation/DESIGN.md` and page/flow/mobile overlays
- Turning vague UX intent into a design-engine plan before code or Stitch calls
- Coordinating design work across web, Stitch, and Flutter/mobile outputs

## Instructions

1. **Treat `docs/foundation/DESIGN.md` as canonical** — Every design-heavy task starts from the canonical design system document. `.stitch/DESIGN.md` is a generated compatibility mirror only.
2. **Resolve overlays in a fixed order** — Start with the canonical design system, then load any relevant overlay from `docs/foundation/design/pages`, `docs/foundation/design/flows`, or `docs/foundation/design/mobile`, then produce the task-specific screen brief.
3. **Keep external research out of the runtime path** — Use only Foundry-owned normalized datasets from `workflows/design-datasets/*.json` during execution. Do not paste raw external source text into prompts.
4. **Choose the smallest design capability set** — Use `frontend-design-style-selector` to choose the visual direction, `frontend-design-system` when the design state is missing or stale, `frontend-design-screen-brief` when the task needs a concrete screen brief, `frontend-design-mobile-patterns` for Flutter/mobile-specific adaptation, and `frontend-design-implementation-handoff` when translating the result into production code.
5. **Do not let Stitch lead the thinking** — Stitch generation or edits happen only after the design state and screen brief are ready.

## Output Format

Deliver:

1. Canonical design inputs used
2. Applied overlays
3. Design-engine capability stack selected
4. Next action: design-system, screen-brief, Stitch, or implementation

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
