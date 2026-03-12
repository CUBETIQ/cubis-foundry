# Copilot — Platform Overrides

## Platform Paths

- Workflows: `.github/copilot/workflows`
- Agents: `.github/agents`
- Skills: `.github/skills`
- Rules file: `copilot-instructions.md`
- Path-scoped instructions: `.github/instructions/*.instructions.md`
- Prompt files: `.github/prompts/*.prompt.md`
- MCP configuration: `.vscode/mcp.json`

## Platform-Specific Routing

1. **Explicit workflow prompt or `@agent`** — highest priority route.
2. Copilot prompt files (`.github/prompts/*.prompt.md`) provide structured entry points.
3. Standard workflow/agent routing from shared steering.

## Agent Handoffs

- Agents with `handoffs:` frontmatter offer guided workflow transitions (e.g., `@debugger` → `@test-engineer`).
- The `@orchestrator` has `agents: ["*"]` — it can delegate to any specialist.
- The `@project-planner` can delegate to `@researcher` and `@orchestrator`.
- Handoffs are suggestions — the user decides when to follow them.

## Platform Notes

- Copilot supports path-scoped instructions (`applyTo` in `.github/instructions/*.instructions.md` frontmatter).
- MCP tools are configured via `.vscode/mcp.json` or VS Code settings — not inline.
- Copilot agent frontmatter supports: `name`, `description`, `tools`, `model`, `handoffs`, `agents`, `argument-hint`, `mcp-servers`, `metadata`.
- Skills support `argument-hint`, `disable-model-invocation`, and `user-invocable` frontmatter keys.

## Copilot Asset Authoring

When creating Copilot-specific assets:

- Use `.prompt.md` extension for prompt files.
- Declare `#file:` references for file context injection.
- Keep prompt files focused — one prompt per task type.
- Test with `@workspace` and custom `@agent-name` invocations.
