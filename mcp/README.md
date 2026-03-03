# Cubis Foundry MCP Server

Standalone MCP (Model Context Protocol) server for the Cubis Foundry skill vault, config tools, and dynamic Postman/Stitch passthrough tool namespaces.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Running the Server](#running-the-server)
7. [Tool Reference](#tool-reference)
8. [Token Savings](#token-savings)
9. [MCP Client Configuration](#mcp-client-configuration)
10. [Security](#security)
11. [Development](#development)

---

## Overview

This server exposes built-in tools plus dynamic passthrough tools discovered from upstream Postman/Stitch MCP servers:

| Domain      | Tools | Purpose                                                       |
| ----------- | ----- | ------------------------------------------------------------- |
| **Skills**               | 5        | Browse/search/get + budget reporting for skill definitions          |
| **Postman config**       | 3        | Read/write Postman MCP mode in `cbx_config.json`                   |
| **Stitch config**        | 3        | Read/write Stitch active profile in `cbx_config.json`              |
| **Postman passthrough**  | dynamic  | `postman.<tool_name>` for all discovered upstream Postman tools    |
| **Stitch passthrough**   | dynamic  | `stitch.<tool_name>` for all discovered upstream Stitch tools       |

The skill vault uses a **lazy content model**: startup only scans metadata (category/name/path). Full `SKILL.md` content is loaded on-demand via `skill_get` only.

## Architecture

```
mcp/
├── config.json           # Server configuration
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts           # CLI entry point
│   ├── server.ts          # McpServer factory + tool registration
│   ├── config/
│   │   ├── schema.ts      # Zod schema for config.json
│   │   └── index.ts       # Config loader
│   ├── transports/
│   │   ├── stdio.ts       # stdio transport adapter
│   │   └── streamableHttp.ts  # Streamable HTTP transport
│   ├── vault/
│   │   ├── types.ts       # SkillPointer, VaultManifest
│   │   ├── scanner.ts     # Startup metadata scanner
│   │   └── manifest.ts    # Description extraction, full read
│   ├── cbxConfig/
│   │   ├── types.ts       # CbxConfig, PostmanConfig, StitchConfig
│   │   ├── paths.ts       # Config path resolution
│   │   ├── reader.ts      # Read + merge configs
│   │   ├── serviceConfig.ts # Profile-array/object-map normalization
│   │   ├── writer.ts      # Atomic writes
│   │   └── index.ts       # Barrel export
│   ├── upstream/
│   │   └── passthrough.ts # Upstream discovery + tool call proxy
│   ├── tools/
│   │   ├── index.ts       # Tool registry
│   │   ├── skillListCategories.ts
│   │   ├── skillBrowseCategory.ts
│   │   ├── skillSearch.ts
│   │   ├── skillGet.ts
│   │   ├── skillBudgetReport.ts
│   │   ├── postmanModes.ts    # Mode ↔ URL mapping
│   │   ├── postmanGetMode.ts
│   │   ├── postmanSetMode.ts
│   │   ├── postmanGetStatus.ts
│   │   ├── stitchGetMode.ts
│   │   ├── stitchSetProfile.ts
│   │   ├── stitchGetStatus.ts
│   │   └── future/
│   │       ├── index.ts
│   │       └── README.md
│   ├── utils/
│       ├── logger.ts      # stderr-only logger
│       └── errors.ts      # MCP error helpers
│   └── telemetry/
│       └── tokenBudget.ts # Deterministic token estimator
```

## Prerequisites

- **Node.js** >= 18.17
- **npm** or compatible package manager

## Installation

```bash
cd mcp
npm install
```

To build for production:

```bash
npm run build
```

## Configuration

### Server Configuration (`config.json`)

Controls vault roots, transport defaults, and summary truncation:

```json
{
  "server": { "name": "cubis-foundry-mcp", "version": "0.1.0" },
  "vault": {
    "roots": ["../workflows/skills"],
    "summaryMaxLength": 200
  },
  "telemetry": {
    "charsPerToken": 4
  },
  "transport": {
    "default": "stdio",
    "http": { "port": 3100, "host": "127.0.0.1" }
  }
}
```

> **Security**: `config.json` must NEVER contain credential fields (`apiKey`, `secret`, `token`, `password`). The server rejects startup if any are detected.

### User Configuration (`cbx_config.json`)

Managed by `cbx workflows config`. Located at:

- **Global**: `~/.cbx/cbx_config.json`
- **Project**: `<workspace>/cbx_config.json`

When `scope` is omitted, tools use **auto** scope: project config if it exists, else global.

Credentials (API keys) are managed by `cbx` CLI, never by this server. The server never reads, logs, or returns `apiKey` values.

## Running the Server

```bash
# Development (stdio, with hot reload)
npm run dev

# Production (stdio)
npm start

# Streamable HTTP transport
node dist/index.js --transport http

# Scoped config defaults for built-in config tools
node dist/index.js --scope global

# HTTP host/port override
node dist/index.js --transport http --host 0.0.0.0 --port 3100

# Scan vault and exit (verify skill discovery)
npm run scan

# Inspect with MCP Inspector
npm run mcp:inspect

# Debug mode (verbose logging)
node dist/index.js --debug
```

From the root CLI, the canonical local entrypoint is:

```bash
cbx mcp serve --transport stdio --scope auto
cbx mcp serve --transport http --scope auto --host 127.0.0.1 --port 3100
cbx mcp serve --scan-only
```

### Startup Banner

On each startup the server prints fixed token savings metrics:

```
┌──────────────────────────────────────────────┐
│  Cubis Foundry MCP Server                    │
├──────────────────────────────────────────────┤
│  Vault: 2004/35/~245/~80,160/99.7%           │
│  Skills loaded: 35                            │
│  Categories: 12                               │
│  Transport: stdio                             │
└──────────────────────────────────────────────┘
```

Followed by Postman/Stitch config status (or a warning if `cbx_config.json` is missing).

## Tool Reference

### Skills Tools

All skill tools include `structuredContent.metrics` with deterministic estimated token/context budget fields.

#### `skill_list_categories`

List all skill categories in the vault.

**Input**: none

**Output**:

```json
{
  "categories": [
    { "category": "backend", "skillCount": 8 },
    { "category": "frontend", "skillCount": 5 }
  ],
  "totalSkills": 35
}
```

#### `skill_browse_category`

Browse skills within a category.

**Input**:

```json
{ "category": "backend" }
```

**Output**:

```json
{
  "category": "backend",
  "skills": [
    {
      "id": "nestjs-expert",
      "description": "NestJS application architecture..."
    },
    { "id": "fastapi-expert", "description": "FastAPI async Python APIs..." }
  ],
  "count": 8
}
```

#### `skill_search`

Search skills by keyword.

**Input**:

```json
{ "query": "flutter" }
```

**Output**:

```json
{
  "query": "flutter",
  "results": [
    {
      "id": "flutter-expert",
      "category": "mobile",
      "description": "Flutter app architecture..."
    }
  ],
  "count": 3
}
```

#### `skill_get`

Get the full SKILL.md content for a specific skill.

**Input**:

```json
{ "id": "nestjs-expert" }
```

**Output**: Full markdown content of the skill file (as `type: "text"` content block).
`structuredContent.metrics` includes `loadedSkillEstimatedTokens` and estimated savings vs full catalog.

#### `skill_budget_report`

Consolidated Skill Log + Context Budget report for selected/loaded skill IDs.

**Input**:

```json
{
  "selectedSkillIds": ["react-expert"],
  "loadedSkillIds": ["react-expert"]
}
```

**Output**:

```json
{
  "skillLog": {
    "selectedSkills": [{ "id": "react-expert", "category": "frontend", "estimatedTokens": 123 }],
    "loadedSkills": [{ "id": "react-expert", "category": "frontend", "estimatedTokens": 123 }],
    "skippedSkills": ["fastapi-expert"],
    "unknownSelectedSkillIds": [],
    "unknownLoadedSkillIds": []
  },
  "contextBudget": {
    "estimatorVersion": "char-estimator-v1",
    "charsPerToken": 4,
    "fullCatalogEstimatedTokens": 80160,
    "selectedSkillsEstimatedTokens": 123,
    "loadedSkillsEstimatedTokens": 123,
    "estimatedSavingsTokens": 80037,
    "estimatedSavingsPercent": 99.85,
    "estimated": true
  }
}
```

### Postman Tools

#### `postman_get_mode`

Get current Postman MCP mode.

**Input** (optional):

```json
{ "scope": "global" }
```

**Output**:

```json
{
  "mode": "code",
  "url": "https://mcp.postman.com/code",
  "scope": "global",
  "availableModes": ["minimal", "code", "full"]
}
```

#### `postman_set_mode`

Set Postman MCP mode.

**Input**:

```json
{ "mode": "full" }
```

**Output**:

```json
{
  "mode": "full",
  "url": "https://mcp.postman.com/mcp",
  "scope": "global",
  "writtenPath": "~/.cbx/cbx_config.json",
  "note": "Postman MCP mode updated. Restart your MCP client to pick up the change."
}
```

**Mode mapping**:

| Mode      | URL                               |
| --------- | --------------------------------- |
| `minimal` | `https://mcp.postman.com/minimal` |
| `code`    | `https://mcp.postman.com/code`    |
| `full`    | `https://mcp.postman.com/mcp`     |

#### `postman_get_status`

Full Postman configuration status.

**Input** (optional):

```json
{ "scope": "auto" }
```

**Output**:

```json
{
  "configured": true,
  "mode": "code",
  "url": "https://mcp.postman.com/code",
  "defaultWorkspaceId": null,
  "scope": "global",
  "configPath": "~/.cbx/cbx_config.json",
  "availableModes": ["minimal", "code", "full"]
}
```

### Stitch Tools

#### `stitch_get_mode`

Get active Stitch profile and URL.

**Input** (optional):

```json
{ "scope": "auto" }
```

**Output**:

```json
{
  "activeProfileName": "production",
  "activeUrl": "https://stitch.example.com/api",
  "availableProfiles": ["production", "staging"],
  "scope": "global",
  "note": "API keys are never exposed through this tool."
}
```

#### `stitch_set_profile`

Activate a Stitch profile.

**Input**:

```json
{ "profileName": "staging" }
```

**Output**:

```json
{
  "activeProfileName": "staging",
  "url": "https://stitch-staging.example.com/api",
  "scope": "global",
  "writtenPath": "~/.cbx/cbx_config.json",
  "note": "Stitch active profile updated. Restart your MCP client to pick up the change."
}
```

#### `stitch_get_status`

Full Stitch configuration status.

**Input** (optional):

```json
{ "scope": "auto" }
```

**Output**:

```json
{
  "configured": true,
  "activeProfileName": "production",
  "profiles": [
    {
      "name": "production",
      "url": "https://stitch.example.com/api",
      "apiKeyEnvVar": "STITCH_API_KEY_PROD",
      "hasInlineApiKey": false,
      "isActive": true
    },
    {
      "name": "staging",
      "url": "https://stitch-staging.example.com/api",
      "apiKeyEnvVar": "STITCH_API_KEY_STAGING",
      "hasInlineApiKey": false,
      "isActive": false
    }
  ],
  "totalProfiles": 2,
  "scope": "global",
  "configPath": "~/.cbx/cbx_config.json",
  "note": "API keys are never exposed. Env-var aliases are reported for runtime configuration."
}
```

### Dynamic Passthrough Tools

On startup, the server discovers upstream tools and registers namespaced passthrough tools:

- `postman.<tool_name>`
- `stitch.<tool_name>`

Examples:
- `postman.getAuthenticatedUser`
- `postman.getWorkspaces`
- `stitch.list_tools`
- `stitch.get_screen_code`

Discovered non-secret catalogs are persisted to:
- Global config: `~/.cbx/mcp/catalog/postman.json` and `~/.cbx/mcp/catalog/stitch.json`
- Project config: `<workspace>/.cbx/mcp/catalog/postman.json` and `<workspace>/.cbx/mcp/catalog/stitch.json`

## Token Savings

The vault's lazy content model dramatically reduces token usage:

| Metric                                                       | Value     |
| ------------------------------------------------------------ | --------- |
| Total skill tokens (all files)                               | ~80,160   |
| Skills in vault                                              | 35        |
| Average tokens per skill                                     | ~2,290    |
| Tokens for `skill_list_categories` + `skill_browse_category` | ~245      |
| Token savings vs loading all skills                          | **99.7%** |

**How it works**:

1. `skill_list_categories` returns only category names + counts (~20 tokens)
2. `skill_browse_category` returns skill IDs + truncated descriptions (~225 tokens)
3. `skill_get` loads one full skill on demand (~2,290 tokens)
4. Total for targeted retrieval: ~2,535 tokens vs ~80,160 for loading everything

**Fixed banner values**: `2004/35/~245/~80,160/99.7%`

All token values are deterministic estimates, not provider-native metering.
Estimator formula: `estimated_tokens = ceil(char_count / charsPerToken)` where `charsPerToken` defaults to `4`.

## MCP Client Configuration

### Codex / Antigravity

```json
{
  "mcpServers": {
    "cubis-foundry": {
      "command": "cbx",
      "args": ["mcp", "serve", "--transport", "stdio", "--scope", "auto"]
    }
  }
}
```

### VS Code / Copilot

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "cubis-foundry": {
      "type": "stdio",
      "command": "cbx",
      "args": ["mcp", "serve", "--transport", "stdio", "--scope", "auto"]
    }
  }
}
```

Side-by-side topology is supported: keep direct `postman`/`StitchMCP` entries and add `cubis-foundry`.

### Streamable HTTP (any client)

```json
{
  "mcpServers": {
    "cubis-foundry": {
      "url": "http://127.0.0.1:3100/mcp",
      "transport": "streamable-http"
    }
  }
}
```

Start the server with `--transport http` first.

## Security

- **Credentials managed by cbx, never by this server.** Env-var aliases are read from config, while secret values are resolved from process environment at runtime.
- `config.json` (server config) rejects any credential fields at startup.
- Stitch/Postman passthrough calls fail with actionable env-var errors when keys are missing.
- `redactConfig()` strips all credential fields before any logging.
- HTTP transport binds to `127.0.0.1` by default to prevent DNS rebinding attacks.
- All log output goes to stderr to keep stdio transport clean.

## Development

```bash
# Install dependencies
npm install

# Run in development mode (hot reload)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Inspect with MCP Inspector
npm run mcp:inspect
```

### Adding a New Tool

1. Create `src/tools/yourToolName.ts` with name, description, schema, and handler exports
2. Add exports to `src/tools/index.ts`
3. Register in `src/server.ts` with `server.tool()`
4. Add tests
5. Update this README

### Testing

Tests use Vitest with the Node.js environment. Coverage is collected via v8.

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npx vitest --coverage       # With coverage report
```
