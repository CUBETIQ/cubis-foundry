import { execFile } from "node:child_process";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { ToolRuntimeContext } from "./registry.js";
import {
  createExecutionTrace,
  finishExecutionTrace,
  persistExecutionTrace,
} from "../runtime/executionTrace.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const mobileTestingRunName = "mobile_testing_run";

export const mobileTestingRunDescription =
  "Tool for charter-driven mobile testing across android-emulator-testing, ios-simulator-testing, and mobile-mcp, with CLI-first ADB execution by default and persisted execution traces.";

export const mobileTestingRunSchema = z.object({
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
      "Artifacts directory. Default: artifacts/mobile-testing.",
    ),
  scope: z.enum(["auto", "global", "project"]).optional(),
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
  return path.join(runtimeRoot, "mobile-testing-runner.mjs");
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

export function createMobileTestingRunHandler(ctx: ToolRuntimeContext) {
  return async function handleMobileTestingRun(
    args: z.infer<typeof mobileTestingRunSchema>,
  ) {
    const scope = args.scope ?? "auto";
    const providerPreference = "adb";
    const trace = createExecutionTrace(mobileTestingRunName, {
      charterPath: args.charterPath,
      apkPath: args.apkPath ?? null,
      packageId: args.packageId ?? null,
      avdName: args.avdName ?? null,
      artifactsDir: args.artifactsDir ?? "artifacts/mobile-testing",
      scope,
      dryRun: Boolean(args.dryRun),
    });
    trace.selectedSkills.push("android-emulator-testing");
    trace.selectedReferences.push(
      "foundry/modules/android-emulator-testing/SKILL.md",
    );

    const gatewayStatus = ctx.gatewayManager.getStatus();
    const mobileTools = ctx.gatewayManager.listEnabledTools("mobile");
    trace.gates.push({
      name: "charter_exists",
      passed: existsSync(path.resolve(args.charterPath)),
      detail: args.charterPath,
      action: existsSync(path.resolve(args.charterPath))
        ? undefined
        : "Create the mobile testing charter YAML file and rerun the `mobile_testing_run` tool.",
    });
    trace.gates.push({
      name: "mobile_mcp_available",
      passed: Boolean(gatewayStatus.providers.mobile),
      detail: gatewayStatus.providers.mobile?.lastError
        ? `mobile-mcp unavailable: ${gatewayStatus.providers.mobile.lastError}`
        : mobileTools.available
          ? `mobile-mcp available with ${mobileTools.enabledCount} enabled tool(s).`
          : "mobile-mcp is not currently available; CLI-first ADB remains the deterministic fallback.",
      action: mobileTools.available
        ? undefined
        : "Start the bundled Foundry MCP gateway mobile provider when you need semantic Android/iOS interaction; this runner continues on the CLI-first fallback path.",
    });

    if (!existsSync(path.resolve(args.charterPath))) {
      const blockedResult = {
        status: "blocked",
        providerPreference,
        providerUsed: null,
        nextSuggestedAction:
          "Create the mobile testing charter file first, then rerun the `mobile_testing_run` tool.",
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
      path.resolve(args.artifactsDir ?? "artifacts/mobile-testing"),
      "--scope",
      scope,
    ];
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
      name: "mobile-testing-runner",
      phase: "execute",
      outcome: "planned",
      arguments: {
        charterPath: path.resolve(args.charterPath),
        artifactsDir: path.resolve(args.artifactsDir ?? "artifacts/mobile-testing"),
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

export const handleMobileTestingRun = createMobileTestingRunHandler;
