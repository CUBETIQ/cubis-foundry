import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";
import { registerMobileCommands } from "./commands.js";

describe("registerMobileCommands()", () => {
  it("keeps the compatibility command path but advertises canonical mobile testing", () => {
    const program = new Command();
    registerMobileCommands(program, { runMobileQa: vi.fn() });

    const mobile = program.commands.find((command) => command.name() === "mobile");
    const qa = mobile?.commands.find((command) => command.name() === "qa");
    const run = qa?.commands.find((command) => command.name() === "run");
    const help = run?.helpInformation() ?? "";

    expect(mobile?.description()).toContain("mobile testing");
    expect(mobile?.description()).toContain("compatibility");
    expect(qa?.description()).toContain("android-emulator-testing");
    expect(qa?.description()).toContain("ios-simulator-testing");
    expect(qa?.description()).toContain("mobile-mcp");
    expect(help).toContain("--android-mcp");
    expect(help).toContain("legacy compatibility flag");
    expect(help).toContain("--artifacts-dir <path>");
    expect(help).toContain(
      "artifact root directory (default: artifacts/mobile-qa",
    );
    expect(help).toContain("legacy compatibility path");
  });
});
