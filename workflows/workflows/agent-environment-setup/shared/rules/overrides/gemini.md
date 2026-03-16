# Gemini CLI — Platform Overrides

## Platform Paths

- Workflows: `.gemini/workflows`
- Skills: `.gemini/skills`
- Commands: `.gemini/commands`
- Rules file: `.gemini/GEMINI.md` (or `GEMINI.md` at repo root when used directly)

## Platform-Specific Routing

1. **Explicit Gemini command** (`.gemini/commands/*.toml`) — highest priority route.
2. **Explicit workflow or named skill** — honor it directly before route discovery.
3. Standard workflow and MCP routing from shared steering.

## Platform Notes

- Gemini CLI uses GEMINI.md plus TOML commands as the primary enforcement surface.
- Gemini specialist behavior is posture-based; it does not rely on standalone agent markdown in the project profile.
- Use command wrappers to reinforce route-resolved execution and research escalation when freshness or public comparison matters.
