import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { readEffectiveConfig } from "../cbxConfig/index.js";
import type { ToolRuntimeContext } from "./registry.js";
import {
  createExecutionTrace,
  finishExecutionTrace,
  persistExecutionTrace,
} from "../runtime/executionTrace.js";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const mobileQaRunName = "mobile_qa_run";

export const mobileQaRunDescription =
  "Run the mobile QA charter runtime with Android MCP as the primary device path, explicit ADB fallback, and persisted execution traces.";

export const mobileQaRunSchema = z.object({
  charterPath: z.string().min(1).describe("Path to the YAML charter file."),
  apkPath: z.string().optional().describe("Optional APK path to install before running."),
  packageId: z.string().optional().describe("Optional package override."),
  avdName: z.string().optional().describe("Optional AVD name to target."),
  artifactsDir: z
    .string()
    .optional()
    .describe("Artifacts directory. Default: artifacts/mobile-qa"),
  scope: z.enum(["auto", "global", "project"]).optional(),
  allowAdbFallback: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

function textResult(data: Record<string, unknown>) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function resolveRunnerPath(): string {
  const runtimeRoot = path.resolve(__dirname, "..", "..", "runtime");
  return path.join(runtimeRoot, "mobile-qa-runner.mjs");
}

function isAndroidConfigured(scope: "auto" | "global" | "project") {
  const effective = readEffectiveConfig(scope);
  const androidConfig =
    effective?.config?.android &&
    typeof effective.config.android === "object" &&
    !Array.isArray(effective.config.android)
      ? (effective.config.android as Record<string, unknown>)
      : null;
  return Boolean(androidConfig?.enabled ?? effective?.config?.android);
}

export function createMobileQaRunHandler(ctx: ToolRuntimeContext) {
  return async function handleMobileQaRun(
    args: z.infer<typeof mobileQaRunSchema>,
  ) {
    const scope = args.scope ?? "auto";
    const androidConfigured = isAndroidConfigured(scope);
    const trace = createExecutionTrace(mobileQaRunName, {
      charterPath: args.charterPath,
      apkPath: args.apkPath ?? null,
      packageId: args.packageId ?? null,
      avdName: args.avdName ?? null,
      artifactsDir: args.artifactsDir ?? "artifacts/mobile-qa",
      scope,
      allowAdbFallback: Boolean(args.allowAdbFallback),
      dryRun: Boolean(args.dryRun),
    });
    trace.selectedSkills.push("flutter-mobile-qa");
    trace.selectedReferences.push(
      "workflows/skills/flutter-mobile-qa/SKILL.md",
      "workflows/skills/flutter-mobile-qa/references/android-mcp-tools.md",
    );

    const gatewayStatus = ctx.gatewayManager.getStatus();
    const androidTools = ctx.gatewayManager.listEnabledTools("android");
    trace.gates.push({
      name: "charter_exists",
      passed: existsSync(path.resolve(args.charterPath)),
      detail: args.charterPath,
      action: existsSync(path.resolve(args.charterPath))
        ? undefined
        : "Create the QA charter YAML file and rerun mobile_qa_run.",
    });
    trace.gates.push({
      name: "gateway_initialized",
      passed: Boolean(gatewayStatus.providers.android),
      detail: gatewayStatus.providers.android?.lastError ?? "Gateway loaded.",
    });
    trace.gates.push({
      name: "android_mcp_configured",
      passed: androidConfigured,
      detail: androidConfigured
        ? "Android MCP is configured in cbx_config.json."
        : "Android MCP is not configured in cbx_config.json.",
      action: androidConfigured
        ? undefined
        : "Enable android in cbx_config.json or rerun with allowAdbFallback=true.",
    });
    trace.gates.push({
      name: "android_enabled_tools",
      passed: Boolean(androidTools.available),
      detail: androidTools.available
        ? `Enabled tools: ${androidTools.enabledCount}`
        : String(androidTools.lastError || "Android upstream unavailable."),
      action: androidTools.available
        ? undefined
        : args.allowAdbFallback
          ? "Android MCP is unavailable, so this run may fall back to ADB."
          : "Start the Android MCP server or rerun with allowAdbFallback=true.",
    });
    trace.gates.push({
      name: "adb_fallback_allowed",
      passed: Boolean(args.allowAdbFallback),
      detail: args.allowAdbFallback
        ? "ADB fallback is enabled for this run."
        : "ADB fallback is disabled for this run.",
    });

    if (!existsSync(path.resolve(args.charterPath))) {
      const blockedResult = {
        status: "blocked",
        providerPreference: androidConfigured ? "android-mcp" : "adb",
        providerUsed: null,
        nextSuggestedAction: "Create the QA charter file first.",
      };
      const tracePath = await persistExecutionTrace(
        finishExecutionTrace(trace, blockedResult),
      );
      return textResult({ ...blockedResult, tracePath });
    }

    if (!androidConfigured && !args.allowAdbFallback) {
      const blockedResult = {
        status: "blocked",
        providerPreference: "android-mcp",
        providerUsed: null,
        nextSuggestedAction:
          "Enable Android MCP in cbx_config.json or rerun with allowAdbFallback=true.",
      };
      const tracePath = await persistExecutionTrace(
        finishExecutionTrace(trace, blockedResult),
      );
      return textResult({ ...blockedResult, tracePath });
    }

    const runnerPath = resolveRunnerPath();
    const commandArgs = [
      runnerPath,
      "--charter",
      path.resolve(args.charterPath),
      "--artifacts-dir",
      path.resolve(args.artifactsDir ?? "artifacts/mobile-qa"),
      "--scope",
      scope,
    ];
    if (args.allowAdbFallback) {
      commandArgs.push("--allow-adb-fallback");
    }
    if (args.apkPath) {
      commandArgs.push("--apk", path.resolve(args.apkPath));
    }
    if (args.packageId) {
      commandArgs.push("--package", args.packageId);
    }
    if (args.avdName) {
      commandArgs.push("--avd", args.avdName);
    }
    if (args.dryRun) {
      commandArgs.push("--dry-run");
    }

    trace.toolCalls.push({
      name: "mobile-qa-runner",
      phase: "execute",
      outcome: "planned",
      arguments: {
        charterPath: path.resolve(args.charterPath),
        artifactsDir: path.resolve(args.artifactsDir ?? "artifacts/mobile-qa"),
        dryRun: Boolean(args.dryRun),
      },
    });

    try {
      const { stdout } = await execFileAsync(process.execPath, commandArgs, {
        cwd: process.cwd(),
      });
      const parsed = JSON.parse(String(stdout || "{}")) as Record<string, unknown>;
      trace.toolCalls[trace.toolCalls.length - 1].outcome = "success";
      if (typeof parsed.reportPath === "string") {
        trace.artifacts.push({
          kind: "report",
          path: parsed.reportPath,
          description: "Mobile QA report",
        });
      }
      const result = {
        status: parsed.status ?? "success",
        providerPreference: androidConfigured ? "android-mcp" : "adb",
        providerUsed: parsed.providerUsed ?? (androidConfigured ? "android-mcp" : "adb"),
        artifactSummary: parsed.artifacts ?? {},
        reportPath: parsed.reportPath ?? null,
        runnerResult: parsed,
      };
      const tracePath = await persistExecutionTrace(
        finishExecutionTrace(trace, result),
      );
      return textResult({ ...result, tracePath });
    } catch (error) {
      trace.toolCalls[trace.toolCalls.length - 1].outcome = "failed";
      trace.errors.push({ message: String(error) });
      const failedResult = {
        status: "failed",
        providerPreference: androidConfigured ? "android-mcp" : "adb",
        providerUsed: androidConfigured ? "android-mcp" : "adb",
        error: String(error),
      };
      const tracePath = await persistExecutionTrace(
        finishExecutionTrace(trace, failedResult),
      );
      return textResult({ ...failedResult, tracePath });
    }
  };
}

export const handleMobileQaRun = createMobileQaRunHandler;
