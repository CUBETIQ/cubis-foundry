---
name: postman
description: Automate API testing and collection management with Postman MCP using full-mode defaults and workspace-aware execution.
---
# Postman MCP Skill

Use this skill when you need Postman workspace, collection, environment, or run operations through MCP.

References:
- [Full-Mode Setup](./references/full-mode-setup.md)
- [Workspace Policy](./references/workspace-policy.md)
- [Troubleshooting](./references/troubleshooting.md)

## MCP-First Rule

- Prefer Postman MCP tools for all Postman operations.
- Accept both dynamic naming styles from clients:
  - dotted: `postman.<tool>`
  - alias: `postman_<tool>`
- Never default to raw Postman REST JSON payloads, Newman, or Postman CLI when MCP tools are available.
- Do not use Newman/Postman CLI fallback unless the user explicitly asks for fallback.
- If required Postman MCP tools are unavailable, report discovery/remediation steps first.

## Setup Baseline

1. Install with Postman enabled and explicit full mode (use the same scope as your current install):
   - `cbx workflows install --platform <codex|antigravity|copilot> --scope <project|global> --bundle agent-environment-setup --postman --postman-mode full --mcp-runtime docker --mcp-fallback local --mcp-tool-sync --yes`
2. Persist env aliases once (no per-session re-export):
   - `cbx workflows config keys persist-env --service postman --scope global`
3. Verify mode/config:
   - `cbx workflows config --scope <project|global> --show`
   - `cbx mcp tools sync --service postman --scope <project|global>`
   - `cbx mcp tools list --service postman --scope <project|global>`

## Preflight

1. Read Postman status first:
   - Call `postman_get_status`.
2. Ensure mode is `full`:
   - If not, call `postman_set_mode` with `mode: full`.
3. Discover upstream tools:
   - Confirm required tools exist before execution (for example workspaces/collections/runs).

Execution rule:
- For Postman requests, call MCP tools directly (`postman.*` or `postman_*`) instead of drafting manual JSON or curl payloads.
- If the user asks for API payload examples, provide them only as supplemental documentation after MCP execution guidance.

## Default Workspace Policy

Resolve workspace in this order:

1. User-provided workspace ID.
2. `postman_get_status.defaultWorkspaceId`.
3. Auto-detect from workspace listing:
   - If exactly one workspace exists, use it and state that choice.
4. If multiple workspaces and no default:
   - Ask user to choose one.
   - Recommend persisting it with:
     - `cbx workflows config --scope <project|global> --workspace-id <workspace-id>`

When a Postman tool requires a workspace argument, always pass the resolved workspace ID explicitly.

## Common Workflows

### Collection Run

1. Resolve workspace ID (policy above).
2. Resolve `collectionId` and optional `environmentId`.
3. Call Postman run tool (`postman.runCollection` or alias equivalent).
4. Return a concise run summary:
   - total requests
   - passed/failed tests
   - failing request/test names
   - proposed fix path for failures

## Failure Handling

If dynamic Postman tools are missing:

1. Verify env alias expected by config is set.
2. Resync catalog:
   - `cbx mcp tools sync --service postman --scope <project|global>`
   - `cbx mcp tools list --service postman --scope <project|global>`
3. Recreate runtime if needed:
   - `cbx mcp runtime up --scope <project|global> --name cbx-mcp --replace --port 3310 --skills-root ~/.agents/skills`

## Security Notes

- Use environment variables for secrets. Do not inline API keys.
- Never print or persist raw key values in logs, docs, or responses.
