## Stitch MCP in Cubis Foundry

Cubis Foundry treats Google Stitch as a gateway-backed service on every active platform:

- `codex`
- `claude`
- `copilot`
- `gemini`
- `antigravity`

The CLI no longer installs standalone client-side Stitch MCP definitions as the default path. Instead, it registers `cubis-foundry` as the MCP server for the selected client, then exposes Stitch through Foundry passthrough tools and the canonical `stitch` skill.

## Security Model

- Raw Stitch API keys belong in `~/.cbx/credentials.env`.
- `cbx_config.json` stores only metadata such as `activeProfileName`, `apiKeyEnvVar`, and `mcpUrl`.
- Generated client runtime configs must not contain raw `X-Goog-Api-Key` values.
- `cbx workflows config keys doctor` scans for leaked inline Stitch and Postman credentials.
- `cbx workflows config keys migrate-inline` scrubs leaks and reapplies secure Foundry MCP wiring.

Recommended setup:

```bash
export STITCH_API_KEY_DEFAULT="<your-stitch-api-key>"
cbx workflows config keys persist-env --service stitch --scope global
```

## Install

### Codex

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --stitch --yes
```

Runtime target:

- global: `~/.codex/config.toml`
- project: `<workspace>/.vscode/mcp.json`

### Claude Code

```bash
cbx workflows install --platform claude --bundle agent-environment-setup --stitch --yes
```

Runtime target:

- global: `~/.claude/mcp.json`
- project: `<workspace>/.mcp.json`

### GitHub Copilot

```bash
cbx workflows install --platform copilot --bundle agent-environment-setup --stitch --yes
```

Runtime target:

- global: `~/.copilot/mcp-config.json`
- project: `<workspace>/.vscode/mcp.json`

### Gemini CLI

```bash
cbx workflows install --platform gemini --bundle agent-environment-setup --stitch --yes
```

Runtime target:

- global: `~/.gemini/settings.json`
- project: `<workspace>/.gemini/settings.json`

### Antigravity

```bash
cbx workflows install --platform antigravity --bundle agent-environment-setup --stitch --yes
```

Runtime target:

- global: `~/.gemini/settings.json`
- project: `<workspace>/.gemini/settings.json`

## What the Install Does

- writes or updates `cbx_config.json` with Stitch profile metadata only
- persists selected credential env values into `~/.cbx/credentials.env`
- registers `cubis-foundry` in the selected client runtime config
- installs the canonical `stitch` skill and generated platform mirrors
- removes legacy direct Stitch/Postman runtime entries when found
- removes legacy `.cbx/mcp/<platform>/stitch.json` artifacts when found

## Verify

Use the Foundry gateway and Stitch status tools after install:

```bash
cbx workflows config --scope project --show
cbx mcp tools list --service stitch --scope project
```

Inside the client session, verify with the gateway-facing tools before relying on Stitch artifacts:

- `mcp_gateway_status`
- `stitch_get_status`
- `stitch_list_enabled_tools`

## Expected Usage Pattern

When a request mentions Stitch screens, design-to-code, screen sync, or UI diffs:

1. Load the `stitch` skill first.
2. Verify Stitch is configured and reachable.
3. Fetch real Stitch artifacts before changing code.
4. Map the artifacts into the repo’s actual design system and framework.
5. Prefer minimal diffs when patching existing screens.

Typical prompt shapes:

- “Use Stitch to implement the latest login screen in this React app.”
- “Sync this existing mobile screen to the newest Stitch artifact and patch only the diff.”
- “Pull the Stitch screen and adapt it to our Tailwind token system.”

## Repair Leaks or Legacy Wiring

```bash
cbx workflows config keys doctor --scope project
cbx workflows config keys migrate-inline --scope project
```

This checks:

- `<workspace>/cbx_config.json`
- `~/.cbx/cbx_config.json`
- generated `.cbx/mcp/*` artifacts
- `.vscode/mcp.json`
- `.mcp.json`
- `.gemini/settings.json`
- `~/.copilot/mcp-config.json`
- `~/.codex/config.toml`

## References

- [Stitch MCP upstream](https://github.com/davideast/stitch-mcp)
- [OpenAI Codex MCP docs](https://developers.openai.com/codex/mcp/)
- [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Gemini CLI MCP docs](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md)
- [VS Code / Copilot MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
