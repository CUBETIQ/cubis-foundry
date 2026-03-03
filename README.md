# @cubis/foundry

Workflow-first installer for multi-platform AI agent environments.

Last updated: 2026-02-27.

`cbx` installs workflows, skills, wrappers, and rule files for:
- Codex
- Antigravity (Gemini)
- GitHub Copilot

Skill install default is profile-based:
- default profile: `core`
- add `--skill-profile web-backend` for broader web/backend stack
- add `--all-skills` for full workflow + MCP catalog install

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
- Codex callable wrapper skills ($workflow-*, $agent-*)
- Platform rule files (`AGENTS.md`, `GEMINI.md`, etc.)
- Engineering artifacts in workspace (`ENGINEERING_RULES.md`, `TECH.md`)
- Managed MCP config for Postman and Stitch

## Install

```bash
npm install -g @cubis/foundry
```

Recommended environment setup:

```bash
export POSTMAN_API_KEY_DEFAULT="<your-postman-api-key>"
export STITCH_API_KEY_DEFAULT="<your-stitch-api-key>" # Antigravity StitchMCP only
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
        "apiKeyEnvVar": "POSTMAN_API_KEY_DEFAULT",
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
        "apiKeyEnvVar": "STITCH_API_KEY_DEFAULT"
      }
    ],
    "activeProfileName": "default",
    "mcpUrl": "https://stitch.googleapis.com/mcp"
  },
  "mcp": {
    "runtime": "docker",
    "fallback": "local",
    "docker": {
      "image": "ghcr.io/cubetiq/foundry-mcp:<package-version>",
      "updatePolicy": "pinned"
    },
    "catalog": {
      "toolSync": true
    }
  }
}
```

Inline keys are no longer allowed. Use env-var aliases only.

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

# Migrate legacy inline keys to env aliases
cbx workflows config keys migrate-inline --scope global --redact

# Doctor check for inline keys / unsafe headers
cbx workflows config keys doctor --scope global
```

Alias commands are also available:
- `cbx skills config keys ...`

## Postman and Stitch Setup Flows

### Interactive Postman workspace selection

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --postman
```

If active Postman env var (for example `POSTMAN_API_KEY_DEFAULT`) is available and `--yes` is not used, installer can show workspace chooser and save selected `workspaceId` in active Postman profile.

`--postman` now installs side-by-side MCP topology by default:
- direct Postman MCP server (`postman`)
- direct Stitch MCP server where applicable (`StitchMCP` for Antigravity)
- local Foundry MCP command server (`cubis-foundry` via `cbx mcp serve --transport stdio --scope auto`)

To opt out of Foundry MCP registration during install:

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --postman --no-foundry-mcp
```

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
      "X-Goog-Api-Key: ${STITCH_API_KEY_DEFAULT}"
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
- Foundry side-by-side server id: `cubis-foundry` (command: `cbx mcp serve --transport stdio --scope auto`)

Antigravity:
- Global runtime target: `~/.gemini/settings.json` (`mcpServers`)
- Project runtime target: `<workspace>/.gemini/settings.json` (`mcpServers`)
- Foundry side-by-side server id: `cubis-foundry` (command template)

Copilot:
- Global runtime target: `~/.copilot/mcp-config.json` (`servers`)
- Project runtime target: `<workspace>/.vscode/mcp.json` (`servers`)
- Foundry side-by-side server id: `cubis-foundry` (stdio command server)

## Command Reference

### Install / Remove / Doctor / Rule Sync

```bash
cbx workflows install --platform <codex|antigravity|copilot> --bundle agent-environment-setup
cbx workflows remove <bundle-or-workflow> --platform <platform>
cbx workflows prune-skills --platform <platform> --scope <project|global> --skill-profile <core|web-backend|full> [--include-mcp] [--dry-run]
cbx workflows doctor --platform <platform> --scope <project|global>
cbx workflows sync-rules --platform <platform> --scope <project|global>
```

MCP runtime flags (install):

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --postman \
  --mcp-runtime docker \
  --mcp-fallback local \
  --mcp-image ghcr.io/cubetiq/foundry-mcp:<package-version> \
  --mcp-update-policy pinned \
  --mcp-build-local   # optional: build image locally instead of docker pull
```

When `--mcp-runtime docker` is selected and Docker is available, install now prepares the image automatically:
- Pulls the image by default (`docker pull`)
- Or builds locally when `--mcp-build-local` is set

MCP tool catalog commands:

```bash
cbx mcp tools sync --service all --scope global
cbx mcp tools list --service postman --scope global
cbx mcp tools list --service stitch --scope global
```

Notes:
- `cbx mcp tools sync` requires `POSTMAN_API_KEY_DEFAULT`.
- For `--service stitch` or `--service all`, it also requires `STITCH_API_KEY_DEFAULT`.

Foundry local serve command (canonical entrypoint for MCP client registration):

```bash
# stdio (default)
cbx mcp serve --transport stdio --scope auto

# http for local smoke/debug
cbx mcp serve --transport http --scope auto --host 127.0.0.1 --port 3100

# verify vault only
cbx mcp serve --scan-only
```

MCP Docker runtime commands:

```bash
# Inspect runtime/container state
cbx mcp runtime status --scope global --name cbx-mcp

# Start runtime container (pull/build image first as needed)
cbx mcp runtime up --scope global --name cbx-mcp --port 3310 --fallback local

# Recreate existing container
cbx mcp runtime up --scope global --name cbx-mcp --replace --fallback local

# Stop/remove runtime container
cbx mcp runtime down --name cbx-mcp
```

Docker E2E MCP check (single command):

```bash
npm run test:mcp:docker
```

If port `3310` is already in use (for example by an existing `cbx-mcp` runtime), use a different port:

```bash
CBX_MCP_PORT=3999 npm run test:mcp:docker
```

Optional strict key mode:

```bash
CBX_MCP_REQUIRE_KEYS=1 npm run test:mcp:docker
```

Context budget reporting (from MCP skill tools):

- Skill tools now include `structuredContent.metrics` with deterministic estimates.
- Metrics include:
  - `fullCatalogEstimatedTokens`
  - `responseEstimatedTokens`
  - `selectedSkillsEstimatedTokens` or `loadedSkillEstimatedTokens`
  - `estimatedSavingsVsFullCatalog`
  - `estimatedSavingsVsFullCatalogPercent`
- New rollup tool: `skill_budget_report` for consolidated Skill Log + Context Budget.
- All token values are estimates using `ceil(char_count / charsPerToken)` (default `charsPerToken=4`), not provider billing tokens.

Install profile flags:

```bash
# default core profile (workflow skills only)
cbx workflows install --platform codex --bundle agent-environment-setup

# expanded workflow profile
cbx workflows install --platform codex --bundle agent-environment-setup --skill-profile web-backend

# include MCP catalog with profile
cbx workflows install --platform codex --bundle agent-environment-setup --skill-profile web-backend --include-mcp

# full workflow + MCP catalogs
cbx workflows install --platform codex --bundle agent-environment-setup --all-skills
```

### Config commands

```bash
# Show config (+ computed status block)
cbx workflows config --scope global --show

# Edit active Postman workspace ID
cbx workflows config --scope global --edit
cbx workflows config --scope global --workspace-id "<workspace-id>"
cbx workflows config --scope global --clear-workspace-id

# Switch MCP runtime preference quickly
cbx workflows config --scope project --mcp-runtime local
cbx workflows config --scope project --mcp-runtime docker --mcp-fallback local
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
cbx rules tech-md --overwrite --compact
```

### Legacy alias

`cbx skills ...` remains as a compatibility alias for `cbx workflows ...`.

## Troubleshooting

### `MCP startup failed: Environment variable POSTMAN_API_KEY_* ... is not set`

Cause:
- Active profile uses env alias but variable is not exported in current shell/process.

Fix:
```bash
export POSTMAN_API_KEY_DEFAULT="<key>"
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

### Docker runtime starts but skill discovery is zero

Cause:
- Runtime container has no skill mount at `/workflows/skills`.

Fix:
```bash
# Ensure host skill vault exists
ls ~/.agents/skills

# Recreate runtime
cbx mcp runtime up --scope global --name cbx-mcp --replace

# Check mount hint
cbx mcp runtime status --scope global --name cbx-mcp
```

If `~/.agents/skills` is missing, runtime still starts but will warn and skill discovery may return zero.

### Docker vs stdio behavior

- `cbx mcp runtime up` runs HTTP transport in Docker for shared local endpoint (`http://127.0.0.1:<port>/mcp`).
- `cbx mcp serve --transport stdio` runs local stdio transport for command-based MCP clients.
- Prefer stdio command server entries (`cubis-foundry`) for direct client integrations; use Docker runtime for explicit HTTP endpoint use cases.

### Docker endpoint resets at `127.0.0.1:<port>/mcp`

If Docker runtime starts but MCP endpoint is unreachable:

```bash
# Check health and hints
cbx mcp runtime status --scope project --name cbx-mcp

# Switch this project to local runtime
cbx workflows config --scope project --mcp-runtime local

# Use direct local server path
cbx mcp serve --transport stdio --scope auto
```

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
