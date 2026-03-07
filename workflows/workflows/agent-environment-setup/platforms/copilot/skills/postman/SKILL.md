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
- Use direct Postman server tools for actual Postman cloud work:
  - direct server: `postman.<tool>`
  - client-wrapped direct server: `mcp__postman__<tool>`
- Treat Foundry `postman_*` tools as config helpers only:
  - `postman_get_status`
  - `postman_get_mode`
  - `postman_set_mode`
- Never default to raw Postman REST JSON payloads, Newman, or Postman CLI when MCP tools are available.
- Do not use `postman.runMonitor` as an automatic fallback after `postman.runCollection` timeout or failure.
- Only use monitor execution when the user explicitly asks for monitor-based cloud execution, scheduled monitoring, or monitor validation.
- Recommend Postman CLI as the default secondary path when direct MCP execution fails.
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
   - Call `postman_get_status` for mode/default-workspace/config state.
2. Ensure mode is `full`:
   - If not, call `postman_set_mode` with `mode: full`.
3. Discover upstream tools:
   - Confirm required direct Postman server tools exist before execution (for example workspaces/collections/runs).

Execution rule:
- For Postman requests, call the direct Postman server (`postman.<tool>` or `mcp__postman__<tool>`) instead of Foundry `postman_*` config tools.
- If the user asks for API payload examples, provide them only as supplemental documentation after MCP execution guidance.

Quota-safe rule:
- If `postman.runCollection` times out or fails, stop and classify the error before choosing any fallback.
- Never auto-convert a collection run failure into `postman.runMonitor`.
- Recommend Postman CLI first for repeatable local reruns.

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

### Error Classification

Classify failures before suggesting any fallback:

- `limitBreachedError` or "breached monitoring usage limit":
  - monitor quota exhaustion
  - do not retry monitor runs
  - recommend local Postman CLI execution
  - tell the user to check the Postman monitoring usage dashboard
- `429` or rate-limit response:
  - Postman API rate limiting
  - recommend backoff and a lower request burst
  - do not reinterpret it as monitor quota
- collection run timeout without quota/rate-limit signal:
  - direct MCP runtime or tool timeout
  - do not auto-convert to a monitor run
  - recommend Postman CLI or a smaller-scope rerun

### Quota Notes

- Monitor usage is separate from Postman API rate limits.
- Monitor usage is plan/billing usage and is consumed by request count, region count, and auth requests.
- Monitor runtime caps are separate from monitor quota and do not imply quota remains available.

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
