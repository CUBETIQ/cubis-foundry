## Copilot Platform Notes

- Custom agents are defined in `.github/agents/*.md` with YAML frontmatter: `name`, `description`, `tools`, `model`, `handoffs`.
- Agent `handoffs` field enables guided workflow transitions (e.g., `@project-planner` → `@orchestrator`).
- Skill files are stored under `.github/skills/` (skill markdown) and `.github/prompts/` (prompt files).
- Path-scoped instructions in `.github/instructions/*.instructions.md` provide file-pattern-targeted guidance via `applyTo` frontmatter.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context: fork` and `allowed-tools` are not natively supported; guidance is advisory.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
- MCP configuration lives in `.vscode/mcp.json`. MCP skill tools are available when configured.
- Rules file: `.github/copilot-instructions.md` — broad and stable, not task-specific.
