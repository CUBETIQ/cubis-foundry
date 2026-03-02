# MCP SkillPointer Catalog

This directory uses a progressive-disclosure pattern for MCP skills.

## Layout

- `mcp/skills/<skill-id>/SKILL.md`: lightweight pointer skills (startup-safe)
- `mcp/vault/index.json`: hidden MCP catalog index
- `mcp/vault/skills/<skill-id>/...`: full MCP playbooks and references
- `mcp/catalogs/default.json`: MCP pointer profile used by `--include-mcp`

## Runtime Behavior

- `cbx workflows install` still defaults to profile `core` (no MCP).
- `--include-mcp` installs MCP pointer skills from `mcp/catalogs/default.json`.
- When MCP pointers are installed, Foundry also installs hidden vault content to:
  - `<skills-root>/.mcp-vault`
- Pointer skills instruct the agent to browse `.mcp-vault` on demand with file tools.

This keeps startup context small while preserving full MCP guidance when needed.
