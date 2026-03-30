import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it, vi, afterEach } from "vitest";

const execFileAsync = promisify(execFile);
const runnerPath = new URL("../../runtime/mobile-testing-runner.mjs", import.meta.url);

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unmock("node:child_process");
});

async function runDryRunner(args: string[]) {
    const workingDir = await mkdtemp(path.join(tmpdir(), "foundry-mobile-testing-"));
  const charterPath = path.join(workingDir, "charter.yml");
  await writeFile(
    charterPath,
    [
      "flow: smoke",
      "package: com.example.app",
      "steps:",
      "  - action: screenshot",
    ].join("\n"),
  );

  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [fileURLToPath(runnerPath), "--charter", charterPath, "--dry-run", ...args],
      { cwd: workingDir },
    );
    return JSON.parse(String(stdout).trim()) as Record<string, unknown>;
  } finally {
    await rm(workingDir, { recursive: true, force: true });
  }
}

describe("mobile testing runner", () => {
  it("describes the MCP tool as the canonical entrypoint for charter-driven mobile testing", async () => {
    const { mobileTestingRunDescription } = await import("./mobileTestingRun.js");

    expect(mobileTestingRunDescription).toContain("android-emulator-testing");
    expect(mobileTestingRunDescription).toContain("ios-simulator-testing");
    expect(mobileTestingRunDescription).toContain("mobile-mcp");
  });

  it("defaults to adb/CLI-first provider selection in dry-run mode", async () => {
    const result = await runDryRunner([]);

    expect(result.status).toBe("dry_run");
    expect(result.providerPreference).toBe("adb");
    expect(result.providerUsed).toBe("adb");
  });

  it("preserves providerUsed from structured runner failures", async () => {
    const workdir = await mkdtemp(path.join(tmpdir(), "foundry-mobile-testing-handler-"));
    const charterPath = path.join(workdir, "charter.yml");
    await writeFile(
      charterPath,
      ["flow: smoke", "package: com.example.app", "steps:", "  - action: screenshot"].join("\n"),
    );

    const mockExecFile = vi.fn((file, args, options, callback) => {
      const error = new Error("runner failed") as Error & { stdout?: string };
      error.stdout = JSON.stringify({
        status: "failed",
        providerPreference: "adb",
        providerUsed: "adb",
        artifacts: {},
        reportPath: path.join(workdir, "report.json"),
      });
      callback(error);
    });

    vi.doMock("node:child_process", () => ({ execFile: mockExecFile }));

    const { createMobileTestingRunHandler } = await import("./mobileTestingRun.js");
    const handler = createMobileTestingRunHandler({
      gatewayManager: {
        getStatus: () => ({
          providers: { mobile: { lastError: null } },
        }),
        listEnabledTools: () => ({
          available: true,
          enabledCount: 4,
          lastError: null,
        }),
      },
    } as never);

    try {
      const result = await handler({ charterPath });
      const data = JSON.parse(result.content[0].text) as Record<string, unknown>;
      expect(data.providerUsed).toBe("adb");
    } finally {
      await rm(workdir, { recursive: true, force: true });
    }
  });

  it("makes compatibility rerun guidance explicit when the charter is missing", async () => {
    const { createMobileTestingRunHandler } = await import("./mobileTestingRun.js");
    const handler = createMobileTestingRunHandler({
      gatewayManager: {
        getStatus: () => ({
          providers: { mobile: { lastError: null } },
        }),
        listEnabledTools: () => ({
          available: false,
          enabledCount: 0,
          lastError: null,
        }),
      },
    } as never);

    const result = await handler({ charterPath: "/tmp/missing-charter.yml" });
    const data = JSON.parse(result.content[0].text) as Record<string, unknown>;

    expect(data.nextSuggestedAction).toBe(
      "Create the mobile testing charter file first, then rerun the `mobile_testing_run` tool.",
    );
  });

  it("records mobile-mcp availability in trace guidance", async () => {
    const { createMobileTestingRunHandler } = await import("./mobileTestingRun.js");
    const handler = createMobileTestingRunHandler({
      gatewayManager: {
        getStatus: () => ({
          providers: { mobile: { lastError: null } },
        }),
        listEnabledTools: () => ({
          available: true,
          enabledCount: 4,
          lastError: null,
        }),
      },
    } as never);

    const result = await handler({ charterPath: "/tmp/missing-charter.yml" });
    const data = JSON.parse(result.content[0].text) as Record<string, unknown>;
    const tracePath = data.tracePath as string;
    const traceText = await readFile(tracePath, "utf8");
    const trace = JSON.parse(traceText) as {
      gates: Array<{ name: string; detail?: string | null }>;
    };

    expect(trace.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "mobile_mcp_available",
          detail: "mobile-mcp available with 4 enabled tool(s).",
        }),
      ]),
    );
  });
});
