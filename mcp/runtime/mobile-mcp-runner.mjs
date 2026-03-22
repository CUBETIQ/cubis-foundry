import path from "node:path";
import process from "node:process";
import { mkdir, writeFile } from "node:fs/promises";
import {
  connectStdioClient,
  listToolNames,
  resolveToolName,
  callToolParsed,
} from "./mcp-client.mjs";
import { readEffectiveConfig, writeJson } from "./qa-common.mjs";

const TOOL_CANDIDATES = {
  listDevices: ["list_devices", "devices_list"],
  startEmulator: ["start_emulator", "launch_emulator"],
  screenshot: ["screenshot", "take_screenshot"],
  uiTree: ["get_ui_tree", "ui_tree", "dump_ui_tree"],
  waitFor: ["wait_for_element", "wait_element"],
  tapElement: ["tap_and_wait", "tap_element"],
  typeText: ["type_text", "input_text"],
  logs: ["get_logs", "logs", "logcat"],
  clearLogs: ["clear_logs", "logcat_clear"],
  deviceInfo: ["get_device_info", "device_info"],
  currentActivity: ["get_current_activity", "current_activity"],
  installApp: ["install_app", "install_apk"],
  launchApp: ["launch_app", "open_app", "start_app"],
};

function resolveAndroidConfig(configValue) {
  const section =
    configValue && typeof configValue.android === "object" && !Array.isArray(configValue.android)
      ? configValue.android
      : {};
  const enabled = Boolean(section.enabled ?? configValue?.android);
  const command = String(section.command || "npx").trim();
  const packageSpec = String(section.package || "android-mcp-server@1.3.0").trim();
  const args = Array.isArray(section.args)
    ? section.args.map((value) => String(value).trim()).filter(Boolean)
    : ["-y", packageSpec];
  const env =
    section.env && typeof section.env === "object" && !Array.isArray(section.env)
      ? Object.fromEntries(
          Object.entries(section.env)
            .map(([key, value]) => [key, String(value || "").trim()])
            .filter(([, value]) => Boolean(value)),
        )
      : {};

  return {
    enabled,
    command,
    args: args.length > 0 ? args : ["-y", packageSpec],
    cwd: section.cwd ? String(section.cwd).trim() : null,
    env,
  };
}

function buildLocatorArgs(step) {
  const selector = step.selector || step.locator || step.resource_id || step.resourceId || step.id;
  const text = step.text || step.label || step.description || step.name;
  const args = {};
  if (selector) {
    args.selector = selector;
    args.locator = selector;
    args.resourceId = selector;
    args.resource_id = selector;
    args.id = selector;
  }
  if (text) {
    args.text = text;
    args.label = text;
    args.description = text;
    args.contentDescription = text;
  }
  if (step.timeout_ms) args.timeout = step.timeout_ms;
  if (step.timeout) args.timeout = step.timeout;
  return args;
}

function buildTypeArgs(step) {
  const value = step.value || step.input || step.text || "";
  return {
    ...buildLocatorArgs(step),
    value,
    text: value,
  };
}

async function persistResult(baseFilePath, result) {
  const image = Array.isArray(result.raw?.content)
    ? result.raw.content.find(
        (item) => item && item.type === "image" && typeof item.data === "string",
      )
    : null;
  if (image) {
    const extension = String(image.mimeType || "image/png").includes("jpeg") ? ".jpg" : ".png";
    const imagePath = `${baseFilePath}${extension}`;
    await writeFile(imagePath, Buffer.from(image.data, "base64"));
    return imagePath;
  }
  if (result.parsed.json !== null) {
    const outputPath = `${baseFilePath}.json`;
    await writeJson(outputPath, result.parsed.json);
    return outputPath;
  }
  const text = result.parsed.text || "";
  const outputPath = `${baseFilePath}.txt`;
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${text}\n`, "utf8");
  return outputPath;
}

async function callResolvedTool(client, tools, candidates, argsVariants) {
  const toolName = resolveToolName(tools, candidates);
  if (!toolName) {
    throw new Error(`Missing required Android MCP capability: ${candidates[0]}`);
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

async function callOptionalTool(client, tools, candidates, argsVariants) {
  const toolName = resolveToolName(tools, candidates);
  if (!toolName) return null;
  return callResolvedTool(client, tools, candidates, argsVariants);
}

function extractDevices(result) {
  const payload = result?.parsed?.json;
  const keys = ["devices", "items", "results"];
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

export async function runAndroidMcpSession({ args, charter, directories }) {
  const effective = await readEffectiveConfig(args.scope || "auto");
  const androidConfig = resolveAndroidConfig(effective?.config || {});
  if (!androidConfig.enabled) {
    throw new Error("Android MCP is not enabled in cbx_config.json.");
  }

  const client = await connectStdioClient({
    name: "foundry-mobile-qa",
    command: androidConfig.command,
    args: androidConfig.args,
    env: { ...process.env, ...androidConfig.env },
    cwd: androidConfig.cwd || process.cwd(),
  });

  try {
    const tools = await listToolNames(client);
    if (tools.length === 0) {
      throw new Error("Android MCP returned no tools.");
    }

    const listedDevices = await callResolvedTool(client, tools, TOOL_CANDIDATES.listDevices, [{}]);
    let devices = extractDevices(listedDevices);
    if ((!Array.isArray(devices) || devices.length === 0) && args.avd) {
      await callOptionalTool(client, tools, TOOL_CANDIDATES.startEmulator, [
        { avdName: args.avd },
        { name: args.avd },
      ]);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      devices = extractDevices(
        await callResolvedTool(client, tools, TOOL_CANDIDATES.listDevices, [{}]),
      );
    }
    if (!Array.isArray(devices) || devices.length === 0) {
      throw new Error("No Android devices or emulators are visible to Android MCP.");
    }

    const deviceInfo = await callOptionalTool(client, tools, TOOL_CANDIDATES.deviceInfo, [{}]);
    if (deviceInfo) {
      await persistResult(path.join(directories.logs, "000-device-info"), deviceInfo);
    }
    const clearedLogs = await callOptionalTool(client, tools, TOOL_CANDIDATES.clearLogs, [{}]);
    if (clearedLogs) {
      await persistResult(path.join(directories.logs, "001-clear-logs"), clearedLogs);
    }

    if (args.apk) {
      const installed = await callOptionalTool(client, tools, TOOL_CANDIDATES.installApp, [
        { apkPath: args.apk },
        { path: args.apk },
      ]);
      if (!installed) {
        throw new Error("Android MCP cannot install APKs with the configured tool catalog.");
      }
      await persistResult(path.join(directories.logs, "002-install"), installed);
    }

    const packageId = args.packageId || charter.package;
    const launchActivity = charter.launch_activity || null;
    const launched = await callOptionalTool(client, tools, TOOL_CANDIDATES.launchApp, [
      { package: packageId, activity: launchActivity },
      { packageName: packageId, activity: launchActivity },
      { package: packageId },
      { packageName: packageId },
    ]);
    if (!launched && (args.apk || packageId || launchActivity)) {
      throw new Error("Android MCP cannot launch the target app with the configured tool catalog.");
    }
    if (launched) {
      await persistResult(path.join(directories.logs, "003-launch"), launched);
    }

    const baselineScreenshot = await callOptionalTool(client, tools, TOOL_CANDIDATES.screenshot, [{}]);
    const baselineUiTree = await callOptionalTool(client, tools, TOOL_CANDIDATES.uiTree, [{}]);
    const baselineScreenshotPath = baselineScreenshot
      ? await persistResult(path.join(directories.screenshots, "000-baseline"), baselineScreenshot)
      : null;
    const baselineUiTreePath = baselineUiTree
      ? await persistResult(path.join(directories.uiTree, "000-baseline"), baselineUiTree)
      : null;
    const currentActivity = await callOptionalTool(client, tools, TOOL_CANDIDATES.currentActivity, [{}]);
    if (currentActivity) {
      await persistResult(path.join(directories.logs, "004-current-activity"), currentActivity);
    }

    const stepResults = [];
    for (const [index, step] of charter.steps.entries()) {
      const action = String(step.action || step.verb || "").trim();
      const baseName = `${String(index + 1).padStart(3, "0")}-${String(step.name || step.selector || step.text || action).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `step-${index + 1}`}`;
      let call = null;
      if (action === "wait_for_element" || action === "assert_visible") {
        call = await callResolvedTool(client, tools, TOOL_CANDIDATES.waitFor, [buildLocatorArgs(step)]);
      } else if (action === "tap_element") {
        call = await callResolvedTool(client, tools, TOOL_CANDIDATES.tapElement, [buildLocatorArgs(step)]);
      } else if (action === "type_text") {
        call = await callResolvedTool(client, tools, TOOL_CANDIDATES.typeText, [buildTypeArgs(step)]);
      } else if (action === "screenshot") {
        call = await callResolvedTool(client, tools, TOOL_CANDIDATES.screenshot, [{}]);
      } else if (action === "capture_ui_tree" || action === "assert_text") {
        call = await callResolvedTool(client, tools, TOOL_CANDIDATES.uiTree, [{}]);
        if (action === "assert_text") {
          const expected = String(step.expected || step.text || "").trim().toLowerCase();
          const actual = String(call.parsed.text || JSON.stringify(call.parsed.json || {}, null, 2)).toLowerCase();
          if (!actual.includes(expected)) {
            throw new Error(`Expected text '${expected}' was not present in the UI tree.`);
          }
        }
      } else if (action === "capture_logs") {
        call = await callResolvedTool(client, tools, TOOL_CANDIDATES.logs, [{ package: packageId }, {}]);
      } else {
        throw new Error(`Unsupported mobile QA action '${action}'.`);
      }
      const artifactRoot =
        action === "screenshot"
          ? directories.screenshots
          : action === "capture_logs"
            ? directories.logs
            : directories.uiTree;
      const artifact = await persistResult(path.join(artifactRoot, baseName), call);
      stepResults.push({
        index,
        action,
        tool: call.toolName,
        status: "success",
        artifact,
      });
    }

    const finalLogs = await callOptionalTool(client, tools, TOOL_CANDIDATES.logs, [{ package: packageId }, {}]);
    const finalLogsPath = finalLogs
      ? await persistResult(path.join(directories.logs, "999-final-logs"), finalLogs)
      : null;

    return {
      status: "success",
      providerUsed: "android-mcp",
      preflight: {
        visibleDevices: devices.length,
        deviceInfo: deviceInfo?.parsed?.json || deviceInfo?.parsed?.text || null,
        currentActivity: currentActivity?.parsed?.json || currentActivity?.parsed?.text || null,
      },
      stepResults,
      artifacts: {
        root: directories.root,
        screenshotsDir: directories.screenshots,
        logsDir: directories.logs,
        uiTreeDir: directories.uiTree,
        baselineScreenshot: baselineScreenshotPath,
        baselineUiTree: baselineUiTreePath,
        finalLogs: finalLogsPath,
      },
    };
  } finally {
    await client.close();
  }
}
