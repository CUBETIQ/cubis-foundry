import { execFile } from "node:child_process";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const mobileQaRunName = "mobile_qa_run";

export const mobileQaRunDescription =
  "Compatibility tool for charter-driven mobile testing across android-emulator-testing, ios-simulator-testing, and mobile-mcp, with CLI-first ADB execution by default and persisted execution traces.";

export const mobileQaRunSchema = z.object({
  charterPath: z
    .string()
    .min(1)
    .describe("Path to the YAML mobile testing charter file."),
  apkPath: z
    .string()
    .optional()
    .describe("Optional APK path to install before running."),
  packageId: z.string().optional().describe("Optional package override."),
  avdName: z.string().optional().describe("Optional AVD name to target."),
  artifactsDir: z
    .string()
    .optional()
    .describe(
      "Artifacts directory. Default: artifacts/mobile-qa (legacy compatibility path).",
    ),
  scope: z.enum(["auto", "global", "project"]).optional(),
  androidMcp: z
    .boolean()
    .optional()
    .describe("Opt in to Android MCP-assisted mobile testing execution."),
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

function parseRunnerErrorOutput(error: unknown): Record<string, unknown> | null {
  const rawStdout =
    error && typeof error === "object" && "stdout" in error
      ? (error as { stdout?: unknown }).stdout
      : undefined;
  const stdout =
    typeof rawStdout === "string"
      ? rawStdout
      : Buffer.isBuffer(rawStdout)
        ? rawStdout.toString("utf8")
        : null;
  if (stdout == null || stdout.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

async function execRunner(commandArgs: string[]) {
  return await new Promise<{ stdout: string }>((resolve, reject) => {
    execFile(process.execPath, commandArgs, { cwd: process.cwd() }, (error, stdout) => {
      if (error) {
        const runnerError = error as Error & { stdout?: string | Buffer };
        if (runnerError.stdout == null && stdout != null) {
          runnerError.stdout = stdout;
        }
        reject(runnerError);
        return;
      }
      resolve({ stdout: String(stdout ?? "") });
    });
  });
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
    const androidMcpOptIn = Boolean(args.androidMcp);
    const providerPreference = androidMcpOptIn ? "android-mcp" : "adb";
    const trace = createExecutionTrace(mobileQaRunName, {
      charterPath: args.charterPath,
      apkPath: args.apkPath ?? null,
      packageId: args.packageId ?? null,
      avdName: args.avdName ?? null,
      artifactsDir: args.artifactsDir ?? "artifacts/mobile-qa",
      scope,
      androidMcpOptIn,
      dryRun: Boolean(args.dryRun),
    });
    trace.selectedSkills.push("android-emulator-testing");
    trace.selectedReferences.push(
      "foundry/modules/android-emulator-testing/SKILL.md",
    );

    const gatewayStatus = ctx.gatewayManager.getStatus();
    const androidTools = ctx.gatewayManager.listEnabledTools("android");
    trace.gates.push({
      name: "charter_exists",
      passed: existsSync(path.resolve(args.charterPath)),
      detail: args.charterPath,
      action: existsSync(path.resolve(args.charterPath))
        ? undefined
        : "Create the mobile testing charter YAML file and rerun the compatibility tool `mobile_qa_run`.",
    });
    trace.gates.push({
      name: "android_mcp_opt_in",
      passed: true,
      detail: androidMcpOptIn
        ? "Android MCP opt-in is enabled for this run."
        : "Android MCP opt-in is disabled; ADB will be used first.",
      action: androidMcpOptIn
        ? undefined
        : "Use --android-mcp only when you want the optional Android MCP path.",
    });
    if (androidMcpOptIn) {
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
          : "Enable android in cbx_config.json if you want the optional Android MCP path.",
      });
      trace.gates.push({
        name: "android_enabled_tools",
        passed: Boolean(androidTools.available),
        detail: androidTools.available
          ? `Enabled tools: ${androidTools.enabledCount}`
          : String(androidTools.lastError || "Android upstream unavailable."),
        action: androidTools.available
          ? undefined
          : "Android MCP tools are unavailable; the run will continue on the default ADB path.",
      });
    }

    if (!existsSync(path.resolve(args.charterPath))) {
      const blockedResult = {
        status: "blocked",
        providerPreference,
        providerUsed: null,
        nextSuggestedAction:
          "Create the mobile testing charter file first, then rerun the compatibility tool `mobile_qa_run`.",
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
    if (androidMcpOptIn) {
      commandArgs.push("--android-mcp");
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
      const { stdout } = await execRunner(commandArgs);
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
        providerPreference: parsed.providerPreference ?? providerPreference,
        providerUsed: parsed.providerUsed ?? providerPreference,
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
      const parsed = parseRunnerErrorOutput(error);
      if (typeof parsed?.reportPath === "string") {
        trace.artifacts.push({
          kind: "report",
          path: parsed.reportPath,
          description: "Mobile QA report",
        });
      }
      const failedResult = {
        status: parsed?.status ?? "failed",
        providerPreference: parsed?.providerPreference ?? providerPreference,
        providerUsed: parsed?.providerUsed ?? providerPreference,
        artifactSummary: parsed?.artifacts ?? {},
        reportPath: parsed?.reportPath ?? null,
        runnerResult: parsed,
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
