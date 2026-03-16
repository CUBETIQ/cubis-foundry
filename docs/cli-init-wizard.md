# Cubis Foundry `cbx init` Wizard

## Purpose

`cbx init` provides a guided, interactive installation flow for Cubis Foundry.
It is intended for onboarding and manual setup sessions.

For explicit automation/scripting, use `cbx workflows install`.

## Command

```bash
cbx init [--yes] [--dry-run] [--overwrite] [--target <path>] [--bundle <bundleId>] [--platforms <csv>] [--mcps <csv>] [--skill-profile <profile>] [--skills-scope <scope>] [--mcp-scope <scope>] [--postman-mode <mode>] [--postman-workspace-id <id|null>] [--mcp-runtime <docker|local>] [--mcp-build-local] [--no-banner] [--json]
```

Options:
- `--yes`: skip final confirmation and use defaults where prompts are skipped.
- `--dry-run`: preview all actions without writing files.
- `--overwrite`: replace existing generated files instead of skipping.
- `--target <path>`: run install logic against another project directory.
- `--bundle <bundleId>`: preselect bundle id (used as interactive default and non-interactive value).
- `--platforms <csv>`: comma-separated platforms (`codex,antigravity,copilot,claude,gemini`).
- `--mcps <csv>`: comma-separated MCP integrations (`cubis-foundry,postman,stitch,playwright`).
- `--skill-profile <profile>`: `core`, `web-backend`, `full`.
- `--skills-scope <scope>`: deprecated for `cbx init`; installs are workspace-oriented.
- `--mcp-scope <scope>`: deprecated for `cbx init`; MCP config is workspace-oriented during init.
- `--postman-mode <mode>`: `full` or `minimal`.
- `--postman-workspace-id <id|null>`: set default Postman workspace id in non-interactive mode (`null` clears default workspace).
- `--mcp-runtime <docker|local>`: preselect MCP runtime (used in non-interactive mode and as interactive default).
- `--mcp-build-local`: when runtime is docker, build MCP image locally instead of pull.
- `--no-banner`: disable welcome banner output.
- `--json`: print machine-readable final summary.

## Wizard Flow

1. Welcome banner (ACS-style Cubis Foundry text + CLI version).
2. Bundle selection.
3. Platform multi-select.
4. Skills profile selection (`core`, `web-backend`, `full`).
5. MCP multi-select (`Cubis Foundry`, `Postman`, `Stitch`, `Playwright`).
6. MCP runtime selection (`local command server`, `docker pull`, `docker local build`) when Cubis Foundry, Postman, or Stitch is selected.
7. Conditional prompts:
   - Postman selected:
     - Postman mode (`full` or `minimal`)
     - secure Postman API key input (optional)
     - default Postman workspace selection:
       - interactive workspace list (when API key is available)
       - manual workspace id input fallback
   - Stitch selected:
     - secure Stitch API key input (optional)
8. Execution summary + confirmation.
9. Sequential per-platform apply (stop on first failure).

## Decision Mapping to Install Engine

`cbx init` maps wizard selections to the existing install path (`workflows install`) using shared internals.

Core mappings:
- Bundle -> `bundle`
- Platform -> `platform`
- Skills profile -> `skillProfile` / `allSkills`
- Runtime selection -> `mcpRuntime` + `mcpBuildLocal`
- Postman selected -> `postman=true`
- Stitch selected -> `stitch=true`
- Cubis Foundry selected -> `foundryMcp=true`
- Playwright selected -> `playwright=true`
- Postman mode -> `postmanMode`
- Postman workspace selection -> `postmanWorkspaceId`

Special handling:
- Legacy `--skills-scope`, `--scope`, and `--mcp-scope` values are accepted for compatibility, but `cbx init` coerces them to workspace-oriented behavior.
- Stitch-only is supported.
- Postman and Stitch always route through the Cubis Foundry MCP gateway even if `cubis-foundry` was not manually selected in the MCP picker.
- Multi-platform mode is sequential and aborts on first platform failure.

## Credential Persistence Behavior

When API keys are entered in wizard prompts:
- Values are set in-process for default aliases:
  - `POSTMAN_API_KEY_DEFAULT`
  - `STITCH_API_KEY_DEFAULT`
- The selected values are persisted with CBX-managed storage:
  - `~/.cbx/credentials.env` (mode `600`)

`cbx init` does not persist raw keys into:

- `<workspace>/cbx_config.json`
- `~/.cbx/cbx_config.json`
- generated `.cbx/mcp/*` artifacts
- platform runtime config files such as `.vscode/mcp.json`, `.mcp.json`, `.gemini/settings.json`, `~/.copilot/mcp-config.json`, or `~/.codex/config.toml`

No shell profile (`~/.zshrc`, `~/.bashrc`, PowerShell profile) is modified.

## MCP Platform Support Matrix

- `Cubis Foundry`:
  - Supported on all target platforms.
  - Registers the client-facing Foundry MCP gateway entry.

- `Postman`:
  - Supported on all target platforms.
  - Uses platform-specific Foundry MCP runtime target patching and Postman passthrough tools.

- `Stitch`:
  - Supported on all target platforms.
  - Uses platform-specific Foundry MCP runtime target patching and Stitch passthrough tools.

- `Playwright`:
  - Supported on all target platforms.
  - Patches `PlaywrightMCP` into the platform runtime target without Postman credential requirements.
