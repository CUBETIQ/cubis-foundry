# Changelog

All notable changes to this project are documented in this file.

## [0.3.27] - 2026-02-26

### Changed

- Updated Postman skill/power guidance to use `cbx_config.json` as the default config source with `POSTMAN_API_KEY` env-first auth.
- Added explicit instruction to avoid referencing `postman_setting.json` in normal responses when `cbx_config.json` exists.

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
