# Tool Patterns for Cloudflare MCP Servers

Use these patterns when defining tools in a Worker-based MCP server.

## 1) Read-only lookup tool
- Purpose: fetch status/info without side effects.
- Input schema: strict object with required identifiers.
- Output: typed payload + stable error shape.

## 2) Mutating action tool
- Purpose: create/update/delete with explicit confirmation rules.
- Input schema: include idempotency key when possible.
- Output: operation result with `changed: true|false`.

## 3) Search/list tool
- Purpose: paginated retrieval.
- Input schema: `limit`, `cursor` (opaque token), optional filters.
- Output: `items`, `next_cursor`, `has_more`.

## 4) Long-running task launcher
- Purpose: start async work and return tracking handle.
- Input schema: task definition + options.
- Output: `task_id`, `status_url` or poll key.

## Guardrails
- Validate all tool inputs before processing.
- Return deterministic errors with machine-readable codes.
- Avoid leaking secrets in logs or output.
- Keep tool names stable once published.
