# Cubis Foundry `cbx init` Wizard

## Purpose

`cbx init` provides a guided, interactive installation flow for Cubis Foundry.
It is intended for onboarding and manual setup sessions.

For explicit automation/scripting, use `cbx workflows install`.

## Command

```bash
cbx init [--yes] [--dry-run] [--target <path>] [--bundle <bundleId>] [--platforms <csv>] [--mcps <csv>] [--skill-profile <profile>] [--skills-scope <scope>] [--mcp-scope <scope>] [--postman-mode <mode>] [--postman-workspace-id <id|null>] [--mcp-runtime <docker|local>] [--mcp-build-local] [--no-banner] [--json]
```

Options:
- `--yes`: skip final confirmation and use defaults where prompts are skipped.
- `--dry-run`: preview all actions without writing files.
- `--target <path>`: run install logic against another project directory.
- `--bundle <bundleId>`: preselect bundle id (used as interactive default and non-interactive value).
- `--platforms <csv>`: comma-separated platforms (`codex,antigravity,copilot`).
- `--mcps <csv>`: comma-separated MCP integrations (`cubis-foundry,postman,stitch`).
- `--skill-profile <profile>`: `core`, `web-backend`, `full`.
- `--skills-scope <scope>`: `project` or `global`.
- `--mcp-scope <scope>`: `project` or `global`.
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
5. MCP multi-select (`Cubis Foundry`, `Postman`, `Stitch`).
6. Skills scope selection (`project` or `global`).
7. MCP scope selection (`project` or `global`).
8. MCP runtime selection (`local command server`, `docker pull`, `docker local build`) when Postman or Stitch is selected.
9. Conditional prompts:
   - Postman selected:
     - Postman mode (`full` or `minimal`)
     - secure Postman API key input (optional)
     - default Postman workspace selection:
       - interactive workspace list (when API key is available)
       - manual workspace id input fallback
   - Stitch selected:
     - secure Stitch API key input (optional)
10. Execution summary + confirmation.
11. Sequential per-platform apply (stop on first failure).

## Decision Mapping to Install Engine

`cbx init` maps wizard selections to the existing install path (`workflows install`) using shared internals.

Core mappings:
- Bundle -> `bundle`
- Platform -> `platform`
- Skills scope -> `scope`
- Skills profile -> `skillProfile` / `allSkills`
- MCP scope -> `mcpScope`
- Runtime selection -> `mcpRuntime` + `mcpBuildLocal`
- Postman selected -> `postman=true`
- Stitch selected -> `stitch=true`
- Cubis Foundry selected -> `foundryMcp=true`
- Postman mode -> `postmanMode`
- Postman workspace selection -> `postmanWorkspaceId`

Special handling:
- Stitch-only is supported.
- Stitch on unsupported platforms is skipped with warnings.
- Multi-platform mode is sequential and aborts on first platform failure.

## Credential Persistence Behavior

When API keys are entered in wizard prompts:
- Values are set in-process for default aliases:
  - `POSTMAN_API_KEY_DEFAULT`
  - `STITCH_API_KEY_DEFAULT`
- The selected aliases are persisted with CBX-managed storage:
  - `~/.cbx/credentials.env` (mode `600`)

No shell profile (`~/.zshrc`, `~/.bashrc`, PowerShell profile) is modified.

## MCP Platform Support Matrix

- `Cubis Foundry`:
  - Supported on all target platforms.
  - Registers side-by-side local Foundry MCP entry.

- `Postman`:
  - Supported on all target platforms.
  - Uses platform-specific MCP runtime target patching.

- `Stitch`:
  - Supported for Antigravity runtime integration.
  - Non-Antigravity selections are skipped with warnings.
