import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveGatewayConfig } from "./config.js";

let tempHomeDir = "";
let workspaceDir = "";
const originalHome = process.env.HOME;
const originalCwd = process.cwd();

function writeProjectConfig(value: unknown): void {
  const file = path.join(workspaceDir, "cbx_config.json");
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

beforeEach(() => {
  tempHomeDir = mkdtempSync(path.join(os.tmpdir(), "mcp-home-gateway-"));
  workspaceDir = mkdtempSync(path.join(os.tmpdir(), "mcp-workspace-gateway-"));
  process.env.HOME = tempHomeDir;
  process.chdir(workspaceDir);
});

afterEach(() => {
  process.chdir(originalCwd);
  if (originalHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = originalHome;
  }
  rmSync(tempHomeDir, { recursive: true, force: true });
  rmSync(workspaceDir, { recursive: true, force: true });
});

describe("gateway config", () => {
  it("does not auto-configure mobile for an empty config section", () => {
    writeProjectConfig({ mobile: {} });

    const resolved = resolveGatewayConfig("project");

    expect(resolved.providers.mobile.transport).toBe("stdio");
    expect(resolved.providers.mobile.mcpUrl).toBeNull();
    expect(resolved.providers.mobile.command).toBeNull();
    expect(resolved.providers.mobile.warnings).toContain(
      "Mobile MCP is not configured in cbx_config.json.",
    );
  });

  it("prefers top-level mobile.mcpUrl over profile URLs", () => {
    writeProjectConfig({
      mobile: {
        mcpUrl: "https://override.mobile.example.com/mcp",
        activeProfileName: "ios",
        profiles: {
          ios: {
            url: "https://profile.mobile.example.com/mcp",
            command: "npx",
            args: ["-y", "@mobilenext/mobile-mcp@latest"],
          },
        },
      },
    });

    const resolved = resolveGatewayConfig("project");

    expect(resolved.providers.mobile.transport).toBe("http");
    expect(resolved.providers.mobile.mcpUrl).toBe(
      "https://override.mobile.example.com/mcp",
    );
  });

  it("treats top-level mobile args as an enabled stdio provider", () => {
    writeProjectConfig({
      mobile: {
        args: ["-y", "@mobilenext/mobile-mcp@latest", "--profile", "ios"],
      },
    });

    const resolved = resolveGatewayConfig("project");

    expect(resolved.providers.mobile.transport).toBe("stdio");
    expect(resolved.providers.mobile.command).toBe("npx");
    expect(resolved.providers.mobile.args).toEqual([
      "-y",
      "@mobilenext/mobile-mcp@latest",
      "--profile",
      "ios",
    ]);
  });
});
