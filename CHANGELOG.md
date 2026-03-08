# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Changed

- Clarified Postman MCP guidance across skills, workflows, README, and platform rule templates:
  - direct `postman` MCP server is now the explicit execution path for collections, workspaces, environments, monitors, and runs
  - Foundry `postman_*` tools are documented as config/status helpers only.
- Added quota-safe Postman execution guidance:
  - no automatic `runCollection` -> `runMonitor` fallback
  - Postman CLI is the recommended secondary path after direct MCP execution fails
  - monitor quota, API rate limits, and runtime timeouts are documented as separate failure classes.

## [0.3.67] - 2026-03-08

### Fixed

- `cbx init` now keeps MCP runtime selection available when `cubis-foundry` is the only MCP selected.
- Foundry MCP install/config patching now respects the selected runtime:
  - local runtime keeps the `cbx mcp serve` stdio registration
  - docker runtime points supported clients at the local Docker MCP endpoint
- `cbx workflows config --mcp-runtime ...` now reapplies managed MCP target wiring so runtime changes update the platform config.

## [0.3.62] - 2026-03-05

### Fixed

- Added `--overwrite` support to `cbx init` and wired it through wizard execution so guided installs can replace existing managed files instead of failing/being skipped.
- Updated init wizard documentation/help examples to include overwrite usage in scripted and repeat install flows.

## [0.3.61] - 2026-03-05

### Fixed

- Extended MCP startup reliability fixes across all supported platforms:
  - project/global Postman MCP runtime targets now prefer static Authorization headers when managed keys are available
  - Stitch header generation now also supports managed static key injection for runtime startup reliability.
- Unified default managed credential aliases across install paths:
  - Postman default env alias is now `POSTMAN_API_KEY_DEFAULT`
  - Stitch default env alias is now `STITCH_API_KEY_DEFAULT`
  - aligns non-wizard installs with wizard persistence behavior across platforms.

## [0.3.60] - 2026-03-05

### Fixed

- Fixed `cbx mcp serve` runtime failure from global npm installs by including required MCP runtime dependencies in the main package (`@modelcontextprotocol/sdk`, `zod`).
- Improved Codex global Postman MCP startup reliability:
  - after registration, CBX now patches Codex MCP config to use static Authorization headers when a managed Postman key is available
  - avoids startup failures caused by missing shell-exported `POSTMAN_API_KEY_DEFAULT`.

## [0.3.59] - 2026-03-05

### Added

- Added dedicated Postman workflow routing across supported platforms:
  - new `/postman` workflow definition
  - generated platform assets for Codex, Antigravity, and Copilot
  - generated wrapper skill `workflow-postman` for Codex.

### Changed

- Tightened Postman guidance to be MCP-first:
  - explicitly prefer `postman.*` / `postman_*` tools for execution
  - disallow default fallback to raw JSON/curl/Newman unless explicitly requested.
- Updated Postman setup/troubleshooting docs to be scope-aware (`project|global`) so project installs stop drifting to global-only guidance.
- Updated Codex rules template to reinforce no default JSON/curl fallback when Postman MCP tools are available.
- Updated smoke test expectations from 18 to 19 workflows/prompts/commands where applicable.

## [0.3.57] - 2026-03-05

### Changed

- Refined `cbx init` welcome banner to a cleaner terminal layout with improved spacing and branding readability.
- Removed placeholder banner text and replaced it with final Cubis Foundry ASCII presentation.

## [0.3.56] - 2026-03-05

### Fixed

- Improved `cbx remove all` cleanup coverage:
  - removes CBX-managed skills from all configured profile path candidates (not just a single preferred path)
  - includes legacy Codex skill path cleanup (`~/.codex/skills`) for managed artifacts
  - removes empty global CBX roots (`~/.cbx`, `~/.agents`) after cleanup when eligible.
- Ensured global remove flow clears CBX-managed profile/config artifacts consistently (`~/.cbx/cbx_config.json`, `~/.cbx/state.json`, `~/.cbx/credentials.env` when present).

## [0.3.55] - 2026-03-05

### Added

- Added Postman workspace selection step to `cbx init` wizard:
  - interactive workspace list from Postman API when key is available
  - manual workspace ID fallback prompt when listing is unavailable.
- Added non-interactive workspace flag for wizard:
  - `cbx init --postman-workspace-id <id|null>`

### Changed

- Updated wizard execution mapping so selected Postman workspace is persisted through install flow.
- Updated init wizard docs and TTY smoke test to validate the new workspace selection step.

## [0.3.54] - 2026-03-05

### Added

- Added full cleanup command surfaces:
  - `cbx remove all ...`
  - `cbx workflows remove-all ...`
- Added cleanup engine for removing CBX-managed generated artifacts across selected scopes/platforms (workflows, wrappers, managed rule blocks/docs, MCP artifacts, runtime entries, and state/config roots).
- Added optional credential cleanup flag for full cleanup (`--include-credentials`).
- Added true-PTY init smoke test (`scripts/test-init-tty.exp`) and expanded smoke coverage for scripted init + remove-all command surfaces.

### Changed

- Updated README with full cleanup documentation and generated-file ignore recommendations for downstream repositories.

## [0.3.53] - 2026-03-05

### Changed

- Migrated CLI runtime source to TypeScript modules under `src/cli` with compiled runtime output in `dist/cli`.
- Replaced `bin/cubis.js` with a thin runtime loader that executes compiled CLI output.
- Centralized command registration in modular TS command registrars (`workflows`, `mcp`, `rules`).
- Added root CLI build pipeline (`tsconfig.cli.json`, `npm run build:cli`, `prepack` build hook).
- Added interactive `cbx init` guided installer (bundle/platform/skills/MCP/scope flow with sequential per-platform execution).
- Added `cbx init` welcome branding screen and JSON summary mode.
- Added Stitch-only and Foundry-only MCP selection support in guided install flow.
- `cbx rules init` now refreshes generated/legacy `ENGINEERING_RULES.md` templates even without `--overwrite`.
- Managed engineering block now points to full absolute paths and enforces Decision Log response style.
- Added maintainers-facing wizard documentation at `docs/cli-init-wizard.md`.

### Removed

- Removed legacy alias command tree `cbx skills ...`.
- Removed root aliases `cbx install` and `cbx platforms`.
- Removed alias subcommand `cbx workflows init`.

### Notes

- Canonical command surfaces are now:
  - `cbx init`
  - `cbx workflows ...`
  - `cbx mcp ...`
  - `cbx rules ...`
  - `cbx agents status`

## [0.3.34] - 2026-03-02

### Added

- Added profile-based install controls for workflow setup:
  - `--skill-profile <core|web-backend|full>`
  - `--include-mcp`
  - `--all-skills` alias for full catalog install
- Added `cbx workflows prune-skills` to detect/remove nested duplicates and out-of-profile installed skills.
- Added split MCP catalog and roots:
  - `mcp/skills`
  - `mcp/powers`
  - `mcp/catalogs/default.json`

### Changed

- Changed default install behavior to `core` skill profile for lower context footprint.
- Updated resolver/index generation to support combined workflow + MCP skill roots.
- Updated powers generation and validation scripts to handle split roots.
- Refined rule/agent templates to reduce forced skill loading and keep selection adaptive.
- Refreshed language skills and added new language packs:
  - `java-pro`
  - `csharp-pro`
  - `kotlin-pro`

### Fixed

- Fixed nested duplicate cleanup to catch direct-child duplicate skill folders.
- Fixed duplicate-skill-name collision handling in index generation and alias metadata.

## [0.3.31] - 2026-02-27

### Changed

- Renamed repository assets directory from `Ai Agent Workflow` to `workflows`.
- Updated all CLI/scripts/package references to use the new `workflows` path.

## [0.3.30] - 2026-02-27

### Changed

- Republished package with a README content touch to force npm UI metadata/index refresh.

## [0.3.29] - 2026-02-27

### Changed

- Switched credential/config source to `cbx_config.json` only for Postman and Stitch runtime selection.
- Added profile-based credential model for Postman/Stitch (`profiles[]` + `activeProfileName`) with compatibility mirrors.
- Updated `cbx workflows config --show` to include computed `status` with stored source vs effective source and active profile/env alias context.
- Changed default skill install resolution to indexed top-level skills (`skills_index.json` + resolved skill dirs), instead of curated manifest subset.
- Added automatic nested duplicate skill cleanup during install (for example duplicate skill packs nested under `postman/*`).
- Rewrote README into a full operational guide (quickstarts, scopes, credential flows, MCP placement, troubleshooting, migration).

### Added

- Added `cbx workflows config keys` profile-management commands:
  - `list`
  - `add`
  - `use`
  - `remove`
- Added `cbx skills config keys` compatibility alias.

### Fixed

- Removed legacy Postman fallback file references from runtime/docs and enforce migration to `cbx_config.json`.
- Updated validation/smoke scripts to align with global-skill default install model and profile-based config behavior.

## [0.3.28] - 2026-02-27

### Fixed

- Added missing `golang-pro` skill to `agent-environment-setup` manifest for Codex, Antigravity, and Copilot installs.

## [0.3.27] - 2026-02-26

### Changed

- Updated Postman skill/power guidance to use `cbx_config.json` as the default config source with `POSTMAN_API_KEY` env-first auth.
- Added explicit instruction to avoid referencing legacy Postman fallback configs in normal responses when `cbx_config.json` exists.

## [0.3.26] - 2026-02-26

### Fixed

- Fixed MCP install merge behavior for existing JSONC config files (comments/trailing commas), so existing MCP entries are preserved instead of being reset.
- Fixed Postman MCP patching to parse and merge JSONC for platform config targets (for example `.vscode/mcp.json`).

## [0.3.25] - 2026-02-26

### Added

- Added `cbx workflows config` command to view and edit `cbx_config.json` from terminal.
- Added `cbx skills config` alias for compatibility with deprecated `skills` command group.
- Added docs for showing/updating/clearing Postman `defaultWorkspaceId` after install.

### Changed

- Improved Postman install warnings when workspace selection is not persisted because existing `cbx_config.json` was skipped.
- Included actionable follow-up command in warnings (`cbx workflows config ...`).

## [0.3.23] - 2026-02-26

### Added

- Added a root `CHANGELOG.md` and npm-visible changelog section in `README.md`.
- Included `CHANGELOG.md` in published npm package files.

## [0.3.22] - 2026-02-26

### Added

- Added Antigravity-only default `StitchMCP` runtime setup in Gemini settings.
- Added `--stitch-api-key` and `STITCH_API_KEY` support for Stitch MCP config.
- Added managed Stitch MCP definition output in `.cbx/mcp/antigravity/stitch.json`.
- Added Stitch and Postman API key setup links and guidance in `README.md`.

## [0.3.21] - 2026-02-26

### Changed

- Split Postman MCP management from skill folder into managed `.cbx/mcp/<platform>/postman.json`.
- Added centralized Postman config via `cbx_config.json`.
- Added MCP scope controls (`project/workspace/global/user`) with platform-aware runtime placement.
- Kept rules/engineering artifacts in workspace scope while defaulting skills/powers install to global scope.


