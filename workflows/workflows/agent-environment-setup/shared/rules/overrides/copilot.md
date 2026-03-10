# Copilot — Platform Overrides

## Platform Paths

- Workflows: `.github/copilot/workflows`
- Agents: `.github/agents`
- Skills: `.github/skills`
- Rules file: `copilot-instructions.md`
- Agent rules: `AGENTS.md`

## Platform-Specific Routing

1. **Explicit workflow prompt or `@agent`** — highest priority route.
2. Copilot prompt files (`.github/prompts/*.prompt.md`) provide structured entry points.
3. Standard workflow/agent routing from shared steering.

## Platform Notes

- Copilot supports path-scoped instructions (`applyTo` in `.github/*.md` frontmatter).
- MCP tools are configured via `.vscode/mcp.json` or VS Code settings — not inline.
- Copilot agent frontmatter supports: `name`, `description`, `tools`, `target`, `infer`, `mcp-servers`, `metadata`, `model`, `handoffs`, `argument-hint`.

## Copilot Asset Authoring

When creating Copilot-specific assets:

- Use `.prompt.md` extension for prompt files.
- Declare `#file:` references for file context injection.
- Keep prompt files focused — one prompt per task type.
- Test with `@workspace` and custom `@agent-name` invocations.
