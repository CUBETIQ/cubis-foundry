---
name: postman
description: Use Postman MCP tools for workspace, collection, environment, and run workflows with explicit default-workspace handling.
---

# Postman MCP

Use this skill when you need to work with Postman through MCP tools.

## MCP-First Rule

- Prefer Postman MCP tools (`postman.*`) for all Postman operations.
- Do not use Newman/Postman CLI fallback unless the user explicitly asks for fallback.
- If required Postman MCP tools are unavailable, stop and report the MCP discovery issue with remediation steps.

## Required Environment Variables

- Active profile key alias must be set (typically `POSTMAN_API_KEY_DEFAULT`).
- `POSTMAN_API_KEY_<PROFILE>` aliases are also valid if the active profile uses them.

## Preflight Checklist

1. Read Postman status first:
   - Call `postman_get_status` (`scope: auto` unless user requires a scope).
2. Validate connectivity and mode:
   - If not configured, report missing env alias/config and stop.
   - If mode is not `full`, call `postman_set_mode` with `mode: full`.
3. Discover upstream tools:
   - Prefer `postman.getEnabledTools` when available.
   - Confirm required tool names before proceeding (for example `getWorkspaces`, `getCollections`, `runCollection`).

## Default Workspace ID Policy

Resolve workspace in this order:

1. User-provided workspace ID.
2. `postman_get_status.defaultWorkspaceId`.
3. Auto-detect from `postman.getWorkspaces`:
   - If exactly one workspace exists, use it and state that choice.
4. If multiple workspaces and no default:
   - Ask user to choose one.
   - Recommend persisting it with:
     - `cbx workflows config --scope global --workspace-id <workspace-id>`

When a Postman tool requires a workspace argument, always pass the resolved workspace ID explicitly.

## Common Workflows

### List/Inspect

- `postman.getWorkspaces`
- `postman.getCollections` (with resolved workspace ID)
- `postman.getEnvironments` (with resolved workspace ID)

### Collection Run

1. Resolve workspace ID (policy above).
2. Resolve `collectionId` and optional `environmentId`.
3. Call `postman.runCollection`.
4. Return a concise run summary:
   - total requests
   - passed/failed tests
   - failing request/test names
   - proposed fix path for failures

## Failure Handling

If dynamic Postman tools are missing (only `postman_get_*` / `postman_set_mode` visible):

1. Verify env alias expected by config is set.
2. Resync catalog:
   - `cbx mcp tools sync --service postman --scope global`
   - `cbx mcp tools list --service postman --scope global`
3. Recreate runtime if needed:
   - `cbx mcp runtime up --scope global --name cbx-mcp --replace --port 3310 --skills-root ~/.agents/skills`

## Security Notes

- Use environment variables for secrets. Do not inline API keys.
- Never print or persist raw key values in logs, docs, or responses.
