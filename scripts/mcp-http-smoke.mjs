#!/usr/bin/env node

/**
 * Minimal MCP Streamable HTTP smoke check.
 *
 * Verifies:
 * 1) initialize handshake works
 * 2) notifications/initialized accepted
 * 3) tools/list returns expected built-in tools
 */

const endpoint = process.argv[2] || "http://127.0.0.1:3100/mcp";

function parseMcpResponse(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const lines = trimmed.split(/\r?\n/);
    const dataLines = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean)
      .filter((line) => line !== "[DONE]");
    for (let i = dataLines.length - 1; i >= 0; i -= 1) {
      try {
        return JSON.parse(dataLines[i]);
      } catch {
        // continue
      }
    }
  }
  return null;
}

async function sendRpc({
  endpointUrl,
  method,
  params = {},
  id = null,
  sessionId = null,
}) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;

  const payload =
    id === null
      ? { jsonrpc: "2.0", method, params }
      : { jsonrpc: "2.0", id, method, params };

  const res = await fetch(endpointUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const body = await res.text();

  if (!res.ok) {
    throw new Error(
      `RPC ${method} failed: HTTP ${res.status} ${res.statusText}\n${body.slice(0, 500)}`,
    );
  }

  const parsed = parseMcpResponse(body);
  return {
    parsed,
    raw: body,
    sessionId: res.headers.get("mcp-session-id") || sessionId,
  };
}

async function main() {
  const initialize = await sendRpc({
    endpointUrl: endpoint,
    method: "initialize",
    id: "smoke-init",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: {
        name: "cbx-docker-smoke",
        version: "1.0.0",
      },
    },
  });

  const sessionId = initialize.sessionId;
  if (!sessionId) {
    throw new Error("MCP session id missing from initialize response");
  }

  await sendRpc({
    endpointUrl: endpoint,
    method: "notifications/initialized",
    params: {},
    sessionId,
  });

  const listed = await sendRpc({
    endpointUrl: endpoint,
    method: "tools/list",
    id: "smoke-tools-list",
    params: {},
    sessionId,
  });

  const tools = Array.isArray(listed.parsed?.result?.tools)
    ? listed.parsed.result.tools
    : [];
  const toolNames = tools
    .map((tool) => (typeof tool?.name === "string" ? tool.name : null))
    .filter(Boolean);

  const required = [
    "skill_list_categories",
    "postman_get_mode",
    "stitch_get_mode",
  ];
  for (const name of required) {
    if (!toolNames.includes(name)) {
      throw new Error(
        `Required MCP tool is missing: ${name}. Total tools: ${toolNames.length}`,
      );
    }
  }

  const namespacedPostman = toolNames.filter((name) =>
    String(name).startsWith("postman."),
  ).length;
  const namespacedStitch = toolNames.filter((name) =>
    String(name).startsWith("stitch."),
  ).length;

  console.log(`endpoint=${endpoint}`);
  console.log(`sessionId=${sessionId}`);
  console.log(`tools.total=${toolNames.length}`);
  console.log(`tools.postman.namespaced=${namespacedPostman}`);
  console.log(`tools.stitch.namespaced=${namespacedStitch}`);
}

main().catch((error) => {
  console.error(`MCP HTTP smoke failed: ${error.message}`);
  process.exit(1);
});
