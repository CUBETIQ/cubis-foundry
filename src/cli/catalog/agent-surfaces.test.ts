import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");

function readAgent(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

describe("core agent surface", () => {
  it("keeps implementer and tester aligned to the reduced testing taxonomy", () => {
    const implementer = readAgent("foundry/modules/agents-core/agents/implementer.md");
    const tester = readAgent("foundry/modules/agents-core/agents/tester.md");

    for (const content of [implementer, tester]) {
      expect(content).toContain("web-testing");
      expect(content).toContain("android-emulator-testing");
      expect(content).toContain("ios-simulator-testing");
      expect(content).toContain("mobile-mcp");
      expect(content).toContain("CLI fallback");
      expect(content).not.toContain("playwright-interactive");
      expect(content).not.toContain("unit-testing");
      expect(content).not.toContain("integration-testing");
      expect(content).not.toContain("qa");
    }
  });

  it("makes orchestrator delegation and tool-boundary policy explicit", () => {
    const orchestrator = readAgent("foundry/modules/agents-core/agents/orchestrator.md");

    expect(orchestrator).toContain("Do the work directly when one specialist can finish it");
    expect(orchestrator).toContain("Delegate only when the task is genuinely multi-step");
    expect(orchestrator).toContain("Prefer MCP or native platform tools");
    expect(orchestrator).toContain("Do not delegate trivial single-step actions");
  });
});
