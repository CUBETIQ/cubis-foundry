import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copyCompiledAssets } from "./stager.js";
import { diffAgainstInstalled, type DiffReport } from "./differ.js";
import { applyStagedAssets, type ApplyResult } from "./applier.js";
import {
  applyInstall,
  previewInstall,
  checkUpgrade,
  removeInstall,
} from "./index.js";
import { setFoundryHomedir } from "../state/platform-state.js";
import type { Asset, CompiledAssets } from "../compiler/types.js";

// ─── Test environment setup ───────────────────────────────��─────────────────────
//
// All installer functions resolve the foundry home directory via:
//   foundryDir ?? process.env.FOUNDRY_HOME ?? ~/.foundry
// Tests set process.env.FOUNDRY_HOME to the fake temp directory so all
// modules (differ, applier, index) agree on the same path.

let _prevFoundryHome: string | undefined;

beforeEach(() => {
  _prevFoundryHome = process.env.FOUNDRY_HOME;
});

afterEach(() => {
  process.env.FOUNDRY_HOME = _prevFoundryHome;
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function makeAsset(relativePath: string, content: string): Asset {
  return { path: relativePath, content, checksum: sha256(content) };
}

/**
 * Creates a fresh fake foundry home directory and wires all modules to it.
 *
 * Convention:
 *   resolveFoundryDir() → base + ".foundry" (e.g. /tmp/base/.foundry)
 *   setFoundryHomedir(base) → creates state at base/.foundry/state/
 *   installDir(base) → base + ".foundry/install" (e.g. /tmp/base/.foundry/install/<platform>)
 *
 * Directory structure:
 *   <baseDir>/
 *     .foundry/
 *       state/
 *       install/
 *         <platform>/
 */
function fakeFoundryHome(): string {
  const baseDir = join(
    tmpdir(),
    `foundry-installer-test-${Date.now()}-${Math.random()}`,
  );
  const foundryDir = join(baseDir, ".foundry");
  // create baseDir/.foundry/{state,install}
  mkdirSync(join(foundryDir, "state"), { recursive: true });
  mkdirSync(join(foundryDir, "install"), { recursive: true });
  // FOUNDRY_HOME is the base dir — resolveFoundryDir appends ".foundry"
  process.env.FOUNDRY_HOME = baseDir;
  // setFoundryHomedir also appends ".foundry" internally
  setFoundryHomedir(baseDir);
  return baseDir; // return BASE dir (resolveFoundryDir will add .foundry)
}

/** Convenience alias. */
function fakeHome(): string {
  return fakeFoundryHome();
}

/**
 * Returns the install directory for a platform.
 * @param baseDir  The user's home base directory (result of fakeHome()).
 *                 resolveFoundryDir() will add ".foundry", so installDir adds just "/install".
 */
function installDir(baseDir: string, platform: string): string {
  return join(baseDir, ".foundry", "install", platform);
}

/**
 * Reads the state file directly from a known path, bypassing the
 * platform-state module's cached _homedir variable.
 */
function readStateDirect(
  baseDir: string,
  platform: string,
): { platform: string; assets: { path: string }[] } | null {
  const stateFile = join(baseDir, ".foundry", "state", `${platform}.json`);
  if (!existsSync(stateFile)) return null;
  return JSON.parse(readFileSync(stateFile, "utf8")) as {
    platform: string;
    assets: { path: string }[];
  };
}

function writeInstalledFile(
  baseDir: string,
  platform: string,
  relativePath: string,
  content: string,
): void {
  const full = join(installDir(baseDir, platform), relativePath);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content, "utf8");
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("stager.ts", () => {
  describe("copyCompiledAssets()", () => {
    it("creates a staging directory with all assets written to correct paths", () => {
      const assets: Asset[] = [
        makeAsset("rules/core.yaml", "rules content"),
        makeAsset("contexts/CLAUDE.md", "# CLAUDE context"),
      ];

      const stagingDir = copyCompiledAssets(assets, "claude");

      expect(existsSync(stagingDir)).toBe(true);
      expect(stagingDir).toContain("foundry-staging");
      expect(
        readFileSync(join(stagingDir, "rules/core.yaml"), "utf8"),
      ).toBe("rules content");
      expect(
        readFileSync(join(stagingDir, "contexts/CLAUDE.md"), "utf8"),
      ).toBe("# CLAUDE context");
    });

    it("uses the platform name as a subdirectory one level below the uuid", () => {
      const assets: Asset[] = [makeAsset("foo.txt", "bar")];
      const stagingDir = copyCompiledAssets(assets, "gemini");
      // Structure: /tmp/foundry-staging/<uuid>/gemini/
      const parts = stagingDir.split("/");
      // parts.at(-1) = "gemini"
      expect(parts.at(-1)).toBe("gemini");
    });

    it("creates nested directories for subdirectory asset paths", () => {
      const assets: Asset[] = [
        makeAsset("deep/nested/path/file.txt", "nested content"),
      ];
      const stagingDir = copyCompiledAssets(assets, "copilot");
      expect(
        existsSync(join(stagingDir, "deep/nested/path/file.txt")),
      ).toBe(true);
    });

    it("returns an absolute path", () => {
      const stagingDir = copyCompiledAssets(
        [makeAsset("x.txt", "y")],
        "codex",
      );
      expect(stagingDir).toBe(join(stagingDir));
    });
  });
});

describe("differ.ts", () => {
  describe("diffAgainstInstalled()", () => {
    it("returns 'create' action for a new file not yet in install dir", () => {
      const home = fakeHome();
      const assets: Asset[] = [makeAsset("rules/core.yaml", "new rules")];
      const sd = copyCompiledAssets(assets, "claude");
      const report = diffAgainstInstalled(sd, "claude", home);

      expect(report.platform).toBe("claude");
      expect(report.entries).toHaveLength(1);
      expect(report.entries[0]!.action).toBe("create");
      expect(report.entries[0]!.path).toBe("rules/core.yaml");
      expect(report.summary.create).toBe(1);
    });

    it("returns 'update' action when checksums differ for a non-user file", () => {
      const home = fakeHome();
      writeInstalledFile(home, "claude", "rules/core.yaml", "old content");
      const assets: Asset[] = [
        makeAsset("rules/core.yaml", "new content"),
      ];
      const sd = copyCompiledAssets(assets, "claude");
      const report = diffAgainstInstalled(sd, "claude", home);

      expect(report.entries).toHaveLength(1);
      expect(report.entries[0]!.action).toBe("update");
      expect(report.summary.update).toBe(1);
    });

    it("returns 'skip-user-override' when a .user.* file has different checksum", () => {
      const home = fakeHome();
      const userFileContent = "my custom rules";
      writeInstalledFile(home, "claude", "rules.yaml.user", userFileContent);
      const userFileChecksum = sha256(userFileContent);

      const assets: Asset[] = [
        makeAsset("rules.yaml.user", "generated version"),
      ];
      const sd = copyCompiledAssets(assets, "claude");
      const report = diffAgainstInstalled(sd, "claude", home);

      expect(report.entries).toHaveLength(1);
      expect(report.entries[0]!.action).toBe("skip-user-override");
      expect(report.entries[0]!.reason).toBe("user override");
      expect(report.entries[0]!.installedChecksum).toBe(userFileChecksum);
      expect(report.summary.skip).toBe(1);
    });

    it("returns no entry when checksums match", () => {
      const home = fakeHome();
      const content = "identical content";
      writeInstalledFile(home, "claude", "rules/core.yaml", content);
      const assets: Asset[] = [makeAsset("rules/core.yaml", content)];
      const sd = copyCompiledAssets(assets, "claude");
      const report = diffAgainstInstalled(sd, "claude", home);

      expect(report.entries).toHaveLength(0);
    });

    it("handles multiple files with mixed actions", () => {
      const home = fakeHome();
      // File 1: same checksum → no entry
      writeInstalledFile(home, "claude", "rules/core.yaml", "same");
      // File 2: different checksum → update
      writeInstalledFile(home, "claude", "contexts/CLAUDE.md", "old");
      // File 3: doesn't exist → create
      const assets: Asset[] = [
        makeAsset("rules/core.yaml", "same"),
        makeAsset("contexts/CLAUDE.md", "newer"),
        makeAsset("contexts/AGENTS.md", "brand new"),
      ];
      const sd = copyCompiledAssets(assets, "claude");
      const report = diffAgainstInstalled(sd, "claude", home);

      expect(report.entries).toHaveLength(2);
      const paths = new Set(report.entries.map((e) => e.path));
      expect(paths).toContain("contexts/CLAUDE.md");
      expect(paths).toContain("contexts/AGENTS.md");
    });

    it("detects user-override files by path containing .user.", () => {
      const home = fakeHome();
      writeInstalledFile(home, "claude", "config.user.json", "user config");
      const assets: Asset[] = [
        makeAsset("config.user.json", "staged config"),
      ];
      const sd = copyCompiledAssets(assets, "claude");
      const report = diffAgainstInstalled(sd, "claude", home);

      expect(report.entries).toHaveLength(1);
      expect(report.entries[0]!.action).toBe("skip-user-override");
    });

    it("sets correct summary counts", () => {
      const home = fakeHome();
      const assets: Asset[] = [
        makeAsset("new.txt", "new"),
        makeAsset("updated.txt", "updated"),
      ];
      writeInstalledFile(home, "claude", "updated.txt", "old");
      const sd = copyCompiledAssets(assets, "claude");
      const report = diffAgainstInstalled(sd, "claude", home);

      expect(report.summary.create).toBe(1);
      expect(report.summary.update).toBe(1);
      expect(report.summary.skip).toBe(0);
      expect(report.summary.delete).toBe(0);
    });
  });
});

describe("applier.ts", () => {
  describe("applyStagedAssets()", () => {
    it("copies each staged file to the install directory", () => {
      const home = fakeHome();
      const assets: Asset[] = [
        makeAsset("rules/core.yaml", "rules content"),
        makeAsset("contexts/AGENTS.md", "# AGENTS context"),
      ];
      const sd = copyCompiledAssets(assets, "copilot");

      const result = applyStagedAssets(sd, "copilot", home);

      expect(result.applied).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(
        readFileSync(
          join(installDir(home, "copilot"), "rules/core.yaml"),
          "utf8",
        ),
      ).toBe("rules content");
      expect(
        readFileSync(
          join(installDir(home, "copilot"), "contexts/AGENTS.md"),
          "utf8",
        ),
      ).toBe("# AGENTS context");
    });

    it("skips files whose path contains .user.", () => {
      const home = fakeHome();
      const assets: Asset[] = [
        makeAsset("rules/core.yaml", "regular"),
        makeAsset("rules.yaml.user", "user override content"),
      ];
      const sd = copyCompiledAssets(assets, "copilot");

      const result = applyStagedAssets(sd, "copilot", home);

      expect(result.applied).toBe(1);
      expect(result.skipped).toBe(1);
      expect(
        existsSync(join(installDir(home, "copilot"), "rules/core.yaml")),
      ).toBe(true);
      expect(
        existsSync(join(installDir(home, "copilot"), "rules.yaml.user")),
      ).toBe(false);
    });

    it("updates install state after applying", () => {
      const home = fakeHome();
      const assets: Asset[] = [
        makeAsset("rules/core.yaml", "rules content"),
      ];
      const sd = copyCompiledAssets(assets, "copilot");

      applyStagedAssets(sd, "copilot", home);

      // Use readStateDirect to bypass the platform-state module's cached _homedir
      const state = readStateDirect(home, "copilot");
      expect(state).not.toBeNull();
      expect(state!.platform).toBe("copilot");
      expect(state!.assets.some((a) => a.path === "rules/core.yaml")).toBe(
        true,
      );
    });

    it("records no errors for a normal successful apply", () => {
      const home = fakeHome();
      const assets: Asset[] = [makeAsset("test.txt", "ok")];
      const sd = copyCompiledAssets(assets, "copilot");

      const result = applyStagedAssets(sd, "copilot", home);

      expect(result.applied).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it("creates intermediate directories when applying nested files", () => {
      const home = fakeHome();
      const assets: Asset[] = [
        makeAsset("deep/nested/file.txt", "nested"),
      ];
      const sd = copyCompiledAssets(assets, "copilot");

      applyStagedAssets(sd, "copilot", home);

      const targetFile = join(
        installDir(home, "copilot"),
        "deep/nested/file.txt",
      );
      expect(existsSync(targetFile)).toBe(true);
      expect(readFileSync(targetFile, "utf8")).toBe("nested");
    });
  });
});

describe("index.ts — orchestrator", () => {
  describe("applyInstall()", () => {
    it("applies multiple platform bundles and returns per-platform results", () => {
      const home = fakeHome();
      const bundles: CompiledAssets[] = [
        {
          platform: "claude",
          assets: [makeAsset("claude.txt", "claude content")],
          outputDir: "/tmp/out",
        },
        {
          platform: "codex",
          assets: [makeAsset("codex.txt", "codex content")],
          outputDir: "/tmp/out",
        },
      ];

      const results = applyInstall(bundles, home);

      expect(results).toHaveLength(2);
      expect(results[0]!.platform).toBe("claude");
      expect(results[0]!.applied).toBe(1);
      expect(results[1]!.platform).toBe("codex");
      expect(results[1]!.applied).toBe(1);
      expect(
        readFileSync(
          join(installDir(home, "claude"), "claude.txt"),
          "utf8",
        ),
      ).toBe("claude content");
      expect(
        readFileSync(
          join(installDir(home, "codex"), "codex.txt"),
          "utf8",
        ),
      ).toBe("codex content");
    });

    it("skips .user files during applyInstall", () => {
      const home = fakeHome();
      const bundles: CompiledAssets[] = [
        {
          platform: "gemini",
          assets: [
            makeAsset("rules.yaml", "generated"),
            makeAsset("rules.yaml.user", "user version"),
          ],
          outputDir: "/tmp/out",
        },
      ];

      const results = applyInstall(bundles, home);

      expect(results[0]!.applied).toBe(1);
      expect(results[0]!.skipped).toBe(1);
      expect(
        existsSync(join(installDir(home, "gemini"), "rules.yaml")),
      ).toBe(true);
      expect(
        existsSync(join(installDir(home, "gemini"), "rules.yaml.user")),
      ).toBe(false);
    });
  });

  describe("previewInstall()", () => {
    it("returns DiffReport for each bundle without modifying the install dir", () => {
      const home = fakeHome();
      const bundles: CompiledAssets[] = [
        {
          platform: "claude",
          assets: [makeAsset("new.txt", "new content")],
          outputDir: "/tmp/out",
        },
      ];

      const reports = previewInstall(bundles, home);

      expect(reports).toHaveLength(1);
      expect(reports[0]!.platform).toBe("claude");
      expect(reports[0]!.entries).toHaveLength(1);
      expect(reports[0]!.entries[0]!.action).toBe("create");
      // Confirm no file was actually written to install dir
      expect(
        existsSync(join(installDir(home, "claude"), "new.txt")),
      ).toBe(false);
    });
  });

  describe("checkUpgrade()", () => {
    it("returns needsUpgrade: true when installed files differ from staged", () => {
      const home = fakeHome();
      writeInstalledFile(home, "claude", "rules.yaml", "old content");

      const bundle: CompiledAssets = {
        platform: "claude",
        assets: [makeAsset("rules.yaml", "new content")],
        outputDir: "/tmp/out",
      };

      const { needsUpgrade, diff } = checkUpgrade(bundle, home);

      expect(needsUpgrade).toBe(true);
      expect(diff).not.toBeNull();
      expect(diff!.entries).toHaveLength(1);
      expect(diff!.entries[0]!.action).toBe("update");
    });

    it("returns needsUpgrade: false when checksums match", () => {
      const home = fakeHome();
      const content = "identical";
      writeInstalledFile(home, "claude", "rules.yaml", content);

      const bundle: CompiledAssets = {
        platform: "claude",
        assets: [makeAsset("rules.yaml", content)],
        outputDir: "/tmp/out",
      };

      const { needsUpgrade, diff } = checkUpgrade(bundle, home);

      expect(needsUpgrade).toBe(false);
      expect(diff).not.toBeNull();
      expect(diff!.entries).toHaveLength(0);
    });
  });

  describe("removeInstall()", () => {
    it("removes the entire platform install directory when paths is empty", () => {
      const home = fakeHome();
      writeInstalledFile(home, "claude", "rules.yaml", "rules");
      writeInstalledFile(home, "claude", "contexts/CLAUDE.md", "context");

      removeInstall("claude", [], home);

      expect(existsSync(join(installDir(home, "claude")))).toBe(false);
      const state = readStateDirect(home, "claude");
      expect(state).toBeNull();
    });

    it("removes only specified paths when paths array is non-empty", () => {
      const home = fakeHome();
      writeInstalledFile(home, "claude", "keep.txt", "keep me");
      writeInstalledFile(home, "claude", "remove.txt", "remove me");

      removeInstall("claude", ["remove.txt"], home);

      expect(
        existsSync(join(installDir(home, "claude"), "keep.txt")),
      ).toBe(true);
      expect(
        existsSync(join(installDir(home, "claude"), "remove.txt")),
      ).toBe(false);
      const state = readStateDirect(home, "claude");
      expect(state).toBeNull();
    });

    it("is idempotent — does not throw if platform is not installed", () => {
      const home = fakeHome();
      expect(() => removeInstall("never-installed", [], home)).not.toThrow();
    });
  });
});

describe("integration: checksums match after apply", () => {
  it("installed files have the same checksum as the staged assets", () => {
    const home = fakeHome();
    const platform = "antigravity";
    const assets: Asset[] = [
      makeAsset("rules/core.yaml", "rules content here"),
      makeAsset("contexts/GEMINI.md", "# Gemini context"),
    ];
    const sd = copyCompiledAssets(assets, platform);

    applyStagedAssets(sd, platform, home);

    for (const asset of assets) {
      const installedPath = join(installDir(home, platform), asset.path);
      expect(existsSync(installedPath)).toBe(true);
      expect(sha256(readFileSync(installedPath, "utf8"))).toBe(
        asset.checksum,
      );
    }
  });
});
