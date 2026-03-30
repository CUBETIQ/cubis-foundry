import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";
import { registerMobileCommands } from "./commands.js";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

describe("registerMobileCommands()", () => {
  it("registers canonical mobile testing commands", () => {
    const program = new Command();
    registerMobileCommands(program, { runMobileTesting: vi.fn() });

    const mobile = program.commands.find((command) => command.name() === "mobile");
    const test = mobile?.commands.find((command) => command.name() === "test");
    const run = test?.commands.find((command) => command.name() === "run");
    const help = normalizeWhitespace(run?.helpInformation() ?? "");

    expect(mobile?.description()).toContain("mobile testing");
    expect(test?.description()).toContain("android-emulator-testing");
    expect(test?.description()).toContain("ios-simulator-testing");
    expect(test?.description()).toContain("mobile-mcp");
    expect(help).toContain("--artifacts-dir <path>");
    expect(help).toContain("artifact root directory (default: artifacts/mobile-testing)");
  });
});
