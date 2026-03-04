# Postman MCP Troubleshooting

## Only `postman_get_*` / `postman_set_mode` tools appear

1. Confirm active env alias exists in shell (or persisted env file).
2. Sync catalog:

```bash
cbx mcp tools sync --service postman --scope global
cbx mcp tools list --service postman --scope global
```

3. Restart runtime if using Docker:

```bash
cbx mcp runtime up --scope global --name cbx-mcp --replace --port 3310
```

## Client does not show dotted names

Use alias tools (`postman_<tool>`) when dotted names are filtered by client UI.

## Missing API key at startup

Expected behavior: tool names can still come from cached catalog; tool calls fail with explicit auth error until env alias is set.
