#!/usr/bin/env node

/**
 * Minimal MCP Streamable HTTP smoke check.
 *
 * Verifies:
 * 1) initialize handshake works
 * 2) notifications/initialized accepted
 * 3) tools/list returns expected built-in tools
 * 4) route_resolve works before skill discovery
 * 5) skill tools expose telemetry metrics in _meta
 * 6) skill_budget_report returns consolidated skill log + context budget
 */

const endpoint = process.argv[2] || "http://127.0.0.1:3100/mcp";

// ── Wire token tracking ──────────────────────────────────
const CHARS_PER_TOKEN = 3.5;
let wireRequestCount = 0;
let wireRequestBytes = 0;
let wireResponseBytes = 0;

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

  const bodyStr = JSON.stringify(payload);
  wireRequestCount++;
  wireRequestBytes += bodyStr.length;

  const res = await fetch(endpointUrl, {
    method: "POST",
    headers,
    body: bodyStr,
  });
  const body = await res.text();
  wireResponseBytes += body.length;

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

function parseToolTextPayload(result) {
  const textBlock = Array.isArray(result?.content)
    ? result.content.find((item) => item && item.type === "text")
    : null;
  if (!textBlock || typeof textBlock.text !== "string") {
    throw new Error("Tool result is missing text content");
  }
  return JSON.parse(textBlock.text);
}

async function callTool({ endpointUrl, sessionId, name, args = {} }) {
  const response = await sendRpc({
    endpointUrl,
    method: "tools/call",
    id: `smoke-call-${name}-${Date.now()}`,
    params: {
      name,
      arguments: args,
    },
    sessionId,
  });

  const result = response.parsed?.result;
  if (!result) {
    throw new Error(`Tool ${name} returned no result payload`);
  }
  if (result.isError) {
    const errText =
      result.content?.map((c) => c.text).join("\n") || "no content";
    throw new Error(`Tool ${name} returned isError=true: ${errText}`);
  }
  return result;
}

function assertMetricShape(name, metrics, extraKeys = []) {
  if (!metrics || typeof metrics !== "object") {
    throw new Error(`${name} did not return _meta.metrics`);
  }
  const required = [
    "estimatorVersion",
    "charsPerToken",
    "fullCatalogEstimatedTokens",
    "responseEstimatedTokens",
    "responseCharacterCount",
    "estimatedSavingsVsFullCatalog",
    "estimatedSavingsVsFullCatalogPercent",
    ...extraKeys,
  ];
  for (const key of required) {
    if (!(key in metrics)) {
      throw new Error(`${name} metrics missing required key '${key}'`);
    }
  }
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
    "route_resolve",
    "skill_list_categories",
    "skill_browse_category",
    "skill_search",
    "skill_validate",
    "skill_get",
    "skill_get_reference",
    "skill_budget_report",
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
  const aliasPostman = toolNames.filter((name) =>
    String(name).startsWith("postman_"),
  ).length;
  const aliasStitch = toolNames.filter((name) =>
    String(name).startsWith("stitch_"),
  ).length;
  if (namespacedPostman > 0 && aliasPostman === 0) {
    throw new Error(
      "Dynamic Postman dotted tools were found but alias tools (postman_*) were not registered",
    );
  }
  if (namespacedStitch > 0 && aliasStitch === 0) {
    throw new Error(
      "Dynamic Stitch dotted tools were found but alias tools (stitch_*) were not registered",
    );
  }

  const routeResolveResult = await callTool({
    endpointUrl: endpoint,
    sessionId,
    name: "route_resolve",
    args: { intent: "/mobile" },
  });
  const routeResolvePayload = parseToolTextPayload(routeResolveResult);
  if (
    routeResolvePayload.resolved !== true ||
    routeResolvePayload.kind !== "workflow" ||
    routeResolvePayload.id !== "mobile"
  ) {
    throw new Error("route_resolve failed explicit workflow resolution");
  }

  const skillCreatorRouteResolveResult = await callTool({
    endpointUrl: endpoint,
    sessionId,
    name: "route_resolve",
    args: { intent: "create a new skill package for Copilot" },
  });
  const skillCreatorRoutePayload = parseToolTextPayload(
    skillCreatorRouteResolveResult,
  );
  if (
    skillCreatorRoutePayload.resolved !== true ||
    skillCreatorRoutePayload.id !== "create" ||
    skillCreatorRoutePayload.primarySkillHint !== "skill-creator"
  ) {
    throw new Error(
      "route_resolve failed skill-creator intent routing",
    );
  }

  const skillCreatorValidateResult = await callTool({
    endpointUrl: endpoint,
    sessionId,
    name: "skill_validate",
    args: { id: "skill-creator" },
  });
  const skillCreatorValidatePayload = parseToolTextPayload(
    skillCreatorValidateResult,
  );
  if (
    skillCreatorValidatePayload.exists !== true ||
    skillCreatorValidatePayload.canonicalId !== "skill-creator"
  ) {
    throw new Error("skill_validate failed for skill-creator");
  }

  const stitchValidateResult = await callTool({
    endpointUrl: endpoint,
    sessionId,
    name: "skill_validate",
    args: { id: "stitch" },
  });
  const stitchValidatePayload = parseToolTextPayload(stitchValidateResult);
  if (
    stitchValidatePayload.exists !== true ||
    stitchValidatePayload.canonicalId !== "stitch-design-orchestrator"
  ) {
    throw new Error("skill_validate failed for explicit named skill stitch");
  }

  const missingSkillValidateResult = await callTool({
    endpointUrl: endpoint,
    sessionId,
    name: "skill_validate",
    args: { id: "missing-skill-id" },
  });
  const missingSkillValidatePayload = parseToolTextPayload(
    missingSkillValidateResult,
  );
  if (
    missingSkillValidatePayload.exists !== false ||
    missingSkillValidatePayload.canonicalId !== null
  ) {
    throw new Error("skill_validate failed clean fallback for unknown skill");
  }

  const researchRouteResolveResult = await callTool({
    endpointUrl: endpoint,
    sessionId,
    name: "route_resolve",
    args: { intent: "research latest Claude Code hooks behavior" },
  });
  const researchRoutePayload = parseToolTextPayload(researchRouteResolveResult);
  if (
    researchRoutePayload.resolved !== true ||
    researchRoutePayload.id !== "researcher" ||
    researchRoutePayload.primarySkillHint !== "deep-research"
  ) {
    throw new Error("route_resolve failed research escalation routing");
  }

  const listCategoriesResult = await callTool({
    endpointUrl: endpoint,
    sessionId,
    name: "skill_list_categories",
    args: {},
  });
  const listCategoriesPayload = parseToolTextPayload(listCategoriesResult);
  const listCategoriesMetrics = listCategoriesResult._meta?.metrics || {};
  assertMetricShape(
    "skill_list_categories",
    listCategoriesResult._meta?.metrics,
  );

  const searchResult = await callTool({
    endpointUrl: endpoint,
    sessionId,
    name: "skill_search",
    args: { query: "skill" },
  });
  const searchMetrics = searchResult._meta?.metrics || {};
  assertMetricShape("skill_search", searchResult._meta?.metrics, [
    "selectedSkillsEstimatedTokens",
  ]);

  const totalSkills = Number(listCategoriesPayload.totalSkills || 0);
  const categories = Array.isArray(listCategoriesPayload.categories)
    ? listCategoriesPayload.categories
    : [];
  let selectedSkillIds = [];
  let loadedSkillIds = [];
  let loadedSkillEstimatedTokens = null;

  if (categories.length > 0) {
    const firstCategory = categories[0]?.category;
    if (firstCategory) {
      const browseResult = await callTool({
        endpointUrl: endpoint,
        sessionId,
        name: "skill_browse_category",
        args: { category: firstCategory },
      });
      const browsePayload = parseToolTextPayload(browseResult);
      assertMetricShape("skill_browse_category", browseResult._meta?.metrics, [
        "selectedSkillsEstimatedTokens",
      ]);
      const skills = Array.isArray(browsePayload.skills)
        ? browsePayload.skills
        : [];
      if (skills.length > 0 && skills[0]?.id) {
        selectedSkillIds = [skills[0].id];
        const skillGetResult = await callTool({
          endpointUrl: endpoint,
          sessionId,
          name: "skill_get",
          args: { id: skills[0].id },
        });
        if (
          !Array.isArray(skillGetResult.content) ||
          typeof skillGetResult.content[0]?.text !== "string"
        ) {
          throw new Error("skill_get did not return full skill text content");
        }
        assertMetricShape("skill_get", skillGetResult._meta?.metrics, [
          "loadedSkillEstimatedTokens",
        ]);
        loadedSkillEstimatedTokens =
          skillGetResult._meta?.metrics?.loadedSkillEstimatedTokens ?? null;
        loadedSkillIds = [skills[0].id];
      }
    }
  }

  const budgetReportResult = await callTool({
    endpointUrl: endpoint,
    sessionId,
    name: "skill_budget_report",
    args: {
      selectedSkillIds,
      loadedSkillIds,
    },
  });
  const budgetReportPayload = parseToolTextPayload(budgetReportResult);
  const contextBudget = budgetReportPayload?.contextBudget;
  const skillLog = budgetReportPayload?.skillLog;
  if (!contextBudget || typeof contextBudget !== "object") {
    throw new Error("skill_budget_report missing contextBudget block");
  }
  if (!skillLog || typeof skillLog !== "object") {
    throw new Error("skill_budget_report missing skillLog block");
  }
  for (const key of [
    "fullCatalogEstimatedTokens",
    "selectedSkillsEstimatedTokens",
    "loadedSkillsEstimatedTokens",
    "estimatedSavingsTokens",
    "estimatedSavingsPercent",
    "estimated",
  ]) {
    if (!(key in contextBudget)) {
      throw new Error(`skill_budget_report.contextBudget missing '${key}'`);
    }
  }

  console.log(`endpoint=${endpoint}`);
  console.log(`sessionId=${sessionId}`);
  console.log(`tools.total=${toolNames.length}`);
  console.log(`route_resolve.kind=${routeResolvePayload.kind}`);
  console.log(`route_resolve.research=${researchRoutePayload.id}`);
  console.log(`tools.postman.namespaced=${namespacedPostman}`);
  console.log(`tools.stitch.namespaced=${namespacedStitch}`);
  console.log(`tools.postman.alias=${aliasPostman}`);
  console.log(`tools.stitch.alias=${aliasStitch}`);
  console.log(`skills.total=${totalSkills}`);
  console.log(`skills.categories=${categories.length}`);
  console.log(`skill_budget_report.estimated=${contextBudget.estimated}`);
  console.log(
    `token.full_catalog=${contextBudget.fullCatalogEstimatedTokens ?? "n/a"}`,
  );
  console.log(
    `token.selected=${contextBudget.selectedSkillsEstimatedTokens ?? "n/a"}`,
  );
  console.log(
    `token.loaded=${contextBudget.loadedSkillsEstimatedTokens ?? "n/a"}`,
  );
  console.log(`token.savings=${contextBudget.estimatedSavingsTokens ?? "n/a"}`);
  console.log(
    `token.savings_percent=${contextBudget.estimatedSavingsPercent ?? "n/a"}`,
  );
  console.log(
    `token.list.response=${listCategoriesMetrics.responseEstimatedTokens ?? "n/a"}`,
  );
  console.log(
    `token.search.response=${searchMetrics.responseEstimatedTokens ?? "n/a"}`,
  );
  console.log(
    `token.search.selected=${searchMetrics.selectedSkillsEstimatedTokens ?? "n/a"}`,
  );
  console.log(`token.get.loaded=${loadedSkillEstimatedTokens ?? "n/a"}`);

  // ── Wire usage summary ───────────────────────────────
  const wireTotalBytes = wireRequestBytes + wireResponseBytes;
  const wireTokensEstimate = Math.round(wireTotalBytes / CHARS_PER_TOKEN);
  const fmt = (n) => n.toLocaleString("en-US");
  console.log(`wire.requests=${wireRequestCount}`);
  console.log(`wire.requestBytes=${wireRequestBytes}`);
  console.log(`wire.responseBytes=${wireResponseBytes}`);
  console.log(`wire.totalBytes=${wireTotalBytes}`);
  console.log(`wire.estimatedTokens=${wireTokensEstimate}`);
  console.log(
    `wire.summary: ${wireRequestCount} requests, ${fmt(wireTotalBytes)} characters (token usage: ~${fmt(wireTokensEstimate)} tokens)`,
  );
}

main().catch((error) => {
  console.error(`MCP HTTP smoke failed: ${error.message}`);
  process.exit(1);
});
