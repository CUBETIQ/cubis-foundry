import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface DiffEntry {
  path: string;
  action: "create" | "update" | "delete" | "skip-user-override";
  stagingChecksum?: string;
  installedChecksum?: string;
  reason: string;
}

export interface DiffReport {
  platform: string;
  entries: DiffEntry[];
  summary: { create: number; update: number; delete: number; skip: number };
}

// ─── Path convention ───────────────────────────────────────────────────────────
//
// All functions accept a base home directory (e.g. ~ or /tmp/fake).
// resolveFoundryDir() appends ".foundry" to get the foundry home.
// This mirrors setFoundryHomedir(base) which internally appends ".foundry".
//   - foundryDir = resolveFoundryDir(base) = base + ".foundry"
//   - installDir = foundryDir + "/install/<platform>"
//   - stateDir   = foundryDir + "/state/"

function resolveFoundryDir(maybeBaseDir?: string): string {
  if (maybeBaseDir !== undefined) return join(maybeBaseDir, ".foundry");
  if (process.env.FOUNDRY_HOME) return process.env.FOUNDRY_HOME;
  return join(homedir(), ".foundry");
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sha256(filePath: string): string {
  const raw = readFileSync(filePath);
  return createHash("sha256").update(raw).digest("hex");
}

function isUserOverride(installedPath: string, installDir: string): boolean {
  // Files whose basename ends with .<something>.user are user overrides, e.g.
  // rules.yaml.user → basename ends with ".user", preserved even if content differs
  const base = installedPath.split("/").at(-1)!;
  if (/\.[^./]+\.user$/.test(base)) return true;
  if (installedPath.startsWith(join(installDir, "user-rules") + "/")) return true;
  if (installedPath === join(installDir, "rules.preferences.yaml")) return true;
  return false;
}

function collectFiles(dir: string, base: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, base));
    } else {
      results.push(relativePath(base, full));
    }
  }
  return results;
}

function relativePath(base: string, full: string): string {
  return full.slice(base.length + 1).replace(/\\/g, "/");
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Diff each staged asset against the user's currently installed assets.
 *
 * @param stagingDir Absolute path to the temp staging directory.
 * @param platform  Platform identifier (e.g. "claude").
 * @param baseDir   Base home directory (e.g. ~ or /tmp/fake).
 *                  resolveFoundryDir will append ".foundry".
 *                  Defaults to FOUNDRY_HOME or ~/.foundry.
 */
export function diffAgainstInstalled(
  stagingDir: string,
  platform: string,
  baseDir?: string,
): DiffReport {
  const foundryDir = resolveFoundryDir(baseDir);
  const installDir = join(foundryDir, "install", platform);
  const entries: DiffEntry[] = [];

  const stagedFiles = collectFiles(stagingDir, stagingDir);

  for (const rel of stagedFiles) {
    const stagedFull = join(stagingDir, rel);
    const installedFull = join(installDir, rel);
    const stagingChecksum = sha256(stagedFull);

    if (!existsSync(installedFull)) {
      entries.push({
        path: rel,
        action: "create",
        stagingChecksum,
        reason: "file does not exist in install directory",
      });
    } else {
      // Files with a .user. basename are always treated as user overrides
      // and skipped — even if their checksums happen to match.
      // Matches: "rules.yaml.user" (ends with .user) or "config.user.json" (.user. in middle)
      const isUserFile = /\.user(\.|$)/.test(rel.split("/").at(-1)!);
      if (isUserFile) {
        const installedChecksum = sha256(installedFull);
        entries.push({
          path: rel,
          action: "skip-user-override",
          stagingChecksum,
          installedChecksum,
          reason: "user override",
        });
      } else {
        const installedChecksum = sha256(installedFull);
        if (installedChecksum !== stagingChecksum) {
          entries.push({
            path: rel,
            action: "update",
            stagingChecksum,
            installedChecksum,
            reason: "checksum mismatch",
          });
        }
      }
    }
  }

  return {
    platform,
    entries,
    summary: {
      create: entries.filter((e) => e.action === "create").length,
      update: entries.filter((e) => e.action === "update").length,
      delete: entries.filter((e) => e.action === "delete").length,
      skip: entries.filter((e) => e.action === "skip-user-override").length,
    },
  };
}
