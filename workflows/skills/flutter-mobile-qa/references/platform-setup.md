# Flutter Mobile QA Platform Setup

## Secure defaults

- Use the Android MCP sample as a reference transport, not as a blind trust root.
- Pin the package version: `android-mcp-server@1.3.0`.
- Prefer workspace or project config over global config unless the user explicitly wants a machine-wide install.
- Do **not** commit machine-specific `ANDROID_HOME` values. Let the runtime inherit `ANDROID_HOME` from the shell or rely on default SDK autodiscovery when it works.
- Treat `adb_shell` as an advanced escape hatch, not a standard step in the happy path.

## Recommended package

- Upstream sample: [martingeidobler/android-mcp-server](https://github.com/martingeidobler/android-mcp-server)
- Safe Foundry stance:
  - pin the package version
  - use repo-local config files where supported
  - keep SDK paths and credentials out of committed project config

## Client surfaces

| Platform | Project-local config | Global config | Format |
| --- | --- | --- | --- |
| Codex | `.vscode/mcp.json` | `codex mcp add ...` or `~/.codex/config.toml` | JSON / CLI |
| Claude Code | `.mcp.json` | `~/.claude/mcp.json` | JSON |
| GitHub Copilot | `.vscode/mcp.json` | `~/.copilot/mcp-config.json` | JSON |
| Gemini CLI | `.gemini/settings.json` | `~/.gemini/settings.json` | JSON |
| Antigravity | `.gemini/settings.json` | `~/.gemini/settings.json` | JSON |

## Project config snippets

### Claude Code project config

```json
{
  "mcpServers": {
    "android": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "android-mcp-server@1.3.0"]
    }
  }
}
```

### Codex or GitHub Copilot project config (`.vscode/mcp.json`)

```json
{
  "servers": {
    "android": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "android-mcp-server@1.3.0"],
      "env": {}
    }
  }
}
```

### Gemini CLI or Antigravity project config (`.gemini/settings.json`)

```json
{
  "mcpServers": {
    "android": {
      "command": "npx",
      "args": ["-y", "android-mcp-server@1.3.0"],
      "env": {}
    }
  }
}
```

## Global config shortcuts

### Codex CLI

```bash
codex mcp add android -- npx -y android-mcp-server@1.3.0
```

### Claude Code

```bash
claude mcp add --scope user android -- npx -y android-mcp-server@1.3.0
```

## Verification order

1. Confirm `adb` works outside the MCP server.
2. Confirm the emulator or device is visible.
3. Confirm the MCP client loads the `android` server without parse errors.
4. Run a low-risk call first: `list_devices` or `get_device_info`.
5. Only then move to screenshots, UI tree, and interaction tools.

## What not to commit

- Absolute `ANDROID_HOME` values
- Private keystore paths
- Test usernames or passwords
- Saved screenshots or logs outside the workspace artifact directory

## Failure handling

- If the client cannot start the server, verify `node`, `npx`, `adb`, and Android SDK availability before changing prompts.
- If the server starts but no devices appear, stop and fix the emulator/device state first.
- If only `adb_shell` can make progress, call out the missing higher-level tool or app instrumentation as a product gap.
