#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile as execFileCallback } from "node:child_process";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { runAndroidMcpSession } from "./mobile-mcp-runner.mjs";

const execFile = promisify(execFileCallback);
const SUPPORTED_STEP_ACTIONS = new Set([
  "wait_for_element",
  "tap_element",
  "type_text",
  "assert_visible",
  "assert_text",
  "screenshot",
  "capture_ui_tree",
  "capture_logs",
]);

function parseArgs(argv) {
  const args = {
    charter: null,
    apk: null,
    packageId: null,
    avd: null,
    artifactsDir: path.resolve("artifacts", "mobile-qa"),
    scope: "auto",
    allowAdbFallback: false,
    dryRun: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--charter" && argv[index + 1]) {
      args.charter = path.resolve(argv[++index]);
    } else if (arg === "--apk" && argv[index + 1]) {
      args.apk = path.resolve(argv[++index]);
    } else if (arg === "--package" && argv[index + 1]) {
      args.packageId = argv[++index];
    } else if (arg === "--avd" && argv[index + 1]) {
      args.avd = argv[++index];
    } else if (arg === "--artifacts-dir" && argv[index + 1]) {
      args.artifactsDir = path.resolve(argv[++index]);
    } else if (arg === "--scope" && argv[index + 1]) {
      args.scope = argv[++index];
    } else if (arg === "--allow-adb-fallback") {
      args.allowAdbFallback = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    }
  }

  if (!args.charter) {
    throw new Error("Missing required --charter <path>.");
  }

  return args;
}

function splitTopLevelItems(value) {
  const items = [];
  let current = [];
  let braceDepth = 0;
  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      current.push(line);
      continue;
    }
    const startsItem = /^- /.test(trimmed) && braceDepth === 0;
    if (startsItem && current.length > 0) {
      items.push(current.join("\n"));
      current = [line];
    } else {
      current.push(line);
    }
    if (trimmed.includes("[") || trimmed.includes("{")) {
      braceDepth += 1;
    }
    if (trimmed.includes("]") || trimmed.includes("}")) {
      braceDepth = Math.max(0, braceDepth - 1);
    }
  }
  if (current.length > 0) {
    items.push(current.join("\n"));
  }
  return items.filter((item) => item.trim());
}

function stripQuotes(value) {
  return String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

function parseScalar(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10);
  return stripQuotes(trimmed);
}

function parseSimpleYaml(content) {
  const lines = content.replace(/\t/g, "  ").split(/\r?\n/);
  const result = {};
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.replace(/\s+#.*$/, "");
    const trimmed = line.trim();
    if (!trimmed) {
      index += 1;
      continue;
    }
    const keyMatch = /^([A-Za-z0-9_]+):(?:\s*(.*))?$/.exec(trimmed);
    if (!keyMatch) {
      index += 1;
      continue;
    }
    const [, key, inlineValue] = keyMatch;
    if (inlineValue) {
      result[key] = parseScalar(inlineValue);
      index += 1;
      continue;
    }

    const childLines = [];
    index += 1;
    while (index < lines.length) {
      const candidate = lines[index];
      if (!candidate.trim()) {
        childLines.push(candidate);
        index += 1;
        continue;
      }
      const indent = candidate.match(/^ */)?.[0]?.length ?? 0;
      if (indent < 2) {
        break;
      }
      childLines.push(candidate.slice(2));
      index += 1;
    }

    if (childLines.some((lineText) => lineText.trim().startsWith("- "))) {
      const items = splitTopLevelItems(childLines.join("\n"));
      result[key] = items.map((item) => {
        const normalized = item
          .split(/\r?\n/)
          .map((lineText) =>
            lineText.trim().startsWith("- ")
              ? lineText.replace(/^\s*-\s*/, "")
              : lineText,
          )
          .join("\n");
        if (!normalized.includes(":")) {
          return parseScalar(normalized);
        }
        const object = {};
        for (const itemLine of normalized.split(/\r?\n/)) {
          const trimmedItemLine = itemLine.trim();
          if (!trimmedItemLine) continue;
          const itemMatch = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(trimmedItemLine);
          if (!itemMatch) continue;
          object[itemMatch[1]] = parseScalar(itemMatch[2]);
        }
        return object;
      });
    } else {
      result[key] = childLines.map((lineText) => stripQuotes(lineText.trim())).join("\n");
    }
  }

  return result;
}

function validateCharter(charter) {
  if (!charter.flow || !String(charter.flow).trim()) {
    throw new Error("Charter field 'flow' is required.");
  }
  if (!charter.package || !String(charter.package).trim()) {
    throw new Error("Charter field 'package' is required.");
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

function resolveAdbPath() {
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  const candidates = [];
  if (androidHome) {
    const executable = process.platform === "win32" ? "adb.exe" : "adb";
    candidates.push(path.join(androidHome, "platform-tools", executable));
  }
  candidates.push("adb");
  const existing = candidates.find((candidate) =>
    candidate === "adb" ? true : existsSync(candidate),
  );
  return existing || "adb";
}

async function runAdb(adbPath, serial, args, options = {}) {
  const fullArgs = serial ? ["-s", serial, ...args] : [...args];
  return execFile(adbPath, fullArgs, {
    cwd: options.cwd || process.cwd(),
    timeout: options.timeout ?? 30000,
    maxBuffer: 20 * 1024 * 1024,
  });
}

async function listDevices(adbPath) {
  const { stdout } = await runAdb(adbPath, null, ["devices"]);
  return String(stdout || "")
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [serial, state] = line.split(/\s+/);
      return { serial, state };
    })
    .filter((device) => device.state === "device");
}

async function readAvdName(adbPath, serial) {
  try {
    const { stdout } = await runAdb(adbPath, serial, ["emu", "avd", "name"], {
      timeout: 5000,
    });
    return String(stdout || "").trim() || null;
  } catch {
    return null;
  }
}

async function resolveTargetDevice(adbPath, requestedAvd) {
  const devices = await listDevices(adbPath);
  if (devices.length === 0) {
    throw new Error("No Android devices or emulators are visible to adb.");
  }
  if (!requestedAvd) {
    return devices[0].serial;
  }
  for (const device of devices) {
    const avdName = await readAvdName(adbPath, device.serial);
    if (avdName === requestedAvd) {
      return device.serial;
    }
  }
  throw new Error(`No connected emulator matched AVD '${requestedAvd}'.`);
}

async function waitForBootComplete(adbPath, serial) {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const { stdout } = await runAdb(adbPath, serial, [
      "shell",
      "getprop",
      "sys.boot_completed",
    ]);
    if (String(stdout || "").trim() === "1") {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}

async function ensureInstallReady(adbPath, serial) {
  const { stdout } = await runAdb(adbPath, serial, [
    "shell",
    "pm",
    "path",
    "android",
  ]);
  return String(stdout || "").includes("package:");
}

async function captureDataUsage(adbPath, serial) {
  const { stdout } = await runAdb(adbPath, serial, ["shell", "df", "/data"]);
  return String(stdout || "").trim();
}

async function ensureArtifactDirs(rootDir) {
  const directories = {
    root: rootDir,
    screenshots: path.join(rootDir, "screenshots"),
    logs: path.join(rootDir, "logs"),
    uiTree: path.join(rootDir, "ui-tree"),
  };
  await mkdir(directories.screenshots, { recursive: true });
  await mkdir(directories.logs, { recursive: true });
  await mkdir(directories.uiTree, { recursive: true });
  return directories;
}

async function captureScreenshot(adbPath, serial, outputPath) {
  const { stdout } = await runAdb(adbPath, serial, ["exec-out", "screencap", "-p"], {
    timeout: 30000,
  });
  await writeFile(outputPath, stdout);
  return outputPath;
}

async function captureUiTree(adbPath, serial, outputPath) {
  await runAdb(adbPath, serial, ["shell", "uiautomator", "dump", "/sdcard/uidump.xml"], {
    timeout: 30000,
  });
  const { stdout } = await runAdb(adbPath, serial, ["exec-out", "cat", "/sdcard/uidump.xml"], {
    timeout: 30000,
  });
  const xml = String(stdout || "");
  await writeFile(outputPath, xml, "utf8");
  return xml;
}

async function captureLogs(adbPath, serial, outputPath) {
  const { stdout, stderr } = await runAdb(adbPath, serial, ["logcat", "-d"], {
    timeout: 30000,
  });
  const logText = `${stdout || ""}${stderr || ""}`;
  await writeFile(outputPath, logText, "utf8");
  return outputPath;
}

function parseBounds(bounds) {
  const match = /^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/.exec(String(bounds || "").trim());
  if (!match) return null;
  const [, left, top, right, bottom] = match;
  return {
    left: Number.parseInt(left, 10),
    top: Number.parseInt(top, 10),
    right: Number.parseInt(right, 10),
    bottom: Number.parseInt(bottom, 10),
  };
}

function parseUiNodes(xml) {
  const nodes = [];
  const nodeRegex = /<node\b([^>]+?)\/>/g;
  let match;
  while ((match = nodeRegex.exec(xml))) {
    const attrs = {};
    const attrRegex = /([A-Za-z0-9:_-]+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(match[1]))) {
      attrs[attrMatch[1]] = attrMatch[2];
    }
    nodes.push(attrs);
  }
  return nodes;
}

function matchNode(nodes, step) {
  const selector = String(
    step.selector || step.resource_id || step.text || step.content_desc || "",
  )
    .trim()
    .toLowerCase();
  if (!selector) return null;
  return (
    nodes.find((node) => {
      const candidates = [
        node["resource-id"],
        node["text"],
        node["content-desc"],
        node["class"],
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return candidates.some((candidate) => candidate.includes(selector));
    }) || null
  );
}

function escapeInputText(value) {
  return String(value || "")
    .replace(/ /g, "%s")
    .replace(/&/g, "\\&")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

async function runStep({
  adbPath,
  serial,
  directories,
  step,
  stepIndex,
}) {
  const label = String(step.name || step.action || `step-${stepIndex + 1}`)
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .toLowerCase();
  const uiTreePath = path.join(
    directories.uiTree,
    `${String(stepIndex + 1).padStart(3, "0")}-${label}.xml`,
  );
  const screenshotPath = path.join(
    directories.screenshots,
    `${String(stepIndex + 1).padStart(3, "0")}-${label}.png`,
  );
  const logsPath = path.join(
    directories.logs,
    `${String(stepIndex + 1).padStart(3, "0")}-${label}.log`,
  );

  const action = String(step.action || "").trim();
  if (action === "screenshot") {
    await captureScreenshot(adbPath, serial, screenshotPath);
    return { action, artifact: screenshotPath };
  }
  if (action === "capture_ui_tree") {
    await captureUiTree(adbPath, serial, uiTreePath);
    return { action, artifact: uiTreePath };
  }
  if (action === "capture_logs") {
    await captureLogs(adbPath, serial, logsPath);
    return { action, artifact: logsPath };
  }

  const timeoutMs = Number.parseInt(String(step.timeout_ms || 15000), 10);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    const xml = await captureUiTree(adbPath, serial, uiTreePath);
    const nodes = parseUiNodes(xml);
    const matched = matchNode(nodes, step);

    if (action === "wait_for_element") {
      if (matched) {
        return { action, matched: true, artifact: uiTreePath };
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    if (action === "assert_visible") {
      if (!matched) {
        throw new Error(`Element not visible for selector '${step.selector || step.text}'.`);
      }
      return { action, matched: true, artifact: uiTreePath };
    }

    if (action === "assert_text") {
      const expected = String(step.expected || step.text || "").trim();
      if (!xml.toLowerCase().includes(expected.toLowerCase())) {
        throw new Error(`Expected text '${expected}' was not present in the UI tree.`);
      }
      return { action, matched: true, artifact: uiTreePath };
    }

    if (action === "tap_element" || action === "type_text") {
      if (!matched) {
        throw new Error(`Unable to resolve selector '${step.selector || step.text}' for ${action}.`);
      }
      const bounds = parseBounds(matched.bounds);
      if (!bounds) {
        throw new Error(`Element selector '${step.selector || step.text}' had no tappable bounds.`);
      }
      const centerX = Math.round((bounds.left + bounds.right) / 2);
      const centerY = Math.round((bounds.top + bounds.bottom) / 2);
      await runAdb(adbPath, serial, [
        "shell",
        "input",
        "tap",
        String(centerX),
        String(centerY),
      ]);
      if (action === "type_text") {
        await runAdb(adbPath, serial, [
          "shell",
          "input",
          "text",
          escapeInputText(step.value || step.text || ""),
        ]);
      }
      return { action, matched: true, artifact: uiTreePath };
    }
  }

  throw new Error(
    `Step '${action}' timed out after ${timeoutMs}ms for selector '${step.selector || step.text || ""}'.`,
  );
}

async function installAndLaunch({ adbPath, serial, apk, packageId, launchActivity }) {
  if (apk) {
    await runAdb(adbPath, serial, ["install", "-r", apk], { timeout: 120000 });
  }
  if (launchActivity) {
    await runAdb(adbPath, serial, [
      "shell",
      "am",
      "start",
      "-n",
      `${packageId}/${launchActivity}`,
    ]);
    return;
  }
  await runAdb(adbPath, serial, [
    "shell",
    "monkey",
    "-p",
    packageId,
    "-c",
    "android.intent.category.LAUNCHER",
    "1",
  ]);
}

async function executeRun({
  args,
  charter,
  directories,
  adbPath,
}) {
  const serial = await resolveTargetDevice(adbPath, args.avd);
  const preflight = {
    serial,
    bootCompleted: await waitForBootComplete(adbPath, serial),
    installReady: await ensureInstallReady(adbPath, serial),
    dataUsage: await captureDataUsage(adbPath, serial),
  };
  if (!preflight.bootCompleted) {
    throw new Error("Device never reached sys.boot_completed=1.");
  }
  if (!preflight.installReady) {
    throw new Error("Device reported booted but package manager was not install-ready.");
  }

  await installAndLaunch({
    adbPath,
    serial,
    apk: args.apk,
    packageId: args.packageId || charter.package,
    launchActivity: charter.launch_activity || null,
  });

  const baselineScreenshot = path.join(directories.screenshots, "000-baseline.png");
  const baselineUiTree = path.join(directories.uiTree, "000-baseline.xml");
  await captureScreenshot(adbPath, serial, baselineScreenshot);
  await captureUiTree(adbPath, serial, baselineUiTree);

  const stepResults = [];
  for (const [stepIndex, step] of charter.steps.entries()) {
    stepResults.push(
      await runStep({
        adbPath,
        serial,
        directories,
        step,
        stepIndex,
      }),
    );
  }

  const finalLogs = path.join(directories.logs, "final-logcat.log");
  await captureLogs(adbPath, serial, finalLogs);

  return {
    status: "success",
    serial,
    preflight,
    stepResults,
    artifacts: {
      screenshotsDir: directories.screenshots,
      logsDir: directories.logs,
      uiTreeDir: directories.uiTree,
      baselineScreenshot,
      baselineUiTree,
      finalLogs,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const charterRaw = await readFile(args.charter, "utf8");
  const charter = parseSimpleYaml(charterRaw);
  validateCharter(charter);
  const directories = await ensureArtifactDirs(args.artifactsDir);
  const reportPath = path.join(directories.root, "report.json");

  if (args.dryRun) {
    const dryRunResult = {
      status: "dry_run",
      providerPreference: "android-mcp",
      providerUsed: args.allowAdbFallback ? "adb" : "android-mcp",
      flow: charter.flow,
      packageId: args.packageId || charter.package,
      artifacts: {
        root: directories.root,
        screenshotsDir: directories.screenshots,
        logsDir: directories.logs,
        uiTreeDir: directories.uiTree,
      },
      charterSummary: {
        flow: charter.flow,
        successCriteria: charter.success_criteria || [],
        steps: charter.steps.map((step) => ({
          action: step.action,
          selector: step.selector || step.text || null,
        })),
      },
      reportPath,
    };
    await writeFile(reportPath, `${JSON.stringify(dryRunResult, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(dryRunResult, null, 2)}\n`);
    return;
  }

  const attempts = [];

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const execution = await runAndroidMcpSession({
        args,
        charter,
        directories,
      });
      const result = {
        ...execution,
        flow: charter.flow,
        packageId: args.packageId || charter.package,
        attempts,
        reportPath,
      };
      await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return;
    } catch (error) {
      const evidenceLog = path.join(
        directories.logs,
        `android-mcp-attempt-${attempt}-failure.log`,
      );
      await writeFile(
        evidenceLog,
        `${String(error)}${os.EOL}`,
        "utf8",
      );
      attempts.push({
        attempt,
        provider: "android-mcp",
        status: attempt === 1 ? "retrying" : args.allowAdbFallback ? "fallback" : "failed",
        error: String(error),
        evidenceLog,
      });
      if (attempt === 2 && !args.allowAdbFallback) {
        const failedResult = {
          status: "failed",
          providerPreference: "android-mcp",
          providerUsed: "android-mcp",
          flow: charter.flow,
          packageId: args.packageId || charter.package,
          attempts,
          error: String(error),
          artifacts: {
            root: directories.root,
            screenshotsDir: directories.screenshots,
            logsDir: directories.logs,
            uiTreeDir: directories.uiTree,
          },
          reportPath,
        };
        await writeFile(reportPath, `${JSON.stringify(failedResult, null, 2)}\n`, "utf8");
        process.stdout.write(`${JSON.stringify(failedResult, null, 2)}\n`);
        process.exit(1);
        return;
      }
    }
  }

  if (!args.allowAdbFallback) {
    throw new Error("ADB fallback is disabled. Re-run with --allow-adb-fallback.");
  }

  const adbPath = resolveAdbPath();
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const execution = await executeRun({
        args,
        charter,
        directories,
        adbPath,
      });
      const result = {
        ...execution,
        flow: charter.flow,
        packageId: args.packageId || charter.package,
        providerUsed: "adb",
        attempts,
        reportPath,
      };
      await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return;
    } catch (error) {
      lastError = error;
      const evidenceLog = path.join(
        directories.logs,
        `adb-attempt-${attempt}-failure.log`,
      );
      await writeFile(
        evidenceLog,
        `${String(error)}${os.EOL}`,
        "utf8",
      );
      attempts.push({
        attempt,
        provider: "adb",
        status: attempt === 1 ? "retrying" : "failed",
        error: String(error),
        evidenceLog,
      });
    }
  }

  const failedResult = {
    status: "failed",
    providerPreference: "android-mcp",
    providerUsed: "adb",
    flow: charter.flow,
    packageId: args.packageId || charter.package,
    attempts,
    error: String(lastError),
    artifacts: {
      root: directories.root,
      screenshotsDir: directories.screenshots,
      logsDir: directories.logs,
      uiTreeDir: directories.uiTree,
    },
    reportPath,
  };
  await writeFile(reportPath, `${JSON.stringify(failedResult, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(failedResult, null, 2)}\n`);
}

main().catch((error) => {
  const failure = {
    status: "failed",
    providerUsed: "adb",
    error: String(error),
  };
  process.stdout.write(`${JSON.stringify(failure, null, 2)}\n`);
  process.exit(1);
});


