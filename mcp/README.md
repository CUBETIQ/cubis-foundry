# MCP Skill Catalog

This directory contains MCP-focused skills and powers separated from workflow-first skills.

## Layout

- `mcp/skills/<skill-id>/...`: canonical MCP skills
- `mcp/powers/<skill-id>/...`: canonical MCP powers
- `mcp/catalogs/default.json`: default MCP profile used by `--include-mcp`

## Install Behavior

- `cbx workflows install` defaults to workflow profile `core` (no MCP skills).
- Add `--include-mcp` to append MCP skills from `mcp/catalogs/default.json`.
- Use `--all-skills` to install workflow full profile + MCP skills.

Legacy wrappers remain in `workflows/skills/*` and `workflows/powers/*` for compatibility.
