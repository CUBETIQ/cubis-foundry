# @cubis/foundry

Workflow-first installer for multi-platform AI agent environments.

Last updated: 2026-03-04.

`cbx` installs workflows, skills, wrappers, and rule files for:

- Codex
- Antigravity (Gemini)
- Gemini CLI
- GitHub Copilot
- Claude Code

Official install targets: `codex`, `antigravity`, `copilot`, `claude`, `gemini`.

Skill install default is profile-based:

- default profile: `full`
- add `--skill-profile web-backend` for broader web/backend stack
- add `--all-skills` for full workflow + MCP catalog install

## Table of Contents

- [What This CLI Manages](#what-this-cli-manages)
- [Install](#install)
- [Guided Init Wizard (`cbx init`)](#guided-init-wizard-cbx-init)
- [Quickstarts](#quickstarts)
- [Scope Model (Global vs Project)](#scope-model-global-vs-project)
- [Credential Model (Metadata + Machine Vault)](#credential-model-metadata--machine-vault)
- [MCP Setup Flows](#mcp-setup-flows)
- [MCP Placement Matrix](#mcp-placement-matrix)
- [Command Reference](#command-reference)
- [Full Cleanup (`cbx remove all`)](#full-cleanup-cbx-remove-all)
- [Troubleshooting](#troubleshooting)
- [Migration Notes](#migration-notes)
- [Platform Docs](#platform-docs)

## What This CLI Manages

- Workflow files (`/plan`, `/create`, etc.)
- Skill folders
- Codex callable wrapper skills ($workflow-_, $agent-_)
- Platform rule files (`AGENTS.md`, `GEMINI.md`, etc.)
- Engineering artifacts in workspace (`ENGINEERING_RULES.md`, `TECH.md`)
- Managed MCP config for Postman, Stitch, and Playwright

Generated rule files are intentionally route-first and lazy about skill loading:

- inspect locally first
- route through native workflows or agents first
- execute directly for simple tasks
- load skills only when the user names one or the domain is still unclear

Source of truth inside this repo:

- `workflows/skills/<id>` is the canonical source for skill packages.
- `workflows/workflows/agent-environment-setup/shared/{agents,workflows}` is the canonical source for custom agents and workflows.
- `workflows/workflows/agent-environment-setup/platforms/*` contains generated platform adapters and mirrors, not the authoring source.
- Active generated skill mirrors are maintained for `codex`, `antigravity`, `copilot`, `claude`, and `gemini`.
- Any leftover `cursor` or `windsurf` folders under `platforms/*` should be treated as legacy artifacts, not active CLI targets.

Recommended edit and verification loop:

- Edit canonical files under `workflows/skills/*` and `workflows/workflows/agent-environment-setup/shared/*` only.
- Regenerate all platform mirrors and managed files with `npm run generate:all`.
- Verify generated mirrors, rules, manifest, attributes, and smoke coverage with `npm run test:ci`.

## Install

```bash
npm install -g @cubis/foundry
```

Recommended environment setup:

```bash
export POSTMAN_API_KEY_DEFAULT="<your-postman-api-key>"
export STITCH_API_KEY_DEFAULT="<your-stitch-api-key>"
cbx workflows config keys persist-env --service all --scope global
```

## Guided Init Wizard (`cbx init`)

`cbx init` is the interactive guided installer for first-time setup and multi-platform onboarding.

```bash
cbx init
```

Wizard flow:

- Welcome screen (Cubis Foundry banner + version)
- Bundle selection
- Multi-platform selection (`codex`, `antigravity`, `copilot`, `claude`, `gemini`)
- Skills profile selection (`core`, `web-backend`, `full`)
- MCP selection (`Cubis Foundry`, `Postman`, `Stitch`, `Playwright`)
- Workspace-oriented install defaults (legacy `--skills-scope` / `--mcp-scope` flags are accepted for compatibility)
- MCP runtime selection (`cbx mcp serve` local, Docker pull, Docker local build) when any MCP integration is enabled
- Conditional Postman mode/key/workspace and Stitch key prompts
- Final summary + confirmation

Non-interactive default mode:

```bash
cbx init --yes --dry-run --no-banner
```

Non-interactive scripted selection:

```bash
cbx init \
  --yes \
  --dry-run \
  --overwrite \
  --no-banner \
  --bundle agent-environment-setup \
  --platforms codex,antigravity,gemini \
  --skill-profile web-backend \
  --mcps cubis-foundry,postman,stitch,playwright \
  --postman-mode minimal \
  --postman-workspace-id null \
  --mcp-runtime local
```

`cbx workflows install` remains the canonical explicit/scriptable installer.  
Use `cbx init` when you want step-by-step guided setup.

Detailed wizard behavior and platform matrix:

- `docs/cli-init-wizard.md`

## Quickstarts

### Codex (recommended baseline)

```bash
cbx workflows install --platform codex --scope global --bundle agent-environment-setup --postman --postman-mode full
```

Important:

- Do not use `--yes` if you want interactive Postman workspace selection.
- Interactive install can fetch your Postman workspaces and save the selected workspace as the active profile `workspaceId`.

### Antigravity

```bash
cbx workflows install --platform antigravity --scope global --bundle agent-environment-setup --postman --postman-mode full
```

Postman and Stitch both route through the Cubis Foundry MCP gateway on this platform as well.

### Copilot

```bash
cbx workflows install --platform copilot --scope global --bundle agent-environment-setup --postman --postman-mode full
```

### Claude

```bash
cbx workflows install --platform claude --scope global --bundle agent-environment-setup --postman --postman-mode full
```

### Gemini CLI

```bash
cbx workflows install --platform gemini --scope global --bundle agent-environment-setup --postman --postman-mode full
```

## Scope Model (Global vs Project)

`cbx workflows install` defaults to `project`.

Behavior:

- `--scope global` is accepted for compatibility on install, but workflow and rule placement is normalized to workspace-oriented behavior.
- `cbx workflows config`, `cbx mcp`, and credential/profile commands still support explicit global scope where applicable.
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

Gemini CLI:

- Global skills: `~/.gemini/skills`
- Project workflows: `<workspace>/.gemini/workflows`
- Project commands: `<workspace>/.gemini/commands`
- Project rules: `<workspace>/.gemini/GEMINI.md`
- Global rules: `~/.gemini/GEMINI.md`

## Credential Model (Metadata + Machine Vault)

Secrets are now machine-scoped only.

- `cbx_config.json` stores non-secret metadata such as active profile name, env-var alias, Postman workspace id, MCP URL, and runtime preferences.
- `~/.cbx/credentials.env` stores the actual Postman/Stitch API key values managed by the CLI.
- Generated runtime configs must never contain raw Postman bearer tokens or raw Stitch `X-Goog-Api-Key` values.

Paths:

- Global metadata: `~/.cbx/cbx_config.json`
- Project metadata: `<workspace>/cbx_config.json`
- Machine credential vault: `~/.cbx/credentials.env`

### Profile schema

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
    "mcpUrl": "https://mcp.postman.com/mcp"
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
    "server": "cubis-foundry",
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

Inline keys are rejected on new writes and scrubbed during migration.

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

# Persist selected env values into ~/.cbx/credentials.env (mode 600)
cbx workflows config keys persist-env --service all --scope global
```

Alias commands are also available:

- None. Use canonical `cbx workflows config keys ...` commands only.

## MCP Setup Flows

### Interactive Postman workspace selection

```bash
cbx workflows install --platform codex --scope global --bundle agent-environment-setup --postman --postman-mode full
```

If active Postman env var (for example `POSTMAN_API_KEY_DEFAULT`) is available and `--yes` is not used, installer can show workspace chooser and save selected `workspaceId` in active Postman profile.

`--postman` and `--stitch` now install gateway-backed MCP topology by default:

- register `cubis-foundry` as the client-facing MCP server for the selected platform
- expose `postman.*`, `stitch.*`, and status/catalog passthrough tools through that gateway
- remove legacy direct Postman/Stitch MCP entries and generated `.cbx/mcp/*/{postman,stitch}.json` artifacts when present

`--postman` still installs the `postman` skill. `--stitch` now installs the canonical `stitch` skill. Managed platform rules route through those skills first when the prompt clearly targets those domains.

- `postman.*` and `stitch.*` execution should happen through Foundry passthrough tools, not direct standalone client wiring
- `cbx workflows config keys doctor` scans `cbx_config.json`, generated artifacts, and client runtime configs for leaked inline credentials
- `cbx workflows config keys migrate-inline` scrubs leaked inline keys, rewrites profiles to env aliases, and reapplies secure Foundry MCP wiring

Quota-safe execution facts:

- Postman API rate limits are separate from monitor usage limits
- monitor usage is plan/billing usage and is consumed by request count, region count, and auth requests
- monitor runtime caps are separate from monitor quota and do not imply quota is still available

### Manual workspace ID

```bash
cbx workflows install --platform codex --scope global --bundle agent-environment-setup --postman --postman-mode full --postman-workspace-id "<workspace-id>" --yes
```

Clear workspace ID:

```bash
cbx workflows install --platform codex --scope global --bundle agent-environment-setup --postman --postman-mode full --postman-workspace-id null --yes
```

If config already exists and you want to overwrite saved values:

```bash
cbx workflows install --platform codex --scope global --bundle agent-environment-setup --postman --postman-mode full --overwrite --yes
```

### Stitch on All Platforms

Stitch is supported on all active Foundry platforms: `codex`, `claude`, `copilot`, `gemini`, and `antigravity`.

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --stitch --yes
cbx workflows install --platform claude --bundle agent-environment-setup --stitch --yes
cbx workflows install --platform copilot --bundle agent-environment-setup --stitch --yes
cbx workflows install --platform gemini --bundle agent-environment-setup --stitch --yes
cbx workflows install --platform antigravity --bundle agent-environment-setup --stitch --yes
```

The selected client receives `cubis-foundry` MCP wiring, and Stitch access flows through the Foundry gateway plus the `stitch` skill. See `docs/stitch_mcp.md` for the platform details and workflow guidance.

### Playwright

`--playwright` patches a `PlaywrightMCP` entry into the selected platform runtime target without requiring Postman credentials or a generated Postman MCP definition file.

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --playwright
```

Default managed URL:

```text
http://localhost:8931/mcp
```

Playwright MCP patching is supported for Codex, Antigravity, Gemini CLI, Copilot, and Claude runtime targets.

## MCP Placement Matrix

Runtime target patching:

Codex:

- Global MCP runtime target: `~/.codex/config.toml` (via `codex mcp add/remove`)
- Project MCP runtime target: `<workspace>/.vscode/mcp.json`
- Foundry gateway server id: `cubis-foundry` (command: `cbx mcp serve --transport stdio --scope <global|project>`)
  - Install now pins scope explicitly (`global` or `project`) in this command.
  - When MCP runtime is set to `docker`, install points `cubis-foundry` at the local Docker endpoint (`http://127.0.0.1:3310/mcp`) instead of the stdio command.

Antigravity:

- Global runtime target: `~/.gemini/settings.json` (`mcpServers`)
- Project runtime target: `<workspace>/.gemini/settings.json` (`mcpServers`)
- Foundry gateway server id: `cubis-foundry` (command template)
  - Install now pins scope explicitly (`global` or `project`) in this command.

Copilot:

- Global runtime target: `~/.copilot/mcp-config.json` (`servers`)
- Project runtime target: `<workspace>/.vscode/mcp.json` (`servers`)
- Foundry gateway server id: `cubis-foundry` (stdio command server)
  - Install now pins scope explicitly (`global` or `project`) in this command.

Claude:

- Global runtime target: `~/.claude/mcp.json` (`mcpServers`)
- Project runtime target: `<workspace>/.mcp.json` (`mcpServers`)
- Foundry gateway server id: `cubis-foundry`

Gemini CLI:

- Global runtime target: `~/.gemini/settings.json` (`mcpServers`)
- Project runtime target: `<workspace>/.gemini/settings.json` (`mcpServers`)
- Foundry gateway server id: `cubis-foundry`

Legacy direct Postman/Stitch definitions under `.cbx/mcp/<platform>/` are cleanup targets only and are no longer the default install model.

## Command Reference

### Install / Remove / Doctor / Rule Sync

```bash
cbx workflows install --platform <codex|antigravity|copilot|claude|gemini> --bundle agent-environment-setup
cbx workflows remove <bundle-or-workflow> --platform <platform>
cbx workflows remove-all --scope <project|global|all> --platform <platform|all>
cbx workflows prune-skills --platform <platform> --scope <project|global> --skill-profile <core|web-backend|full> [--dry-run]
cbx workflows doctor --platform <platform> --scope <project|global>
cbx workflows sync-rules --platform <platform> --scope <project|global>
```

MCP runtime flags (install):

```bash
cbx workflows install --platform codex --bundle agent-environment-setup --postman \
  --postman-mode full \
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

MCP manifest + managed rules block maintenance:

```bash
# Generate/refresh MCP manifest snapshot
npm run generate:mcp-manifest

# Validate MCP skill catalog + rule references
npm run validate:mcp-skills
npm run validate:mcp-manifest

# Inject/check managed MCP block in platform rule files
npm run inject:mcp-rules:all
npm run check:mcp-rules:all
```

Generated MCP artifacts:

- `mcp/generated/mcp-manifest.json` (catalog snapshot used by managed rule blocks)
- `mcp/generated/README.md` (artifact notes)

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

# Force an explicit skill vault mount source
cbx mcp runtime up --scope global --name cbx-mcp --replace --skills-root ~/.agents/skills

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

Use host skill vault instead of the script's isolated sample vault:

```bash
CBX_MCP_USE_HOST_SKILLS=1 npm run test:mcp:docker
# or an explicit path
CBX_MCP_USE_HOST_SKILLS=1 CBX_MCP_HOST_SKILLS_DIR="$PWD/.agents/skills" npm run test:mcp:docker
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
- Docker smoke now prints token estimate lines (`token.full_catalog`, `token.selected`, `token.loaded`, `token.savings`, etc.) for quick visibility.
- All token values are estimates using `ceil(char_count / charsPerToken)` (default `charsPerToken=4`), not provider billing tokens.

Install profile flags:

```bash
# default full profile
cbx workflows install --platform codex --bundle agent-environment-setup

# expanded workflow profile
cbx workflows install --platform codex --bundle agent-environment-setup --skill-profile web-backend

# explicit full profile
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

# Set Postman MCP mode without jq edits (also patches MCP artifacts/targets)
cbx workflows config --scope global --platform codex --postman-mode full

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

### Removed aliases

The following aliases were removed:

- `cbx skills ...`
- `cbx install`
- `cbx platforms`
- `cbx workflows init`

Use these canonical replacements:

- `cbx init` (guided interactive installer)
- `cbx workflows ...`
- `cbx workflows install`
- `cbx workflows platforms`

## Full Cleanup (`cbx remove all`)

Use this when you want to remove all CBX-managed generated artifacts in one step.

```bash
# Preview
cbx remove all --scope all --platform all --dry-run

# Apply
cbx remove all --scope all --platform all --yes
```

Equivalent workflow command:

```bash
cbx workflows remove-all --scope all --platform all --yes
```

What it removes (by scope/platform selection):

- Generated workflows/agents/skills wrappers.
- Managed rule blocks and generated engineering docs (`AGENTS.md`, `ENGINEERING_RULES.md`, `TECH.md`) where applicable.
- Managed runtime target entries plus any legacy direct Postman/Stitch MCP definition files.
- Project/global `.cbx` metadata artifacts created by installer flows.
- Optional global credentials file (`~/.cbx/credentials.env`) when `--include-credentials` is provided.

To keep generated artifacts out of git in app repositories, add these ignore entries:

```gitignore
.cbx/
.agent/
.agents/
.github/agents/
.github/skills/
.github/prompts/
.github/copilot/
AGENTS.md
ENGINEERING_RULES.md
TECH.md
```

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

### `Stitch or Postman key leaked into cbx_config.json or client config`

Use the credential doctor and migration flow:

```bash
cbx workflows config keys doctor --scope project
cbx workflows config keys migrate-inline --scope project
```

This scans `cbx_config.json`, generated `.cbx/mcp` artifacts, `.vscode/mcp.json`, `.mcp.json`, `.gemini/settings.json`, `~/.copilot/mcp-config.json`, and `~/.codex/config.toml`, then scrubs inline keys and reapplies secure Foundry MCP wiring.

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

# Force mount from an explicit path
cbx mcp runtime up --scope global --name cbx-mcp --replace --skills-root ~/.agents/skills
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

- `cbx_config.json` is now metadata-only for Postman/Stitch; persisted secrets belong in `~/.cbx/credentials.env`.
- Multi-profile key model added (`profiles[]` + `activeProfileName`).
- `config keys` commands added (`list/add/use/remove`).
- `config keys doctor`, `migrate-inline`, and `persist-env` now enforce secure credential storage and cleanup.
- `config --show` now reports stored vs effective auth source.
- Postman and Stitch client wiring now default to Cubis Foundry MCP gateway registration on every supported platform.
- Install now defaults to indexed top-level all-skill install.
- Nested duplicate skill directories are auto-cleaned during install.
- Legacy aliases were removed (`skills`, root `install/init/platforms`, `workflows init`).
- CLI runtime migrated to TypeScript source under `src/cli` with compiled output under `dist/cli`.
- `ENGINEERING_RULES.md` now auto-refreshes generated/legacy templates on `cbx rules init` without requiring `--overwrite`.
- Managed engineering guardrail block now includes full absolute file paths and a Decision Log response contract.

### Suggested refresh

```bash
npm install -g @cubis/foundry
cbx workflows install --platform codex --bundle agent-environment-setup --overwrite --yes
cbx workflows config --scope global --show
```

## Platform Docs

- Postman API keys: <https://learning.postman.com/docs/developer/postman-api/authentication/>
- Postman MCP setup: <https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/set-up-postman-mcp-server>
- Stitch MCP upstream: <https://github.com/davideast/stitch-mcp>
- Codex MCP docs: <https://developers.openai.com/codex/mcp/>
- Claude Code MCP docs: <https://docs.anthropic.com/en/docs/claude-code/mcp>
- Gemini CLI MCP docs: <https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md>
- VS Code / Copilot MCP docs: <https://code.visualstudio.com/docs/copilot/chat/mcp-servers>
- Google Stitch MCP: <https://developers.google.com/stitch>
