---
name: stitch
description: Automate Stitch workflows through Stitch MCP using mcp-remote transport.
---
# Stitch MCP

Use this skill when you need to call Stitch tools through MCP passthrough.

## Required Environment Variables

- `STITCH_API_KEY_<PROFILE>` for Stitch API-key mode.

## Notes

- Stitch transport uses `mcp-remote` to `https://stitch.googleapis.com/mcp`.
- Inject `X-Goog-Api-Key` from environment at runtime. Do not store raw keys in config files.
