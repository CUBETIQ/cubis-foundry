import { copyFileSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";
import { diffAgainstInstalled } from "./differ.js";
import type { DiffReport } from "./differ.js";
import {
  patchState,
  type InstallState,
  type InstalledAsset,
} from "../state/index.js";
import { setFoundryHomedir } from "../state/platform-state.js";

export interface ApplyResult {
  platform: string;
  applied: number;
  skipped: number;
  errors: string[];
}

// ─── Path convention ─────────────────────────────────────────────────────────
//
// resolveFoundryDir(base) = base + ".foundry"   (mirrors setFoundryHomedir)
// installDir(base)         = base + ".foundry" + "/install/<platform>"
// setFoundryHomedir(base) creates state at base + ".foundry" + "/state/"

function resolveFoundryDir(maybeBaseDir?: string): string {
  if (maybeBaseDir !== undefined) return join(maybeBaseDir, ".foundry");
  if (process.env.FOUNDRY_HOME) return process.env.FOUNDRY_HOME;
  return join(homedir(), ".foundry");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sha256(filePath: string): string {
  const raw = readFileSync(filePath);
  return createHash("sha256").update(raw).digest("hex");
}

function isSkippedFile(relativePath: string): boolean {
  // Files that end with .user (before the extension) are user overrides, e.g.
  // rules.yaml.user → basename ends with ".user", content differs from generated
  const base = relativePath.split("/").at(-1)!;
  return /\.[^./]+\.user$/.test(base);
}

function collectFiles(dir: string, base: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, base));
    } else {
      results.push(full.slice(base.length + 1).replace(/\\/g, "/"));
    }
  }
  return results;
}

// ─── Public API ────────────────────────────────────────────────���────────────

/**
 * Apply staged assets to the install directory.
 *
 * Copies each file from stagingDir/ to <baseDir>/.foundry/install/<platform>/
 * Skips files whose path contains `.user.`
 * Updates the install state after a successful apply.
 *
 * @param stagingDir Absolute path to the temp staging directory.
 * @param platform  Platform identifier (e.g. "claude").
 * @param baseDir   Base home directory (e.g. ~ or /tmp/fake).
 *                  resolveFoundryDir will append ".foundry".
 *                  Defaults to FOUNDRY_HOME or ~/.foundry.
 */
export function applyStagedAssets(
  stagingDir: string,
  platform: string,
  baseDir?: string,
): ApplyResult {
  const foundryDir = resolveFoundryDir(baseDir);
  const installDir = join(foundryDir, "install", platform);
  const errors: string[] = [];
  let applied = 0;
  let skipped = 0;

  const stagedFiles = collectFiles(stagingDir, stagingDir);

  for (const rel of stagedFiles) {
    if (isSkippedFile(rel)) {
      skipped += 1;
      continue;
    }

    const src = join(stagingDir, rel);
    const dest = join(installDir, rel);

    try {
      mkdirSync(join(dest, ".."), { recursive: true });
      copyFileSync(src, dest);
      applied += 1;
    } catch (err) {
      errors.push(
        `${rel}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Update state on success
  if (errors.length === 0) {
    const diff = diffAgainstInstalled(stagingDir, platform, baseDir);
    try {
      updateInstallState(
        platform,
        diff,
        baseDir,
        stagedFiles,
        (rel) => sha256(join(stagingDir, rel)),
      );
    } catch (err) {
      errors.push(
        `state update failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { platform, applied, skipped, errors };
}

// ─── State update ───────────────────────────────────────────────────────────

/**
 * Updates the install state file.
 *
 * The state module stores state at: <baseDir>/.foundry/state/<platform>.json
 * where <baseDir> is what was passed to setFoundryHomedir.
 *
 * Since the installer works with baseDir, we call setFoundryHomedir(baseDir)
 * to correctly direct state operations to baseDir + ".foundry/state/".
 */
function updateInstallState(
  platform: string,
  diff: DiffReport,
  baseDir: string | undefined,
  stagedFiles: string[],
  getStagingChecksum: (rel: string) => string,
): void {
  const now = new Date().toISOString();

  // setFoundryHomedir expects the base home dir (it appends ".foundry" internally)
  // FOUNDRY_HOME is the base dir, baseDir is also the base dir
  const stateHome = baseDir ?? (process.env.FOUNDRY_HOME ?? homedir());

  const savedHome = homedir();
  if (savedHome === stateHome) {
    patchState(platform, buildPatchFn(diff, now, stagedFiles, getStagingChecksum));
    return;
  }

  setFoundryHomedir(stateHome);
  try {
    patchState(platform, buildPatchFn(diff, now, stagedFiles, getStagingChecksum));
  } finally {
    setFoundryHomedir(savedHome);
  }
}

function buildPatchFn(
  diff: DiffReport,
  now: string,
  stagedFiles: string[],
  getStagingChecksum: (rel: string) => string,
): (existing: InstallState | null) => InstallState {
  // Build a set of paths that are user overrides (skipped during install)
  const skippedPaths = new Set(
    diff.entries
      .filter((e) => e.action === "skip-user-override")
      .map((e) => e.path),
  );

  return (existing): InstallState => {
    // Collect previously-installed assets that are still on disk
    const prevAssets: Map<string, InstalledAsset> = new Map();
    if (existing) {
      for (const asset of existing.assets) {
        prevAssets.set(asset.path, asset);
      }
    }

    // Record every staged, non-skipped file in the state.
    // This ensures the state reflects the full installed manifest so that
    // future upgrade checks can correctly determine what is already current.
    const updatedAssets: InstalledAsset[] = [];
    for (const rel of stagedFiles) {
      if (skippedPaths.has(rel)) continue;
      const checksum = getStagingChecksum(rel);
      const prevAsset = prevAssets.get(rel);
      updatedAssets.push({
        path: rel,
        checksum,
        installedAt: now,
        sourceModule: prevAsset?.sourceModule ?? "foundry-core",
      });
    }

    // Carry forward any installed assets not present in this staging run
    if (existing) {
      for (const asset of existing.assets) {
        if (!stagedFiles.includes(asset.path)) {
          updatedAssets.push(asset);
        }
      }
    }

    return {
      schemaVersion: 1,
      platform: diff.platform,
      version: existing?.version ?? "1.0.0",
      installedAt: now,
      assets: updatedAssets,
    };
  };
}
