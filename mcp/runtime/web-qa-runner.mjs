#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { mkdir, writeFile } from "node:fs/promises";
import {
  connectHttpClient,
  listToolNames,
  resolveToolName,
  callToolParsed,
} from "./mcp-client.mjs";
import {
  ensureArtifactDirs,
  loadCharter,
  readEffectiveConfig,
  writeJson,
} from "./qa-common.mjs";

const SUPPORTED_STEP_ACTIONS = new Set([
  "goto",
  "wait_for_element",
  "click_element",
  "type_text",
  "assert_visible",
  "assert_text",
  "screenshot",
  "capture_dom",
  "capture_console",
  "capture_network",
  "capture_accessibility",
]);

const TOOL_CANDIDATES = {
  goto: ["browser_navigate", "navigate", "goto", "goto_page"],
  waitFor: ["browser_wait_for", "wait_for", "wait_for_element"],
  click: ["browser_click", "click", "click_element"],
  type: ["browser_type", "type", "fill", "type_text"],
  screenshot: ["browser_take_screenshot", "take_screenshot", "screenshot"],
  snapshot: ["browser_snapshot", "snapshot", "capture_dom", "get_dom"],
  console: ["browser_console_messages", "console_messages", "get_console_messages"],
  network: ["browser_network_requests", "network_requests", "get_network_requests"],
  accessibility: [
    "browser_accessibility_snapshot",
    "accessibility_snapshot",
    "capture_accessibility",
    "browser_snapshot",
  ],
};

function parseArgs(argv) {
  const args = {
    charter: null,
    artifactsDir: path.resolve("artifacts", "web-qa"),
    scope: "auto",
    dryRun: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--charter" && argv[index + 1]) {
      args.charter = path.resolve(argv[++index]);
    } else if (arg === "--artifacts-dir" && argv[index + 1]) {
      args.artifactsDir = path.resolve(argv[++index]);
    } else if (arg === "--scope" && argv[index + 1]) {
      args.scope = argv[++index];
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    }
  }

  if (!args.charter) {
    throw new Error("Missing required --charter <path>.");
  }

  return args;
}

function validateCharter(charter) {
  if (!charter.flow || !String(charter.flow).trim()) {
    throw new Error("Charter field 'flow' is required.");
  }
  if (!charter.success_criteria || !String(charter.success_criteria).trim()) {
    throw new Error("Charter field 'success_criteria' is required.");
  }
  if (!charter.base_url || !String(charter.base_url).trim()) {
    throw new Error("Charter field 'base_url' is required.");
  }
  if (!Array.isArray(charter.steps) || charter.steps.length === 0) {
    throw new Error("Charter field 'steps' must contain at least one step.");
  }
  for (const [index, step] of charter.steps.entries()) {
    const action = String(step.action || step.verb || "").trim();
    if (!SUPPORTED_STEP_ACTIONS.has(action)) {
      throw new Error(
        `Unsupported step action at index ${index}: '${action}'. Supported actions: ${[...SUPPORTED_STEP_ACTIONS].join(", ")}.`,
      );
    }
  }
}

function slugify(value, fallback = "step") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function buildUrl(baseUrl, startPath) {
  const base = String(baseUrl || "").trim();
  const extra = String(startPath || "").trim();
  if (!extra) return base;
  return new URL(extra, base).toString();
}

function buildLocatorArgs(step) {
  const selector =
    step.selector || step.locator || step.test_id || step.testId || step.css;
  const text = step.text || step.label || step.name;
  const args = {};
  if (selector) {
    args.selector = selector;
    args.locator = selector;
    args.testId = selector;
    args.test_id = selector;
  }
  if (text) {
    args.text = text;
    args.name = text;
    args.label = text;
  }
  if (step.role) args.role = step.role;
  if (step.placeholder) args.placeholder = step.placeholder;
  if (step.timeout_ms) args.timeout = step.timeout_ms;
  if (step.timeout) args.timeout = step.timeout;
  return args;
}

function buildTypeArgs(step) {
  const value = step.value || step.input || step.text || "";
  return {
    ...buildLocatorArgs(step),
    text: value,
    value,
  };
}

function collectText(raw) {
  if (!raw || !Array.isArray(raw.content)) return "";
  return raw.content
    .filter((item) => item && item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

async function persistRawArtifact(baseFilePath, result) {
  const image = Array.isArray(result.raw?.content)
    ? result.raw.content.find(
        (item) => item && item.type === "image" && typeof item.data === "string",
      )
    : null;
  if (image) {
    const mimeType = String(image.mimeType || "image/png").toLowerCase();
    const extension = mimeType.includes("jpeg") ? ".jpg" : ".png";
    const imagePath = `${baseFilePath}${extension}`;
    await writeFile(imagePath, Buffer.from(image.data, "base64"));
    return imagePath;
  }

  if (result.parsed.json !== null) {
    const jsonPath = `${baseFilePath}.json`;
    await writeJson(jsonPath, result.parsed.json);
    return jsonPath;
  }

  const text = result.parsed.text || collectText(result.raw);
  const textPath = `${baseFilePath}.txt`;
  await mkdir(path.dirname(textPath), { recursive: true });
  await writeFile(textPath, `${text}\n`, "utf8");
  return textPath;
}

async function callResolvedTool(client, tools, candidates, argsVariants) {
  const toolName = resolveToolName(tools, candidates);
  if (!toolName) {
    throw new Error(`Missing required Playwright MCP capability: ${candidates[0]}`);
  }

  let lastError = null;
  for (const args of argsVariants) {
    try {
      const result = await callToolParsed(client, toolName, args);
      return { toolName, ...result };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`Failed to call ${toolName}.`);
}

function assertTextContains(haystack, needle, label) {
  if (!haystack.toLowerCase().includes(String(needle || "").trim().toLowerCase())) {
    throw new Error(`${label} did not contain expected text '${needle}'.`);
  }
}

async function executeStep(client, tools, directories, step, index) {
  const action = String(step.action || step.verb || "").trim();
  const slug = slugify(step.name || step.selector || step.text || action, `step-${index + 1}`);
  const baseFileName = `${String(index + 1).padStart(3, "0")}-${slug}`;

  if (action === "goto") {
    const url = step.url || step.href;
    const call = await callResolvedTool(client, tools, TOOL_CANDIDATES.goto, [
      { url },
      { target: url },
      { pageUrl: url },
    ]);
    return {
      index,
      action,
      tool: call.toolName,
      status: "success",
      artifact: null,
    };
  }

  if (action === "wait_for_element") {
    const call = await callResolvedTool(client, tools, TOOL_CANDIDATES.waitFor, [
      buildLocatorArgs(step),
    ]);
    return { index, action, tool: call.toolName, status: "success", artifact: null };
  }

  if (action === "click_element") {
    const call = await callResolvedTool(client, tools, TOOL_CANDIDATES.click, [
      buildLocatorArgs(step),
    ]);
    return { index, action, tool: call.toolName, status: "success", artifact: null };
  }

  if (action === "type_text") {
    const call = await callResolvedTool(client, tools, TOOL_CANDIDATES.type, [
      buildTypeArgs(step),
    ]);
    return { index, action, tool: call.toolName, status: "success", artifact: null };
  }

  if (action === "assert_visible") {
    if (step.selector || step.locator || step.test_id || step.testId || step.css) {
      const call = await callResolvedTool(client, tools, TOOL_CANDIDATES.waitFor, [
        buildLocatorArgs(step),
      ]);
      return { index, action, tool: call.toolName, status: "success", artifact: null };
    }
    const call = await callResolvedTool(client, tools, TOOL_CANDIDATES.snapshot, [{}, { format: "text" }]);
    const snapshotText = call.parsed.text || JSON.stringify(call.parsed.json || {}, null, 2);
    assertTextContains(snapshotText, step.text || step.expected, "DOM snapshot");
    const artifact = await persistRawArtifact(
      path.join(directories.dom, baseFileName),
      call,
    );
    return { index, action, tool: call.toolName, status: "success", artifact };
  }

  if (action === "assert_text") {
    const call = await callResolvedTool(client, tools, TOOL_CANDIDATES.snapshot, [{}, { format: "text" }]);
    const expected = step.expected || step.text || step.value;
    const snapshotText = call.parsed.text || JSON.stringify(call.parsed.json || {}, null, 2);
    assertTextContains(snapshotText, expected, "DOM snapshot");
    const artifact = await persistRawArtifact(
      path.join(directories.dom, baseFileName),
      call,
    );
    return { index, action, tool: call.toolName, status: "success", artifact };
  }

  if (action === "screenshot") {
    const call = await callResolvedTool(client, tools, TOOL_CANDIDATES.screenshot, [
      {},
      { fullPage: true },
    ]);
    const artifact = await persistRawArtifact(
      path.join(directories.screenshots, baseFileName),
      call,
    );
    return { index, action, tool: call.toolName, status: "success", artifact };
  }

  if (action === "capture_dom") {
    const call = await callResolvedTool(client, tools, TOOL_CANDIDATES.snapshot, [{}, { format: "text" }]);
    const artifact = await persistRawArtifact(path.join(directories.dom, baseFileName), call);
    return { index, action, tool: call.toolName, status: "success", artifact };
  }

  if (action === "capture_console") {
    const call = await callResolvedTool(client, tools, TOOL_CANDIDATES.console, [{}, { limit: 200 }]);
    const artifact = await persistRawArtifact(path.join(directories.console, baseFileName), call);
    return { index, action, tool: call.toolName, status: "success", artifact };
  }

  if (action === "capture_network") {
    const call = await callResolvedTool(client, tools, TOOL_CANDIDATES.network, [{}, { limit: 200 }]);
    const artifact = await persistRawArtifact(path.join(directories.network, baseFileName), call);
    return { index, action, tool: call.toolName, status: "success", artifact };
  }

  if (action === "capture_accessibility") {
    const call = await callResolvedTool(client, tools, TOOL_CANDIDATES.accessibility, [{}, { interestingOnly: false }]);
    const artifact = await persistRawArtifact(path.join(directories.accessibility, baseFileName), call);
    return { index, action, tool: call.toolName, status: "success", artifact };
  }

  throw new Error(`Unsupported step action '${action}'.`);
}

function resolvePlaywrightConfig(configValue) {
  const section = configValue && typeof configValue.playwright === "object" && !Array.isArray(configValue.playwright)
    ? configValue.playwright
    : {};
  const portRaw = Number(section.port || process.env.PLAYWRIGHT_MCP_PORT || 8931);
  const port = Number.isFinite(portRaw) && portRaw > 0 && portRaw < 65536 ? portRaw : 8931;
  return {
    mcpUrl: String(section.mcpUrl || `http://localhost:${port}/mcp`).trim(),
  };
}

async function runWebQa(args, charter, directories) {
  const effective = await readEffectiveConfig(args.scope);
  const playwright = resolvePlaywrightConfig(effective?.config || {});
  const client = await connectHttpClient({
    name: "foundry-web-qa",
    mcpUrl: playwright.mcpUrl,
  });

  try {
    const tools = await listToolNames(client);
    if (tools.length === 0) {
      throw new Error("Playwright MCP returned no tools.");
    }

    const startUrl = buildUrl(charter.base_url, charter.start_path);
    await executeStep(
      client,
      tools,
      directories,
      { action: "goto", url: startUrl, name: "initial-navigation" },
      -1,
    );

    const stepResults = [];
    for (const [index, step] of charter.steps.entries()) {
      stepResults.push(await executeStep(client, tools, directories, step, index));
    }

    return {
      status: "success",
      providerUsed: "playwright-mcp",
      mcpUrl: playwright.mcpUrl,
      stepResults,
      artifacts: {
        root: directories.root,
        screenshotsDir: directories.screenshots,
        domDir: directories.dom,
        consoleDir: directories.console,
        networkDir: directories.network,
        accessibilityDir: directories.accessibility,
      },
    };
  } finally {
    await client.close();
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const charter = await loadCharter(args.charter);
  validateCharter(charter);
  const directories = await ensureArtifactDirs(args.artifactsDir, [
    "screenshots",
    "dom",
    "console",
    "network",
    "accessibility",
  ]);
  const reportPath = path.join(directories.root, "report.json");

  if (args.dryRun) {
    const result = {
      status: "dry_run",
      providerUsed: "playwright-mcp",
      flow: charter.flow,
      baseUrl: charter.base_url,
      startUrl: buildUrl(charter.base_url, charter.start_path),
      artifacts: {
        root: directories.root,
        screenshotsDir: directories.screenshots,
        domDir: directories.dom,
        consoleDir: directories.console,
        networkDir: directories.network,
        accessibilityDir: directories.accessibility,
      },
      charterSummary: {
        flow: charter.flow,
        successCriteria: charter.success_criteria,
        steps: charter.steps.map((step) => ({
          action: step.action || step.verb,
          selector: step.selector || step.locator || step.text || null,
        })),
      },
      reportPath,
    };
    await writeJson(reportPath, result);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  const attempts = [];
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const execution = await runWebQa(args, charter, directories);
      const result = {
        ...execution,
        flow: charter.flow,
        successCriteria: charter.success_criteria,
        attempts,
        reportPath,
      };
      await writeJson(reportPath, result);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return;
    } catch (error) {
      lastError = error;
      const failureLog = path.join(
        directories.console,
        `attempt-${attempt}-failure.txt`,
      );
      await writeFile(failureLog, `${String(error)}\n`, "utf8");
      attempts.push({
        attempt,
        status: attempt === 1 ? "retrying" : "failed",
        error: String(error),
        evidenceLog: failureLog,
      });
    }
  }

  const failedResult = {
    status: "failed",
    providerUsed: "playwright-mcp",
    flow: charter.flow,
    successCriteria: charter.success_criteria,
    attempts,
    error: String(lastError),
    artifacts: {
      root: directories.root,
      screenshotsDir: directories.screenshots,
      domDir: directories.dom,
      consoleDir: directories.console,
      networkDir: directories.network,
      accessibilityDir: directories.accessibility,
    },
    reportPath,
  };
  await writeJson(reportPath, failedResult);
  process.stdout.write(`${JSON.stringify(failedResult, null, 2)}\n`);
}

main().catch(async (error) => {
  const failure = {
    status: "failed",
    providerUsed: "playwright-mcp",
    error: String(error),
  };
  process.stdout.write(`${JSON.stringify(failure, null, 2)}\n`);
  process.exit(1);
});
