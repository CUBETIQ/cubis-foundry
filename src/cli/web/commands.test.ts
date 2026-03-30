import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";
import { registerWebCommands } from "./commands.js";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

describe("registerWebCommands()", () => {
  it("registers canonical web testing commands", () => {
    const program = new Command();
    registerWebCommands(program, { runWebTesting: vi.fn() });

    const web = program.commands.find((command) => command.name() === "web");
    const test = web?.commands.find((command) => command.name() === "test");
    const run = test?.commands.find((command) => command.name() === "run");
    const help = normalizeWhitespace(run?.helpInformation() ?? "");

    expect(web?.description()).toContain("web testing");
    expect(test?.description()).toContain("web-testing");
    expect(test?.description()).toContain("Playwright MCP");
    expect(help).toContain("--artifacts-dir <path>");
    expect(help).toContain("artifact root directory (default: artifacts/web-testing)");
  });
});
