import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { rmSync } from "node:fs";
import { copyCompiledAssets } from "./stager.js";
import { diffAgainstInstalled, type DiffReport } from "./differ.js";
import { applyStagedAssets, type ApplyResult } from "./applier.js";
import type { CompiledAssets } from "../compiler/types.js";
import { clearState } from "../state/index.js";
import { setFoundryHomedir } from "../state/platform-state.js";

// ─── Foundry directory resolution ───────────────────────────────────────────────

function resolveFoundryDir(maybeBaseDir?: string): string {
  if (maybeBaseDir) return join(maybeBaseDir, ".foundry");
  if (process.env.FOUNDRY_HOME) return process.env.FOUNDRY_HOME;
  return join(homedir(), ".foundry");
}

// ─── Orchestrator ─────────��───────────────────────────────────────────────────

/**
 * Install one or more compiled asset bundles.
 *
 * Stages, diffs, and applies each platform in sequence.
 * Returns per-platform ApplyResult.
 *
 * @param baseDir Override: user's home base directory.
 *                  resolveFoundryDir will append ".foundry".
 *                  Defaults to FOUNDRY_HOME or ~/.foundry.
 */
export function applyInstall(
  compiledAssets: CompiledAssets[],
  baseDir?: string,
): ApplyResult[] {
  const foundryDir = resolveFoundryDir(baseDir);
  const results: ApplyResult[] = [];

  for (const bundle of compiledAssets) {
    const stagingDir = copyCompiledAssets(bundle.assets, bundle.platform);
    const result = applyStagedAssets(stagingDir, bundle.platform, baseDir);
    results.push(result);
  }

  return results;
}

/**
 * Preview an install — returns diff reports for each platform without applying.
 *
 * @param baseDir Override: user's home base directory.
 */
export function previewInstall(
  compiledAssets: CompiledAssets[],
  baseDir?: string,
): DiffReport[] {
  const foundryDir = resolveFoundryDir(baseDir);
  const reports: DiffReport[] = [];

  for (const bundle of compiledAssets) {
    const stagingDir = copyCompiledAssets(bundle.assets, bundle.platform);
    const report = diffAgainstInstalled(stagingDir, bundle.platform, baseDir);
    reports.push(report);
  }

  return reports;
}

/**
 * Check whether an installed platform needs an upgrade.
 *
 * @param bundle   The CompiledAssets to diff against the install.
 * @param baseDir Override: user's home base directory.
 */
export function checkUpgrade(
  bundle: CompiledAssets,
  baseDir?: string,
): { needsUpgrade: boolean; diff: DiffReport | null } {
  const foundryDir = resolveFoundryDir(baseDir);
  const stagingDir = copyCompiledAssets(bundle.assets, bundle.platform);
  const diff = diffAgainstInstalled(stagingDir, bundle.platform, baseDir);

  const hasChanges = diff.entries.some(
    (e) => e.action === "create" || e.action === "update",
  );

  return { needsUpgrade: hasChanges, diff };
}

/**
 * Remove installed files for a platform and clear its state.
 *
 * @param platform  Platform identifier (e.g. "claude").
 * @param paths    Specific file paths (relative to the install dir) to remove.
 *                Pass an empty array to remove the entire platform install directory.
 * @param baseDir  Override: user's home base directory.
 */
export function removeInstall(
  platform: string,
  paths: string[] = [],
  baseDir?: string,
): void {
  const foundryDir = resolveFoundryDir(baseDir);
  const installDir = join(foundryDir, "install", platform);

  if (paths.length === 0) {
    try {
      rmSync(installDir, { recursive: true, force: true });
    } catch {
      // Already absent — idempotent
    }
  } else {
    for (const relativePath of paths) {
      const full = join(installDir, relativePath);
      try {
        rmSync(full, { force: true });
      } catch {
        // Already absent
      }
    }
  }

  // Clear the state file — the state module needs the home base dir (not .foundry)
  const baseHome = baseDir ?? process.env.FOUNDRY_HOME
    ? dirname(process.env.FOUNDRY_HOME!)
    : join(homedir(), ".foundry");
  const savedHome = homedir();
  setFoundryHomedir(baseHome);
  try {
    clearState(platform);
  } finally {
    setFoundryHomedir(savedHome);
  }
}

// ─── Re-exports ──────────────────���─────────────────────────────────────────────

export { copyCompiledAssets } from "./stager.js";
export { diffAgainstInstalled } from "./differ.js";
export type { DiffEntry, DiffReport } from "./differ.js";
export { applyStagedAssets } from "./applier.js";
export type { ApplyResult } from "./applier.js";
