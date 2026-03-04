#!/usr/bin/env node

/**
 * Minimal MCP Streamable HTTP smoke check.
 *
 * Verifies:
 * 1) initialize handshake works
 * 2) notifications/initialized accepted
 * 3) tools/list returns expected built-in tools
 * 4) skill tools expose telemetry metrics in structuredContent
 * 5) skill_budget_report returns consolidated skill log + context budget
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
    throw new Error(`Tool ${name} returned isError=true`);
  }
  return result;
}

function assertMetricShape(name, metrics, extraKeys = []) {
  if (!metrics || typeof metrics !== "object") {
    throw new Error(`${name} did not return structuredContent.metrics`);
  }
  const required = [
    "estimatorVersion",
    "charsPerToken",
    "fullCatalogEstimatedTokens",
    "responseEstimatedTokens",
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
    "skill_list_categories",
    "skill_browse_category",
    "skill_search",
    "skill_get",
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

  const listCategoriesResult = await callTool({
    endpointUrl: endpoint,
    sessionId,
    name: "skill_list_categories",
    args: {},
  });
  const listCategoriesPayload = parseToolTextPayload(listCategoriesResult);
  const listCategoriesMetrics = listCategoriesResult.structuredContent?.metrics || {};
  assertMetricShape(
    "skill_list_categories",
    listCategoriesResult.structuredContent?.metrics,
  );

  const searchResult = await callTool({
    endpointUrl: endpoint,
    sessionId,
    name: "skill_search",
    args: { query: "skill" },
  });
  const searchMetrics = searchResult.structuredContent?.metrics || {};
  assertMetricShape(
    "skill_search",
    searchResult.structuredContent?.metrics,
    ["selectedSkillsEstimatedTokens"],
  );

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
      assertMetricShape(
        "skill_browse_category",
        browseResult.structuredContent?.metrics,
        ["selectedSkillsEstimatedTokens"],
      );
      const skills = Array.isArray(browsePayload.skills) ? browsePayload.skills : [];
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
        assertMetricShape(
          "skill_get",
          skillGetResult.structuredContent?.metrics,
          ["loadedSkillEstimatedTokens"],
        );
        loadedSkillEstimatedTokens =
          skillGetResult.structuredContent?.metrics?.loadedSkillEstimatedTokens ?? null;
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
  console.log(`tools.postman.namespaced=${namespacedPostman}`);
  console.log(`tools.stitch.namespaced=${namespacedStitch}`);
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
  console.log(
    `token.savings=${contextBudget.estimatedSavingsTokens ?? "n/a"}`,
  );
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
}

main().catch((error) => {
  console.error(`MCP HTTP smoke failed: ${error.message}`);
  process.exit(1);
});
