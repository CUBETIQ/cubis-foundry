# Gemini CLI — Platform Overrides

## Platform Paths

- Commands: `.gemini/commands`
- Rules file: `.gemini/GEMINI.md` (with `GEMINI.md` as compatibility read surface)
- Hooks: `.gemini/hooks/*` wired through `.gemini/settings.json`
- Skills: MCP-loaded guidance by default; optional hint-only `.agents/skills/<skill-id>/SKILL.md` when explicitly enabled

## Platform-Specific Routing

1. **Explicit Gemini command** (`.gemini/commands/*.toml`) — highest priority route.
2. Foundry compiles both `/workflow` and `@agent` specialist routes into command entry points when targeting Gemini CLI.
3. Standard workflow and MCP routing from shared steering.

## Platform Notes

- Gemini CLI uses GEMINI.md plus TOML commands as the primary enforcement surface.
- Gemini specialist behavior is command-based in the current Foundry ship model; do not claim `.gemini/agents/*.md` as a shipped surface until it is deliberately adopted.
- Use command wrappers to reinforce route-resolved execution and research escalation when freshness or public comparison matters.
