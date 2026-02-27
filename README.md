# @cubis/foundry

Workflow-first installer for multi-platform AI agent environments.

Last updated: 2026-02-27.

`cbx` installs workflows, skills, wrappers, and rule files for:
- Codex
- Antigravity (Gemini)
- GitHub Copilot

## Table of Contents

- [What This CLI Manages](#what-this-cli-manages)
- [Install](#install)
- [Quickstarts](#quickstarts)
- [Scope Model (Global vs Project)](#scope-model-global-vs-project)
- [Credential Model (`cbx_config.json` only)](#credential-model-cbx_configjson-only)
- [Postman and Stitch Setup Flows](#postman-and-stitch-setup-flows)
- [MCP Placement Matrix](#mcp-placement-matrix)
- [Command Reference](#command-reference)
- [Troubleshooting](#troubleshooting)
- [Migration Notes](#migration-notes)
- [Platform Docs](#platform-docs)

## What This CLI Manages

- Workflow files (`/plan`, `/create`, etc.)
- Skill folders
- Codex callable wrapper skills (`$workflow-*`, `$agent-*`)
- Platform rule files (`AGENTS.md`, `GEMINI.md`, etc.)
- Engineering artifacts in workspace (`ENGINEERING_RULES.md`, `TECH.md`)
- Managed MCP config for Postman and Stitch

## Install

```bash
npm install -g @cubis/foundry
```

Recommended environment setup:

```bash
export POSTMAN_API_KEY="<your-postman-api-key>"
export STITCH_API_KEY="<your-stitch-api-key>" # Antigravity StitchMCP only
```

## Quickstarts

### Codex (recommended baseline)

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --postman
```

Important:
- Do not use `--yes` if you want interactive Postman workspace selection.
- Interactive install can fetch your Postman workspaces and save the selected workspace as the active profile `workspaceId`.

### Antigravity

```bash
cbx workflows install --platform antigravity --bundle agent-environment-setup --postman
```

This also manages default `StitchMCP` wiring for Antigravity.

### Copilot

```bash
cbx workflows install --platform copilot --bundle agent-environment-setup --postman
```

## Scope Model (Global vs Project)

Default install scope is `global`.

Behavior:
- Skills are installed in global platform skill directories.
- Workflows and agents are installed in project paths for active workspace behavior.
- Rule files remain workspace-oriented for current repo context.
- Engineering files (`ENGINEERING_RULES.md`, `TECH.md`) are workspace files.

### Where files go

Codex:
- Global skills: `~/.agents/skills`
- Project workflows: `<workspace>/.agents/workflows`
- Project rules: `<workspace>/AGENTS.md`
- Global rules: `~/.codex/AGENTS.md`

Antigravity:
- Global skills: `~/.gemini/antigravity/skills`
- Project workflows: `<workspace>/.agent/workflows`
- Project rules: `<workspace>/.agent/rules/GEMINI.md`
- Global rules: `~/.gemini/GEMINI.md`

Copilot:
- Global skills: `~/.copilot/skills`
- Project workflows: `<workspace>/.github/copilot/workflows`
- Project rules: `<workspace>/AGENTS.md` and `<workspace>/.github/copilot-instructions.md`
- Global rules: `~/.copilot/copilot-instructions.md`

## Credential Model (`cbx_config.json` only)

`cbx_config.json` is the single supported credentials/config source.

Paths:
- Global: `~/.cbx/cbx_config.json`
- Project: `<workspace>/cbx_config.json`

### Profile schema

Postman and Stitch now support multiple named profiles with active selection.

```json
{
  "postman": {
    "profiles": [
      {
        "name": "default",
        "apiKey": null,
        "apiKeyEnvVar": "POSTMAN_API_KEY",
        "workspaceId": null
      }
    ],
    "activeProfileName": "default",
    "mcpUrl": "https://mcp.postman.com/minimal"
  },
  "stitch": {
    "profiles": [
      {
        "name": "default",
        "apiKey": null,
        "apiKeyEnvVar": "STITCH_API_KEY"
      }
    ],
    "activeProfileName": "default",
    "mcpUrl": "https://stitch.googleapis.com/mcp"
  }
}
```

Compatibility fields (`apiKey`, `apiKeyEnvVar`, `apiKeySource`, `defaultWorkspaceId`) are still mirrored for older consumers, but profile fields are authoritative.

### List/Add/Use/Remove profiles

```bash
# List profiles
cbx workflows config keys list --service all --scope global

# Add profile (env-alias-first)
cbx workflows config keys add --service postman --name team-a --env-var POSTMAN_API_KEY_TEAM_A --scope global
cbx workflows config keys add --service stitch --name prod --env-var STITCH_API_KEY_PROD --scope global

# Switch active profile
cbx workflows config keys use --service postman --name team-a --scope global

# Remove non-active profile
cbx workflows config keys remove --service postman --name old-profile --scope global
```

Alias commands are also available:
- `cbx skills config keys ...`

## Postman and Stitch Setup Flows

### Interactive Postman workspace selection

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --postman
```

If `POSTMAN_API_KEY` is available and `--yes` is not used, installer can show workspace chooser and save selected `workspaceId` in active Postman profile.

### Manual workspace ID

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --postman --postman-workspace-id "<workspace-id>" --yes
```

Clear workspace ID:

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --postman --postman-workspace-id null --yes
```

If config already exists and you want to overwrite saved values:

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --postman --overwrite --yes
```

### StitchMCP (Antigravity)

Antigravity includes managed Stitch MCP support using active Stitch profile from `cbx_config.json`.

Default managed command template:

```json
{
  "StitchMCP": {
    "$typeName": "exa.cascade_plugins_pb.CascadePluginCommandTemplate",
    "command": "npx",
    "args": [
      "-y",
      "mcp-remote",
      "https://stitch.googleapis.com/mcp",
      "--header",
      "X-Goog-Api-Key: ur stitch key"
    ],
    "env": {}
  }
}
```

## MCP Placement Matrix

Managed MCP definition files (`.cbx/mcp/...`):
- Global scope: `~/.cbx/mcp/<platform>/postman.json`
- Project scope: `<workspace>/.cbx/mcp/<platform>/postman.json`

Runtime target patching:

Codex:
- Global MCP runtime target: `~/.codex/config.toml` (via `codex mcp add/remove`)
- Project MCP runtime target: `<workspace>/.vscode/mcp.json`

Antigravity:
- Global runtime target: `~/.gemini/settings.json` (`mcpServers`)
- Project runtime target: `<workspace>/.gemini/settings.json` (`mcpServers`)

Copilot:
- Global runtime target: `~/.copilot/mcp-config.json` (`servers`)
- Project runtime target: `<workspace>/.vscode/mcp.json` (`servers`)

## Command Reference

### Install / Remove / Doctor / Rule Sync

```bash
cbx workflows install --platform <codex|antigravity|copilot> --bundle agent-environment-setup
cbx workflows remove <bundle-or-workflow> --platform <platform>
cbx workflows doctor --platform <platform> --scope <project|global>
cbx workflows sync-rules --platform <platform> --scope <project|global>
```

### Config commands

```bash
# Show config (+ computed status block)
cbx workflows config --scope global --show

# Edit active Postman workspace ID
cbx workflows config --scope global --edit
cbx workflows config --scope global --workspace-id "<workspace-id>"
cbx workflows config --scope global --clear-workspace-id
```

`--show` now includes computed `status`:
- stored source (from active profile config)
- effective source (resolved at runtime with env)
- active profile name
- effective env var alias

### Rules commands

```bash
cbx rules init --platform <platform> --scope project --overwrite
cbx rules tech-md --overwrite
```

### Legacy alias

`cbx skills ...` remains as a compatibility alias for `cbx workflows ...`.

## Troubleshooting

### `MCP startup failed: Environment variable POSTMAN_API_KEY ... is not set`

Cause:
- Active profile uses env alias but variable is not exported in current shell/process.

Fix:
```bash
export POSTMAN_API_KEY="<key>"
cbx workflows config --scope global --show
```

Then confirm `status.postman.effectiveSource` is `env`.

### `apiKeySource` looks unset even after export

Use:
```bash
cbx workflows config --scope global --show
```

Check these fields:
- `status.postman.storedSource`
- `status.postman.effectiveSource`
- `status.postman.effectiveEnvVar`

If stored source is env but effective source is unset, your env var alias is missing in the running process.

### Existing config skipped during install

If installer says config was skipped:
- Re-run with `--overwrite`, or
- Use `cbx workflows config` / `cbx workflows config keys ...` to mutate existing config.

### Duplicate skills shown in UI after older installs

Installer now auto-cleans nested duplicate skills (for example duplicates under `postman/*`).

Run refresh install:

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --overwrite --yes
```

### Legacy Postman config file exists without `cbx_config.json`

Behavior is now hard-fail. Create/repair `cbx_config.json` first:

```bash
cbx workflows config --scope global --clear-workspace-id
```

## Migration Notes

### Behavior changes in this release

- `cbx_config.json` is now the only supported config source for Postman/Stitch credentials.
- Multi-profile key model added (`profiles[]` + `activeProfileName`).
- `config keys` commands added (`list/add/use/remove`).
- `config --show` now reports stored vs effective auth source.
- Install now defaults to indexed top-level all-skill install.
- Nested duplicate skill directories are auto-cleaned during install.

### Suggested refresh

```bash
npm install -g @cubis/foundry
cbx workflows install --platform codex --bundle agent-environment-setup --overwrite --yes
cbx workflows config --scope global --show
```

## Platform Docs

- Postman API keys: <https://learning.postman.com/docs/developer/postman-api/authentication/>
- Postman MCP setup: <https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/set-up-postman-mcp-server>
- Google Stitch MCP: <https://developers.google.com/stitch>
