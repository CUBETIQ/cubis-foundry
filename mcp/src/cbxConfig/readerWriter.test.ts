import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ensureConfigExists,
  readEffectiveConfig,
  redactConfig,
  resolveConfigPath,
  writeConfigField,
} from "./index.js";

let tempHomeDir = "";
let workspaceDir = "";
const originalHome = process.env.HOME;
const originalCwd = process.cwd();

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

beforeEach(() => {
  tempHomeDir = mkdtempSync(path.join(os.tmpdir(), "mcp-home-"));
  workspaceDir = mkdtempSync(path.join(os.tmpdir(), "mcp-workspace-"));
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

describe("config path resolution", () => {
  it("chooses global scope when no project config exists", () => {
    const resolved = resolveConfigPath("auto", workspaceDir);
    expect(resolved.scope).toBe("global");
    expect(resolved.path).toBe(
      path.join(tempHomeDir, ".cbx", "cbx_config.json"),
    );
  });

  it("chooses project scope when project config exists", () => {
    const projectPath = path.join(workspaceDir, "cbx_config.json");
    writeJson(projectPath, { postman: { mcpUrl: "https://mcp.postman.com/code" } });

    const resolved = resolveConfigPath("auto", workspaceDir);
    expect(resolved.scope).toBe("project");
    expect(resolved.path).toBe(projectPath);
  });
});

describe("read/write behavior", () => {
  it("writes nested fields to project config", () => {
    const result = writeConfigField(
      "postman.mcpUrl",
      "https://mcp.postman.com/full",
      "project",
      workspaceDir,
    );

    expect(result.scope).toBe("project");
    const written = readJson(result.writtenPath);
    expect(written).toMatchObject({
      postman: { mcpUrl: "https://mcp.postman.com/full" },
    });
  });

  it("merges global and project config with project precedence", () => {
    writeJson(path.join(tempHomeDir, ".cbx", "cbx_config.json"), {
      postman: { mcpUrl: "https://mcp.postman.com/minimal" },
      stitch: {
        activeProfileName: "prod",
        profiles: {
          prod: { url: "https://prod.example.com", apiKey: "secret" },
        },
      },
    });
    writeJson(path.join(workspaceDir, "cbx_config.json"), {
      postman: { defaultWorkspaceId: "ws_123" },
      stitch: {
        activeProfileName: "staging",
        profiles: { staging: { url: "https://staging.example.com" } },
      },
    });

    const effective = readEffectiveConfig("auto", workspaceDir);
    expect(effective).not.toBeNull();
    expect(effective?.scope).toBe("project");
    expect(effective?.config).toMatchObject({
      postman: {
        mcpUrl: "https://mcp.postman.com/minimal",
        defaultWorkspaceId: "ws_123",
      },
      stitch: {
        activeProfileName: "staging",
        profiles: {
          prod: { url: "https://prod.example.com", apiKey: "secret" },
          staging: { url: "https://staging.example.com" },
        },
      },
    });
  });

  it("ensureConfigExists throws when target config is missing", () => {
    expect(() => ensureConfigExists("project", workspaceDir)).toThrow(
      "cbx_config.json not found",
    );
  });

  it("ensureConfigExists passes when target config exists", () => {
    writeJson(path.join(workspaceDir, "cbx_config.json"), { stitch: {} });
    expect(() => ensureConfigExists("project", workspaceDir)).not.toThrow();
  });

  it("redacts stitch api keys for safe display", () => {
    const redacted = redactConfig({
      stitch: {
        profiles: {
          production: { url: "https://stitch.prod", apiKey: "top-secret" },
        },
      },
    });

    expect(redacted).toMatchObject({
      stitch: {
        profiles: {
          production: {
            url: "https://stitch.prod",
            apiKey: "***REDACTED***",
          },
        },
      },
    });
  });
});
