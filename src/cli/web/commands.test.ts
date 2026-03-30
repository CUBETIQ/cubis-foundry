import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";
import { registerWebCommands } from "./commands.js";

describe("registerWebCommands()", () => {
  it("keeps the compatibility command path but advertises canonical web testing", () => {
    const program = new Command();
    registerWebCommands(program, { runWebQa: vi.fn() });

    const web = program.commands.find((command) => command.name() === "web");
    const qa = web?.commands.find((command) => command.name() === "qa");
    const run = qa?.commands.find((command) => command.name() === "run");
    const help = run?.helpInformation() ?? "";

    expect(web?.description()).toContain("web testing");
    expect(web?.description()).toContain("compatibility");
    expect(qa?.description()).toContain("web-testing");
    expect(qa?.description()).toContain("Playwright MCP");
    expect(help).toContain("--artifacts-dir <path>");
    expect(help).toContain("artifact root directory (default: artifacts/web-qa");
    expect(help).toContain("legacy compatibility path");
  });
});
