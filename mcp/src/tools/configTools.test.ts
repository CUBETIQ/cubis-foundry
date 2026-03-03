import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { POSTMAN_MODES } from "./postmanModes.js";
import { handlePostmanGetMode } from "./postmanGetMode.js";
import { handlePostmanGetStatus } from "./postmanGetStatus.js";
import { handlePostmanSetMode } from "./postmanSetMode.js";
import { handleStitchGetMode } from "./stitchGetMode.js";
import { handleStitchGetStatus } from "./stitchGetStatus.js";
import { handleStitchSetProfile } from "./stitchSetProfile.js";

let tempHomeDir = "";
let workspaceDir = "";
const originalHome = process.env.HOME;
const originalCwd = process.cwd();

function payload(result: { content: Array<{ text: string }> }): Record<string, unknown> {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

function projectConfigPath(): string {
  return path.join(workspaceDir, "cbx_config.json");
}

function writeProjectConfig(value: unknown): void {
  const file = projectConfigPath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function readProjectConfig(): Record<string, unknown> {
  return JSON.parse(readFileSync(projectConfigPath(), "utf8")) as Record<string, unknown>;
}

beforeEach(() => {
  tempHomeDir = mkdtempSync(path.join(os.tmpdir(), "mcp-home-tools-"));
  workspaceDir = mkdtempSync(path.join(os.tmpdir(), "mcp-workspace-tools-"));
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

describe("postman tools", () => {
  it("throws when config is missing", () => {
    expect(() => handlePostmanGetMode({ scope: "project" })).toThrow(
      "cbx_config.json not found",
    );
  });

  it("writes and reads a Postman mode in project scope", () => {
    writeProjectConfig({});

    const setResult = payload(
      handlePostmanSetMode({ mode: "full", scope: "project" }),
    );
    expect(setResult).toMatchObject({
      mode: "full",
      url: POSTMAN_MODES.full,
      scope: "project",
    });

    const file = readProjectConfig();
    expect(file).toMatchObject({ postman: { mcpUrl: POSTMAN_MODES.full } });

    const mode = payload(handlePostmanGetMode({ scope: "project" }));
    expect(mode).toMatchObject({
      mode: "full",
      url: POSTMAN_MODES.full,
      scope: "project",
    });
  });

  it("reports unknown Postman URL values as domain errors", () => {
    writeProjectConfig({ postman: { mcpUrl: "https://example.com/custom" } });

    expect(() => handlePostmanGetMode({ scope: "project" })).toThrow(
      'Unknown Postman MCP URL in config: "https://example.com/custom"',
    );
  });

  it("returns full Postman status payload", () => {
    writeProjectConfig({
      postman: {
        mcpUrl: POSTMAN_MODES.code,
        defaultWorkspaceId: "ws_42",
      },
    });

    const status = payload(handlePostmanGetStatus({ scope: "project" }));
    expect(status).toMatchObject({
      configured: true,
      mode: "code",
      url: POSTMAN_MODES.code,
      defaultWorkspaceId: "ws_42",
      scope: "project",
    });
  });
});

describe("stitch tools", () => {
  it("validates that target stitch profile exists", () => {
    writeProjectConfig({
      stitch: {
        activeProfileName: "prod",
        profiles: {
          prod: { url: "https://prod.stitch" },
        },
      },
    });

    expect(() =>
      handleStitchSetProfile({ profileName: "staging", scope: "project" }),
    ).toThrow('Stitch profile "staging" not found');
  });

  it("updates active profile and exposes only safe status fields", () => {
    writeProjectConfig({
      stitch: {
        activeProfileName: "prod",
        profiles: {
          prod: { url: "https://prod.stitch", apiKey: "secret-value" },
          staging: { url: "https://staging.stitch" },
        },
      },
    });

    const setResult = payload(
      handleStitchSetProfile({ profileName: "staging", scope: "project" }),
    );
    expect(setResult).toMatchObject({
      activeProfileName: "staging",
      url: "https://staging.stitch",
      scope: "project",
    });

    const mode = payload(handleStitchGetMode({ scope: "project" }));
    expect(mode).toMatchObject({
      activeProfileName: "staging",
      activeUrl: "https://staging.stitch",
      availableProfiles: ["prod", "staging"],
      scope: "project",
    });

    const status = payload(handleStitchGetStatus({ scope: "project" }));
    expect(status).toMatchObject({
      configured: true,
      activeProfileName: "staging",
      totalProfiles: 2,
      scope: "project",
    });
    const statusText = JSON.stringify(status);
    expect(statusText).not.toContain("secret-value");
    expect(statusText).toContain('"hasApiKey":true');
  });
});
