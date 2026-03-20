# Copilot — Platform Overrides

## Platform Paths

- Custom agents: `.github/agents/*.agent.md`
- Skills: `.github/skills`
- Rules file: `.github/copilot-instructions.md`
- Path-scoped instructions: `.github/instructions/*.instructions.md`
- Prompt files: `.github/prompts/*.prompt.md`
- Hooks: `.github/hooks/*.json` plus helper scripts
- MCP configuration: `.vscode/mcp.json`

## Platform-Specific Routing

1. **Explicit workflow prompt or `@agent` custom agent** — highest priority route.
2. `/workflow` routes compile into prompt files (`.github/prompts/*.prompt.md`).
3. Standard workflow/agent routing from shared steering.

## Agent Handoffs

- Custom agents with `handoffs:` frontmatter offer guided workflow transitions (e.g., `@debugger` -> `@tester`).
- The `@orchestrator` has `agents: ["*"]` — it can delegate to any specialist.
- The `@planner` can hand off to `@implementer` or return work to `@orchestrator`.
- Handoffs are suggestions — the user decides when to follow them.

## Platform Notes

- Copilot supports path-scoped instructions (`applyTo` in `.github/instructions/*.instructions.md` frontmatter).
- MCP tools are configured via `.vscode/mcp.json` or VS Code settings — not inline.
- Copilot custom-agent frontmatter supports: `name`, `description`, `tools`, `model`, `handoffs`, `agents`, `argument-hint`, `mcp-servers`, `metadata`.
- Skills support `argument-hint`, `disable-model-invocation`, and `user-invocable` frontmatter keys.

## Copilot Asset Authoring

When creating Copilot-specific assets:

- Use `.agent.md` extension for custom agents.
- Use `.prompt.md` extension for workflow prompt files.
- Declare `#file:` references for file context injection.
- Keep prompt files focused — one prompt per task type.
- Test with `@workspace` and custom `@agent-name` invocations.
