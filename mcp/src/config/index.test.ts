import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadServerConfig } from "./index.js";
import { rejectCredentialFields } from "./schema.js";

const tempDirs: string[] = [];

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("config loading", () => {
  it("loads an explicit config file and applies schema defaults", () => {
    const dir = createTempDir("mcp-config-");
    const configPath = path.join(dir, "config.json");

    writeFileSync(
      configPath,
      JSON.stringify({
        server: { name: "cubis-foundry-mcp", version: "0.1.0" },
        vault: { roots: ["../workflows/skills"] },
        transport: { default: "stdio" },
      }),
      "utf8",
    );

    const config = loadServerConfig(configPath);
    expect(config.server.name).toBe("cubis-foundry-mcp");
    expect(config.vault.summaryMaxLength).toBe(200);
  });

  it("throws for a missing config file", () => {
    expect(() => loadServerConfig("/definitely/missing/config.json")).toThrow(
      "Cannot read server config",
    );
  });

  it("throws for an invalid config shape", () => {
    const dir = createTempDir("mcp-config-invalid-");
    const configPath = path.join(dir, "config.json");
    writeFileSync(configPath, JSON.stringify({ transport: {} }), "utf8");

    expect(() => loadServerConfig(configPath)).toThrow("Invalid server config");
  });
});

describe("credential field rejection", () => {
  it("rejects forbidden credential keys anywhere in config", () => {
    expect(() =>
      rejectCredentialFields({
        stitch: {
          profiles: {
            production: { apiKey: "secret" },
          },
        },
      }),
    ).toThrow('must not contain credential field "apiKey"');
  });

  it("allows safe non-secret config fields", () => {
    expect(() =>
      rejectCredentialFields({
        server: { name: "ok", version: "1.0.0" },
        vault: { roots: ["../workflows/skills"] },
      }),
    ).not.toThrow();
  });
});
