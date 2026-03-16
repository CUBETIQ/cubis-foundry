# Stitch Platform Setup

## Verification order

1. Run `stitch_get_status` to confirm the active profile, URL, env-var alias, and scope.
2. Run `mcp_gateway_status` to confirm the Cubis Foundry gateway sees Stitch as available.
3. Run `stitch_list_enabled_tools` to confirm the enabled upstream Stitch tools.

If any of those fail, stop treating Stitch as authoritative input.

## Credential expectations

- Stitch credentials are machine-scoped and should come from `~/.cbx/credentials.env` or an already-exported environment variable.
- Project files and generated MCP config should never contain raw API keys.
- The gateway path is the default client-facing path. The local client should connect to `cubis-foundry`, then use the Stitch passthrough tools exposed through that server.

## Client-specific verification

Use the platform runtime surface that actually owns the `cubis-foundry` registration:

- Codex:
  - project: `.vscode/mcp.json`
  - global: `~/.codex/config.toml`
- Claude Code:
  - project: `.mcp.json`
  - global: `~/.claude/mcp.json`
- GitHub Copilot:
  - project: `.vscode/mcp.json`
  - global: `~/.copilot/mcp-config.json`
- Gemini CLI:
  - project: `.gemini/settings.json`
  - global: `~/.gemini/settings.json`
- Antigravity:
  - project: `.gemini/settings.json`
  - global: `~/.gemini/settings.json`

For every platform, the expected secure model is the same:

- client config points at `cubis-foundry`
- `cbx_config.json` stores the Stitch env-var alias only
- `~/.cbx/credentials.env` or the live shell environment stores the actual key

## Secure fallback behavior

- If Stitch is configured but unavailable, continue only with a repo-grounded fallback and call out that the implementation is not verified against live Stitch artifacts.
- If a task explicitly requires live Stitch parity, stop and report the configuration/runtime issue instead of guessing.
