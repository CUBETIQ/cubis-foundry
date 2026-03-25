import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearState,
  listInstalledPlatforms,
  patchState,
  readState,
  writeState,
  type InstallState,
} from "./index.js";
import { setFoundryHomedir } from "./platform-state.js";

function makeState(platform: string, version = "1.0.0"): InstallState {
  return {
    schemaVersion: 1,
    platform,
    version,
    installedAt: new Date().toISOString(),
    assets: [],
  };
}

describe("state", () => {
  let tmp: string;

  /**
   * Creates a fresh temp directory AND configures getStatePath / listInstalledPlatforms
   * to use it.  Call this at the START of every test so the module-level homedir is
   always correct.
   */
  function useFakeHome(): string {
    const dir = join(tmpdir(), `foundry-state-test-${Date.now()}-${Math.random()}`);
    mkdirSync(join(dir, ".foundry", "state"), { recursive: true });
    setFoundryHomedir(dir);
    return dir;
  }

  beforeEach(() => {
    tmp = useFakeHome();
  });

  // ── readState ────────────────────────────────────────────────────────────────

  describe("readState()", () => {
    it("returns null when no state file exists for the platform", () => {
      expect(readState("nonexistent-platform")).toBeNull();
    });

    it("returns the state after it has been written", () => {
      const state = makeState("claude", "2.1.0");
      writeState("claude", state);
      const result = readState("claude");
      expect(result).not.toBeNull();
      expect(result!.platform).toBe("claude");
      expect(result!.version).toBe("2.1.0");
      expect(result!.schemaVersion).toBe(1);
    });

    it("round-trips assets through read/write", () => {
      const state: InstallState = {
        schemaVersion: 1,
        platform: "copilot",
        version: "0.9.0",
        installedAt: "2026-01-15T10:00:00.000Z",
        assets: [
          {
            path: "docs/rules.md",
            checksum: "abc123def456",
            installedAt: "2026-01-15T10:00:01.000Z",
            sourceModule: "rules-core",
          },
        ],
      };
      writeState("copilot", state);
      expect(readState("copilot")).toEqual(state);
    });
  });

  // ── writeState ───────────────────────────────────────────────────────────────

  describe("writeState()", () => {
    it("creates the ~/.foundry/state/ directory if it does not exist", () => {
      const emptyDir = join(
        tmpdir(),
        `foundry-state-test-empty-${Date.now()}-${Math.random()}`,
      );
      // Point getStatePath at the empty dir (no .foundry/state/ inside yet).
      setFoundryHomedir(emptyDir);
      writeState("gemini", makeState("gemini"));
      const expected = join(emptyDir, ".foundry", "state", "gemini.json");
      expect(existsSync(expected)).toBe(true);
    });

    it("writes pretty-printed JSON", () => {
      const state = makeState("codex");
      writeState("codex", state);
      const raw = readFileSync(
        join(tmp, ".foundry", "state", "codex.json"),
        "utf8",
      );
      expect(raw).toContain("\n");
      expect(JSON.parse(raw)).toEqual(state);
    });
  });

  // ── patchState ───────────────────────────────────────────────────────────────

  describe("patchState()", () => {
    it("applies the updater to the existing state", () => {
      writeState("antigravity", makeState("antigravity", "1.0.0"));
      const patched = patchState("antigravity", (s) => ({
        ...(s ?? makeState("antigravity")),
        version: "2.0.0",
      }));
      expect(patched.version).toBe("2.0.0");
      // Confirm the file was also updated.
      expect(readState("antigravity")!.version).toBe("2.0.0");
    });

    it("passes null to the updater when no state exists", () => {
      let receivedState: InstallState | null = "UNSET" as unknown as null;
      patchState("brand-new-platform", (s) => {
        receivedState = s;
        return makeState("brand-new-platform");
      });
      expect(receivedState).toBeNull();
    });

    it("can add assets to an existing state", () => {
      writeState("claude", makeState("claude"));
      patchState("claude", (s) => ({
        ...s!,
        assets: [
          ...s!.assets,
          {
            path: "rules/CORE.md",
            checksum: "deadbeef",
            installedAt: new Date().toISOString(),
            sourceModule: "rules-core",
          },
        ],
      }));
      const result = readState("claude");
      expect(result!.assets).toHaveLength(1);
      expect(result!.assets[0]!.path).toBe("rules/CORE.md");
    });
  });

  // ── listInstalledPlatforms ────────────────────────────────────────────────────

  describe("listInstalledPlatforms()", () => {
    it("returns an empty array when the state directory does not exist", () => {
      // Point at a directory that has no .foundry/state/ at all.
      const nonexistent = join(
        tmpdir(),
        `foundry-state-nonexistent-${Date.now()}-${Math.random()}`,
      );
      setFoundryHomedir(nonexistent);
      expect(listInstalledPlatforms()).toEqual([]);
    });

    it("returns platforms that have state files", () => {
      writeState("claude", makeState("claude"));
      writeState("copilot", makeState("copilot"));
      writeState("gemini", makeState("gemini"));
      const platforms = listInstalledPlatforms().sort();
      expect(platforms).toEqual(["claude", "copilot", "gemini"]);
    });

    it("ignores non-.json files in the state directory", () => {
      writeState("claude", makeState("claude"));
      // Drop a non-JSON file into the state dir.
      writeFileSync(
        join(tmp, ".foundry", "state", "README.txt"),
        "ignore me",
      );
      expect(listInstalledPlatforms()).toEqual(["claude"]);
    });
  });

  // ── clearState ───────────────────────────────────────────────────────────────

  describe("clearState()", () => {
    it("deletes the state file for a platform", () => {
      writeState("claude", makeState("claude"));
      expect(readState("claude")).not.toBeNull();
      clearState("claude");
      expect(readState("claude")).toBeNull();
    });

    it("is idempotent — clearing a platform that does not exist does not throw", () => {
      expect(() => clearState("never-existed")).not.toThrow();
    });

    it("only removes the targeted platform's state file", () => {
      writeState("claude", makeState("claude"));
      writeState("copilot", makeState("copilot"));
      clearState("claude");
      expect(readState("copilot")).not.toBeNull();
      expect(readState("claude")).toBeNull();
    });
  });
});
