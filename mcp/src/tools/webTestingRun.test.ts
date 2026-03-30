import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unmock("node:child_process");
  vi.unmock("../runtime/executionTrace.js");
});

describe("web testing run", () => {
  it("describes the MCP tool as the canonical entrypoint for charter-driven web testing", async () => {
    const { webTestingRunDescription } = await import("./webTestingRun.js");

    expect(webTestingRunDescription).toContain("web-testing");
    expect(webTestingRunDescription).toContain("Playwright MCP");
  });

  it("keeps the trace pinned to web-testing and its canonical reference", async () => {
    const workingDir = await mkdtemp(path.join(tmpdir(), "foundry-web-testing-"));
    const charterPath = path.join(workingDir, "charter.yml");
    await writeFile(
      charterPath,
      ["flow: smoke", "steps:", "  - action: click", "  - action: wait"].join("\n"),
      "utf8",
    );

    const runnerResult = {
      status: "success",
      providerUsed: "playwright-mcp",
      artifacts: { screenshots: 1 },
      reportPath: path.join(workingDir, "report.md"),
    };

    let capturedTrace: Record<string, unknown> | null = null;
    const mockExecFile = vi.fn(
      (
        _file: string,
        _args: string[],
        _options: { cwd: string },
        callback: (error: Error | null, stdout?: string, stderr?: string) => void,
      ) => {
        callback(null, JSON.stringify(runnerResult), "");
      },
    );

    vi.doMock("node:child_process", () => ({ execFile: mockExecFile }));
    vi.doMock("../runtime/executionTrace.js", () => ({
      createExecutionTrace: (flow: string, inputs: Record<string, unknown>) => ({
        flow,
        inputs,
        gates: [],
        selectedSkills: [],
        selectedReferences: [],
        toolCalls: [],
        retries: [],
        artifacts: [],
        result: null,
        errors: [],
        startedAt: "start",
        finishedAt: null,
      }),
      finishExecutionTrace: (trace: Record<string, unknown>, result: Record<string, unknown>) => ({
        ...trace,
        result,
        finishedAt: "end",
      }),
      persistExecutionTrace: async (trace: Record<string, unknown>) => {
        capturedTrace = trace;
        return path.join(workingDir, "trace.json");
      },
    }));

    const { createWebTestingRunHandler } = await import("./webTestingRun.js");
    const handler = createWebTestingRunHandler({
      gatewayManager: {
        getStatus: () => ({
          providers: {
            playwright: {
              lastError: null,
            },
          },
        }),
        listEnabledTools: () => ({
          available: true,
          enabledCount: 1,
          enabledTools: ["playwright.locate", "playwright.click"],
          upstreamTools: [],
          warnings: [],
          lastError: null,
          syncedAt: null,
          mcpUrl: null,
          command: null,
          authEnvVar: null,
          authConfigured: false,
          catalogDir: workingDir,
          provider: "playwright",
          transport: "http",
        }),
      },
    } as never);

    try {
      const response = await handler({ charterPath, scope: "auto" });
      const payload = JSON.parse(response.content[0].text) as Record<string, unknown>;

      expect(payload.status).toBe("success");
      expect(capturedTrace?.selectedSkills).toEqual(["web-testing"]);
      expect(capturedTrace?.selectedReferences).toEqual([
        "foundry/modules/web-testing/SKILL.md",
      ]);
      expect(capturedTrace?.selectedSkills).not.toContain("playwright-interactive");
      expect(capturedTrace?.selectedReferences).not.toContain("playwright-interactive");
    } finally {
      await rm(workingDir, { recursive: true, force: true });
    }
  });

  it("makes rerun guidance explicit when Playwright is unavailable", async () => {
    const workingDir = await mkdtemp(path.join(tmpdir(), "foundry-web-testing-blocked-"));
    const charterPath = path.join(workingDir, "charter.yml");
    await writeFile(
      charterPath,
      ["flow: smoke", "steps:", "  - action: click"].join("\n"),
      "utf8",
    );

    const { createWebTestingRunHandler } = await import("./webTestingRun.js");
    const handler = createWebTestingRunHandler({
      gatewayManager: {
        getStatus: () => ({
          providers: {
            playwright: {
              lastError: "offline",
            },
          },
        }),
        listEnabledTools: () => ({
          available: false,
          enabledCount: 0,
          enabledTools: [],
          upstreamTools: [],
          warnings: [],
          lastError: "offline",
          syncedAt: null,
          mcpUrl: null,
          command: null,
          authEnvVar: null,
          authConfigured: false,
          catalogDir: workingDir,
          provider: "playwright",
          transport: "http",
        }),
      },
    } as never);

    try {
      const response = await handler({ charterPath, scope: "auto" });
      const payload = JSON.parse(response.content[0].text) as Record<string, unknown>;

      expect(payload.nextSuggestedAction).toBe(
        "Start the Playwright MCP server and rerun the `web_testing_run` tool.",
      );
    } finally {
      await rm(workingDir, { recursive: true, force: true });
    }
  });
});
