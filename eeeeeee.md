# Rebuild `mcp/` as MCP Server + Remove Legacy MCP Catalog Model

## Summary
Replace the current `/Users/phumrin/Documents/Cubis Foundry/mcp` tree entirely with a standalone TypeScript MCP server project that implements:
1. SkillPointer vault browsing tools
2. Postman mode switcher tools (config-only)
3. Stitch profile/mode switcher tools (config-only)

In the same task, perform full repo cleanup to remove the old `mcp/skills + mcp/catalogs + .mcp-vault + --include-mcp` model, including CLI flags and bundle skill IDs/files you selected for removal.

## Locked Decisions (from this planning session)
- Replace entire `/Users/phumrin/Documents/Cubis Foundry/mcp` (no backup).
- New project is a standalone package at `/Users/phumrin/Documents/Cubis Foundry/mcp`.
- Full repo cleanup is in scope now.
- `--include-mcp` and old `--all-skills` behavior are removed now.
- Remove these skill IDs from bundle and delete related skill/power files:
  - `building-mcp-server-on-cloudflare`
  - `datadog-automation`
  - `mcp-builder`
  - `mcp-developer`
  - `postman`
  - plus remove `mcp-catalog` artifacts.
- Boot log token numbers are fixed to the exact values you specified.
- Default scope behavior for Postman/Stitch tools when `scope` omitted:
  - project config if `<workspace>/cbx_config.json` exists, else global `~/.cbx/cbx_config.json`.
- README must include full Postman/Stitch tool-call reference examples.

## Implementation Plan

## 1) Replace `mcp/` with new standalone server package
- Delete old `mcp/` contents.
- Create package scaffolding in `/Users/phumrin/Documents/Cubis Foundry/mcp`:
  - `package.json`
  - `tsconfig.json`
  - `vitest.config.ts`
  - `config.json`
  - `README.md`
  - `src/**` per required architecture.
- Dependencies:
  - runtime: `@modelcontextprotocol/sdk`, `zod`, `jsonc-parser`
  - dev: `typescript`, `ts-node`, `tsup`, `vitest`, `nodemon`, `@types/node`
- Scripts (exactly as required):
  - `dev`, `build`, `start`, `test`, `scan`, `mcp:inspect`

## 2) Implement core server modules
- Entry/bootstrap:
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/index.ts`
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/server.ts`
- Transports:
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/transports/stdio.ts`
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/transports/sse.ts`
- Config loading:
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/config/schema.ts`
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/config/index.ts`
- Utilities:
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/utils/logger.ts`
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/utils/errors.ts`
- Graceful shutdown:
  - SIGINT/SIGTERM stop transport + watchers cleanly.

## 3) Implement vault/SkillPointer engine (lazy content model)
- Files:
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/vault/types.ts`
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/vault/scanner.ts`
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/vault/manifest.ts`
- Scanner behavior:
  - startup scan stores only category/name/path metadata.
  - no full `SKILL.md` content load at startup.
- Browse/search summary behavior:
  - read frontmatter description only (truncated to configured max length).
- `skill_get` is the only tool reading full file content.

## 4) Implement `cbx_config.json` read/write layer
- Files:
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/cbxConfig/types.ts`
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/cbxConfig/paths.ts`
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/cbxConfig/reader.ts`
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/cbxConfig/writer.ts`
- Read behavior:
  - merge global + project, project overrides.
  - support scope-specific reads (`global`, `project`, auto-effective default).
- Write behavior:
  - mutate only target field (`postman.mcpUrl` or `stitch.activeProfileName`).
  - atomic writes (temp file + rename).
  - never expose/log `apiKey`.
- Missing-config error (exact message):
  - `"cbx_config.json not found. Run cbx workflows config --scope global --show to diagnose."`

## 5) Implement all MCP tools with Zod input validation
- Registry:
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/tools/index.ts`
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/tools/future/index.ts`
  - `/Users/phumrin/Documents/Cubis Foundry/mcp/src/tools/future/README.md`
- Skills tools:
  - `skill_list_categories`
  - `skill_browse_category`
  - `skill_search`
  - `skill_get`
- Postman tools:
  - `postman_get_mode`
  - `postman_set_mode`
  - `postman_get_status`
- Stitch tools:
  - `stitch_get_mode`
  - `stitch_set_profile`
  - `stitch_get_status`
- Return format:
  - all tools return MCP `ContentBlock[]` with `type: "text"` and JSON-stringified payload.
- Postman mode mapping:
  - `minimal -> https://mcp.postman.com/minimal`
  - `code -> https://mcp.postman.com/code`
  - `full -> https://mcp.postman.com/mcp`
- Required notes:
  - postman set note exact string.
  - stitch set note exact string.

## 6) Startup logging contract
On each startup print fixed lines (exact numeric values), plus runtime values for URLs/modes:
- Vault fixed savings banner (`2004/35/~245/~80,160/99.7%`)
- Postman mode + URL from `cbx_config.json`
- Stitch URL from `cbx_config.json`
- active transport
If config missing, log exact warning and continue.

## 7) Write project README (full requested sections)
- `/Users/phumrin/Documents/Cubis Foundry/mcp/README.md`
- Include all 11 requested sections.
- Include full Postman/Stitch tool-call reference with input/output examples.
- Include token savings explanation + calculator.
- Include MCP client config examples (Codex/Antigravity/Copilot).
- Include explicit “credentials managed by cbx, never by this server”.

## 8) Full repo cleanup for legacy MCP catalog model
Update these files to remove old model and keep repo coherent:

- CLI cleanup:
  - `/Users/phumrin/Documents/Cubis Foundry/bin/cubis.js`
  - remove `mcpRoot/mcpSkillsRoot/mcpVaultRoot/mcpCatalogRoot` usage
  - remove `--include-mcp` option handling and help text
  - redefine `--all-skills` semantics without MCP-catalog coupling
  - remove `.mcp-vault` install/remove logic
  - remove MCP-catalog merging path in skill resolution

- Script cleanup:
  - `/Users/phumrin/Documents/Cubis Foundry/scripts/validate-platform-attributes.mjs`
  - `/Users/phumrin/Documents/Cubis Foundry/scripts/sync-skill-mirrors.mjs`
  - `/Users/phumrin/Documents/Cubis Foundry/scripts/generate-skills-index.mjs`
  - `/Users/phumrin/Documents/Cubis Foundry/workflows/scripts/generate-powers.mjs`
  - `/Users/phumrin/Documents/Cubis Foundry/scripts/smoke-workflows.sh`
  - `/Users/phumrin/Documents/Cubis Foundry/scripts/test-tech-md-scanner.mjs`
  - remove old `mcp/skills|catalogs|vault` assumptions and expected strings.

- Bundle/skill cleanup:
  - `/Users/phumrin/Documents/Cubis Foundry/workflows/workflows/agent-environment-setup/manifest.json`
  - remove selected MCP-related skill IDs from all platform skill arrays.
  - delete skill/power directories for removed IDs across canonical + mirrors.
  - remove `mcp-catalog` artifacts from mirrors.

- Docs cleanup:
  - `/Users/phumrin/Documents/Cubis Foundry/README.md`
  - remove stale `--include-mcp` and old catalog flow documentation.
  - add short note pointing to new `/mcp` server project.

- Regenerate artifacts after deletions:
  - skill indexes
  - mirrored skill trees
  - powers where applicable
  - then verify no stale references remain.

## Public API / Interface Changes
- New standalone MCP server at `/Users/phumrin/Documents/Cubis Foundry/mcp` exposing 10 tools listed above.
- `cbx` CLI breaking change:
  - remove `--include-mcp`
  - remove old include-mcp semantics from `--all-skills`
- Bundle breaking change:
  - removed MCP-related skill IDs from install manifests.
- Removed old in-repo MCP catalog/vault layout under previous `mcp/skills|catalogs|vault`.

## Test & Verification Plan

## A) New `mcp` package tests (Vitest)
- Config schema validation (rejects credential fields in server config).
- Vault scanner/manifest behavior:
  - startup metadata-only scan
  - browse/search summary extraction + truncation
  - lazy full read only in `skill_get`.
- `cbxConfig` reader/writer:
  - merge precedence global/project
  - auto-effective scope selection
  - field-only atomic writes
  - not-found and invalid-profile errors.
- Tool handler tests:
  - all 10 tools success + validation + error paths.
  - response format is valid `ContentBlock[]` text JSON.
- Transport smoke:
  - stdio boot
  - SSE boot endpoint initialization.

## B) Repo regression checks
- run generator/check scripts affected by cleanup.
- run root validation suite:
  - `npm run test:attributes`
  - `npm run test:tech-md`
- run targeted smoke subset for install/remove flows impacted by skill source changes (or full smoke if time permits).

## C) Manual checks
- Start new server with stdio and verify startup logs.
- Set/Read Postman mode tool end-to-end against local/global `cbx_config.json`.
- Set/Read Stitch profile tool end-to-end.
- Verify no output ever prints actual `apiKey`.

## Assumptions & Defaults
- Node runtime baseline remains compatible with current repo (`>=18.17`), while local machine uses newer Node.
- `scope` omitted means auto-effective (project if exists, else global).
- Unknown Postman mode URL in config is treated as validation error (explicit MCP error), not silently coerced.
- Old MCP catalog model is intentionally removed and not preserved.
- Boot token numbers are fixed text, not computed dynamically.
