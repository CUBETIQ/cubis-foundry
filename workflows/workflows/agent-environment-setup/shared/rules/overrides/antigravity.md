# Antigravity (Gemini) — Platform Overrides

## Platform Paths

- Workflows: `.agent/workflows`
- Agents: `.agent/agents`
- Skills: `.agent/skills`
- Rules file: `GEMINI.md`

## Platform-Specific Routing

Gemini recognizes these additional entry points:

1. **Explicit Gemini command** (`.gemini/commands/*.toml`) — highest priority route.
2. Standard workflow/agent routing from shared steering.

## Platform Notes

- Gemini native commands are `.toml` files with execution contract prompts.
- `trigger: always_on` frontmatter activates a command for every session.
- Gemini does not support MCP tool search natively — use `route_resolve` first, then skill loading.
