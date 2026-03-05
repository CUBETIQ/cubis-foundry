# Changelog

All notable changes to this project are documented in this file.

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
