# Postman Full-Mode Setup

Use CLI mode flags instead of manual `jq` edits.

## Install/Upgrade with Full Mode

```bash
cbx workflows install \
  --platform codex \
  --scope global \
  --bundle agent-environment-setup \
  --postman \
  --postman-mode full \
  --mcp-runtime docker \
  --mcp-fallback local \
  --mcp-tool-sync \
  --overwrite \
  --yes
```

## Change Mode Later

```bash
cbx workflows config --scope global --platform codex --postman-mode full
```

This updates:
- `cbx_config.json` Postman URL
- managed Postman MCP definition under `.cbx/mcp/<platform>/postman.json`
- platform MCP runtime target patch (when platform is resolvable)

## Persist Env Aliases

```bash
cbx workflows config keys persist-env --service postman --scope global
```
