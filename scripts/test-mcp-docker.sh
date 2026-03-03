#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_DIR="$ROOT_DIR/mcp"
SMOKE_JS="$ROOT_DIR/scripts/mcp-http-smoke.mjs"

IMAGE_NAME="${CBX_MCP_IMAGE:-cbx-mcp:test}"
CONTAINER_NAME="${CBX_MCP_CONTAINER:-cbx-mcp-e2e}"
HOST="${CBX_MCP_HOST:-127.0.0.1}"
PORT="${CBX_MCP_PORT:-3310}"
TIMEOUT_SECONDS="${CBX_MCP_TIMEOUT_SECONDS:-30}"
KEEP_CONTAINER="${CBX_MCP_KEEP_CONTAINER:-0}"
REQUIRE_KEYS="${CBX_MCP_REQUIRE_KEYS:-0}"

TMP_HOME="$(mktemp -d /tmp/cbx-mcp-docker.XXXXXX)"

log_step() {
  echo ""
  echo "== $1 =="
}

log_ok() {
  echo "[OK] $1"
}

cleanup() {
  if docker ps -a --format '{{.Names}}' | rg -x "$CONTAINER_NAME" >/dev/null 2>&1; then
    if [ "$KEEP_CONTAINER" = "1" ]; then
      echo "[INFO] Keeping container: $CONTAINER_NAME"
    else
      docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
    fi
  fi
  rm -rf "$TMP_HOME"
}
trap cleanup EXIT

fail_with_diagnostics() {
  echo "[FAIL] $1" >&2
  echo "" >&2
  echo "---- docker ps -a ----" >&2
  docker ps -a --filter "name=$CONTAINER_NAME" >&2 || true
  echo "" >&2
  echo "---- docker logs (tail 120) ----" >&2
  docker logs "$CONTAINER_NAME" --tail 120 >&2 || true
  exit 1
}

log_step "Preflight"
command -v docker >/dev/null 2>&1 || fail_with_diagnostics "docker CLI not found"
docker info >/dev/null 2>&1 || fail_with_diagnostics "docker daemon is not running"
command -v node >/dev/null 2>&1 || fail_with_diagnostics "node is not installed"
[ -f "$SMOKE_JS" ] || fail_with_diagnostics "missing smoke script: $SMOKE_JS"
log_ok "docker + node available"

if [ "$REQUIRE_KEYS" = "1" ]; then
  [ -n "${POSTMAN_API_KEY_DEFAULT:-}" ] || fail_with_diagnostics "POSTMAN_API_KEY_DEFAULT is required when CBX_MCP_REQUIRE_KEYS=1"
  [ -n "${STITCH_API_KEY_DEFAULT:-}" ] || fail_with_diagnostics "STITCH_API_KEY_DEFAULT is required when CBX_MCP_REQUIRE_KEYS=1"
  log_ok "required key env vars present"
else
  if [ -z "${POSTMAN_API_KEY_DEFAULT:-}" ] || [ -z "${STITCH_API_KEY_DEFAULT:-}" ]; then
    echo "[WARN] POSTMAN_API_KEY_DEFAULT or STITCH_API_KEY_DEFAULT is unset; namespaced tool discovery may be partial."
  fi
fi

log_step "Prepare temp cbx_config.json"
mkdir -p "$TMP_HOME/.cbx"
cat >"$TMP_HOME/.cbx/cbx_config.json" <<'JSON'
{
  "schemaVersion": 1,
  "postman": {
    "profiles": [
      {
        "name": "default",
        "apiKeyEnvVar": "POSTMAN_API_KEY_DEFAULT",
        "workspaceId": null
      }
    ],
    "activeProfileName": "default",
    "mcpUrl": "https://mcp.postman.com/minimal"
  },
  "stitch": {
    "profiles": [
      {
        "name": "default",
        "apiKeyEnvVar": "STITCH_API_KEY_DEFAULT",
        "url": "https://stitch.googleapis.com/mcp"
      }
    ],
    "activeProfileName": "default",
    "mcpUrl": "https://stitch.googleapis.com/mcp"
  }
}
JSON
log_ok "temp config ready at $TMP_HOME/.cbx/cbx_config.json"

cat >"$TMP_HOME/.cbx/mcp-config.json" <<'JSON'
{
  "server": {
    "name": "cubis-foundry-mcp",
    "version": "0.1.0",
    "description": "Cubis Foundry MCP Server (docker smoke config)"
  },
  "vault": {
    "roots": ["./workflows/skills"],
    "summaryMaxLength": 200
  },
  "transport": {
    "default": "streamable-http",
    "http": {
      "port": 3100,
      "host": "0.0.0.0"
    }
  }
}
JSON
log_ok "temp mcp runtime config ready at $TMP_HOME/.cbx/mcp-config.json"

log_step "Build image"
docker build -t "$IMAGE_NAME" "$MCP_DIR" >/tmp/cbx-mcp-docker-build.log 2>&1 || {
  cat /tmp/cbx-mcp-docker-build.log >&2 || true
  fail_with_diagnostics "docker build failed"
}
log_ok "image built: $IMAGE_NAME"

log_step "Run container"
if docker ps -a --format '{{.Names}}' | rg -x "$CONTAINER_NAME" >/dev/null 2>&1; then
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
fi

docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:3100" \
  -e POSTMAN_API_KEY_DEFAULT \
  -e STITCH_API_KEY_DEFAULT \
  -v "$TMP_HOME/.cbx:/root/.cbx" \
  "$IMAGE_NAME" \
  --config /root/.cbx/mcp-config.json >/tmp/cbx-mcp-docker-run.log 2>&1 || {
  cat /tmp/cbx-mcp-docker-run.log >&2 || true
  fail_with_diagnostics "docker run failed"
}
log_ok "container started: $CONTAINER_NAME"

log_step "Wait for MCP endpoint"
MCP_URL="http://$HOST:$PORT/mcp"
ready=0
for _ in $(seq 1 "$TIMEOUT_SECONDS"); do
  if node "$SMOKE_JS" "$MCP_URL" >/tmp/cbx-mcp-smoke.log 2>&1; then
    ready=1
    log_ok "MCP endpoint ready: $MCP_URL"
    break
  fi
  sleep 1
done

if [ "$ready" -ne 1 ]; then
  cat /tmp/cbx-mcp-smoke.log >&2 || true
  fail_with_diagnostics "MCP smoke handshake failed"
fi
cat /tmp/cbx-mcp-smoke.log

log_step "Container logs (tail 80)"
docker logs "$CONTAINER_NAME" --tail 80 || true

log_step "Result"
echo "ALL_OK"
