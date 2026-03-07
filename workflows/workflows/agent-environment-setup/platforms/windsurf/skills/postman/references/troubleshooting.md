# Postman MCP Troubleshooting

## Only `postman_get_*` / `postman_set_mode` tools appear

1. Confirm active env alias exists in shell (or persisted env file).
2. Sync catalog in the same install scope:

```bash
cbx mcp tools sync --service postman --scope <project|global>
cbx mcp tools list --service postman --scope <project|global>
```

3. Restart runtime if using Docker:

```bash
cbx mcp runtime up --scope <project|global> --name cbx-mcp --replace --port 3310
```

4. If dynamic Postman tools are still missing, do not fall back to manual JSON/CLI by default:
   - report MCP tool discovery failure
   - ask for remediation approval
   - only use fallback if the user explicitly requests it

## Client does not show dotted names

Use alias tools (`postman_<tool>`) when dotted names are filtered by client UI.

## Missing API key at startup

Expected behavior: tool names can still come from cached catalog; tool calls fail with explicit auth error until env alias is set.

## Quota-safe execution

Preferred path:

1. Use direct Postman MCP collection execution first (`postman.runCollection` or equivalent).
2. If that fails, stop and classify the error.
3. Recommend Postman CLI as the safe default secondary path.
4. Use monitor execution only when the user explicitly asks for monitor-based cloud execution.

Do not auto-fallback from `runCollection` to `runMonitor`.

## Error classification

### `limitBreachedError` or "breached monitoring usage limit"

- This is monitor quota exhaustion, not generic API failure.
- Do not retry monitor runs.
- Do not reinterpret it as an MCP auth issue.
- Tell the user to check Postman monitoring usage and billing-period reset in the Postman dashboard.
- Recommend Postman CLI as the next execution path.

### `429` or rate-limited API response

- This is Postman API rate limiting.
- Reduce request burst, add backoff, and retry later.
- Do not treat it as monitor quota exhaustion.

### `runCollection` timeout without quota/rate-limit signal

- Treat this as direct MCP/runtime timeout.
- Do not auto-convert to monitor execution.
- Recommend Postman CLI or a smaller-scope rerun.

## Monitor usage facts

- Monitor usage is separate from Postman API RPM limits.
- Monitor usage is consumed by request count, region count, and auth requests.
- Monitor runtime caps are separate from monitor quota and do not imply usage remains available.
