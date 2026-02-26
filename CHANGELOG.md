# Changelog

All notable changes to this project are documented in this file.

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
