import { execFile } from "node:child_process";
import { promisify } from "node:util";
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

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const webQaRunName = "web_qa_run";

export const webQaRunDescription =
  "Run the web QA charter runtime with Playwright MCP execution, deterministic artifacts, and persisted execution traces.";

export const webQaRunSchema = z.object({
  charterPath: z.string().min(1).describe("Path to the YAML charter file."),
  artifactsDir: z
    .string()
    .optional()
    .describe("Artifacts directory. Default: artifacts/web-qa"),
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
  return path.join(runtimeRoot, "web-qa-runner.mjs");
}

export function createWebQaRunHandler(_ctx: ToolRuntimeContext) {
  return async function handleWebQaRun(
    args: z.infer<typeof webQaRunSchema>,
  ) {
    const scope = args.scope ?? "auto";
    const trace = createExecutionTrace(webQaRunName, {
      charterPath: args.charterPath,
      artifactsDir: args.artifactsDir ?? "artifacts/web-qa",
      scope,
      dryRun: Boolean(args.dryRun),
    });
    trace.selectedSkills.push("playwright-web-qa");
    trace.selectedReferences.push(
      "workflows/skills/playwright-web-qa/SKILL.md",
      "workflows/skills/playwright-interactive/SKILL.md",
    );

    const gatewayStatus = _ctx.gatewayManager.getStatus();
    const playwrightTools = _ctx.gatewayManager.listEnabledTools("playwright");
    trace.gates.push({
      name: "charter_exists",
      passed: existsSync(path.resolve(args.charterPath)),
      detail: args.charterPath,
      action: existsSync(path.resolve(args.charterPath))
        ? undefined
        : "Create the QA charter YAML file and rerun web_qa_run.",
    });
    trace.gates.push({
      name: "gateway_initialized",
      passed: Boolean(gatewayStatus.providers.playwright),
      detail: gatewayStatus.providers.playwright?.lastError ?? "Gateway loaded.",
    });
    trace.gates.push({
      name: "playwright_enabled_tools",
      passed: Boolean(playwrightTools.available),
      detail: playwrightTools.available
        ? `Enabled tools: ${playwrightTools.enabledCount}`
        : String(playwrightTools.lastError || "Playwright upstream unavailable."),
      action: playwrightTools.available
        ? undefined
        : "Start the Playwright MCP server or configure playwright.mcpUrl in cbx_config.json.",
    });

    if (!existsSync(path.resolve(args.charterPath)) || !playwrightTools.available) {
      const blockedResult = {
        status: "blocked",
        providerPreference: "playwright-mcp",
        providerUsed: null,
        nextSuggestedAction: !existsSync(path.resolve(args.charterPath))
          ? "Create the QA charter file first."
          : "Start the Playwright MCP server and rerun web_qa_run.",
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
      path.resolve(args.artifactsDir ?? "artifacts/web-qa"),
      "--scope",
      scope,
    ];
    if (args.dryRun) {
      commandArgs.push("--dry-run");
    }

    trace.toolCalls.push({
      name: "web-qa-runner",
      phase: "execute",
      outcome: "planned",
      arguments: {
        charterPath: path.resolve(args.charterPath),
        artifactsDir: path.resolve(args.artifactsDir ?? "artifacts/web-qa"),
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
          description: "Web QA report",
        });
      }
      const result = {
        status: parsed.status ?? "success",
        providerPreference: "playwright-mcp",
        providerUsed: parsed.providerUsed ?? "playwright-mcp",
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
        providerPreference: "playwright-mcp",
        providerUsed: "playwright-mcp",
        error: String(error),
      };
      const tracePath = await persistExecutionTrace(
        finishExecutionTrace(trace, failedResult),
      );
      return textResult({ ...failedResult, tracePath });
    }
  };
}

export const handleWebQaRun = createWebQaRunHandler;
