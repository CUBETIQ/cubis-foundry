# Antigravity (Gemini) — Platform Overrides

## Platform Paths

- Workflows: `.agent/workflows`
- Agents: `.agent/agents`
- Skills: `.agent/skills`
- Gemini commands: `.gemini/commands/*.toml`
- Rules file: `GEMINI.md`

## Platform-Specific Routing

Gemini recognizes these additional entry points:

1. **Explicit Gemini command** (`.gemini/commands/*.toml`) — highest priority route.
2. **Agent Manager** for multi-agent coordination — Gemini's orchestration surface.
3. Standard workflow/agent routing from shared steering.

## Gemini Commands

- Commands are `.toml` files with execution contract prompts.
- `trigger: always_on` frontmatter activates a command for every session.
- Commands support `description`, `steps`, and `tools` fields for structured execution.

## Agent Manager

- Gemini's Agent Manager handles multi-specialist coordination (equivalent to `@orchestrator`).
- Agent Manager delegates to specialist agents defined in `.agent/agents/`.
- Use Agent Manager when work crosses 2+ domains with explicit handoff needs.

## Platform Notes

- Gemini does not support MCP tool search natively — use `route_resolve` first, then skill loading.
- Skills loaded via MCP are supported when the Cubis Foundry MCP server is configured.
- Gemini supports function calling and tool use natively for code generation and analysis.
- Keep `.toml` commands focused — one command per task pattern for clean routing.
