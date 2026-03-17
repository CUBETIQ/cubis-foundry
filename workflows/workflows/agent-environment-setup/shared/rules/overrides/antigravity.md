# Antigravity (Gemini) — Platform Overrides

## Platform Paths

- Rules: `.agents/rules/GEMINI.md`
- Skills: `.agents/skills/<skill-id>/SKILL.md`
- Gemini commands: `.gemini/commands/*.toml`
- Rules file: `GEMINI.md`

## Platform-Specific Routing

Gemini recognizes these additional entry points:

1. **Explicit Gemini command** (`.gemini/commands/*.toml`) — highest priority route.
2. Foundry compiles `/workflow` and `@agent` routes into command entry points instead of installing undocumented workspace workflow or agent folders.
3. Standard workflow/agent routing from shared steering.

## Gemini Commands

- Commands are `.toml` files with execution contract prompts.
- `trigger: always_on` frontmatter activates a command for every session.
- Commands support `description`, `steps`, and `tools` fields for structured execution.

## Agent Manager

- Gemini's Agent Manager handles multi-specialist coordination (equivalent to `@orchestrator`).
- In Foundry, specialist routes are exposed through generated command files rather than project-local agent markdown.
- Use Agent Manager when work crosses 2+ domains with explicit handoff needs.

## Platform Notes

- Gemini does not support MCP tool search natively — use `route_resolve` first, then skill loading.
- Skills loaded via MCP are supported when the Cubis Foundry MCP server is configured.
- Gemini supports function calling and tool use natively for code generation and analysis.
- Keep `.toml` commands focused — one command per task pattern for clean routing.
