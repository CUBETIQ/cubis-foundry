#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CANONICAL_ROOTS = [path.join(ROOT, "workflows", "skills")];
const MIRRORS = {
  copilot: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "copilot",
    "skills",
  ),
  cursor: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "cursor",
    "skills",
  ),
  windsurf: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "windsurf",
    "skills",
  ),
};

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  const onlyArg = argv.find((item, idx) => argv[idx - 1] === "--only") || "all";
  const only = String(onlyArg).toLowerCase();
  return {
    dryRun: args.has("--dry-run"),
    deleteMissing: !args.has("--no-delete"),
    only,
  };
}

async function pathExists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function listSkillDirs(rootDir) {
  if (!(await pathExists(rootDir))) return [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."))
    .sort((a, b) => a.localeCompare(b));
}

async function buildCanonicalSkillSourceMap() {
  const sourceById = new Map();

  for (const root of CANONICAL_ROOTS) {
    if (!(await pathExists(root))) continue;
    const ids = await listSkillDirs(root);
    for (const skillId of ids) {
      const source = path.join(root, skillId);
      const skillFile = path.join(source, "SKILL.md");
      if (!(await pathExists(skillFile))) continue;
      // Later roots override earlier roots (mcp canonical preferred).
      sourceById.set(skillId.toLowerCase(), { id: skillId, source });
    }
  }

  return sourceById;
}

async function syncMirror({
  label,
  mirrorRoot,
  canonicalById,
  dryRun,
  deleteMissing,
}) {
  await fs.mkdir(mirrorRoot, { recursive: true });
  const mirrorSkillIds = await listSkillDirs(mirrorRoot);
  const canonicalIds = [...canonicalById.values()].map((item) => item.id);
  const canonicalSet = new Set(canonicalIds.map((id) => id.toLowerCase()));

  const removed = [];
  if (deleteMissing) {
    for (const mirrorSkillId of mirrorSkillIds) {
      if (!canonicalSet.has(mirrorSkillId.toLowerCase())) {
        const target = path.join(mirrorRoot, mirrorSkillId);
        if (!dryRun) {
          await fs.rm(target, { recursive: true, force: true });
        }
        removed.push(mirrorSkillId);
      }
    }
  }

  const synced = [];
  for (const item of [...canonicalById.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    const destination = path.join(mirrorRoot, item.id);
    if (!dryRun) {
      await fs.rm(destination, { recursive: true, force: true });
      await fs.cp(item.source, destination, { recursive: true });
    }
    synced.push(item.id);
  }

  return {
    label,
    mirrorRoot,
    syncedCount: synced.length,
    removedCount: removed.length,
    dryRun,
  };
}

async function main() {
  const { dryRun, deleteMissing, only } = parseArgs(process.argv);

  const canonicalById = await buildCanonicalSkillSourceMap();
  if (canonicalById.size === 0) {
    throw new Error(
      `No canonical skills found in roots: ${CANONICAL_ROOTS.join(", ")}`,
    );
  }

  const targets =
    only === "all"
      ? Object.entries(MIRRORS)
      : Object.entries(MIRRORS).filter(([label]) => label === only);

  if (targets.length === 0) {
    throw new Error(
      `Unknown --only target '${only}'. Use one of: all, copilot, cursor, windsurf.`,
    );
  }

  for (const [label, mirrorRoot] of targets) {
    const result = await syncMirror({
      label,
      mirrorRoot,
      canonicalById,
      dryRun,
      deleteMissing,
    });

    const prefix = dryRun ? "[dry-run] " : "";
    console.log(
      `${prefix}synced ${result.label}: ${result.syncedCount} skills, removed ${result.removedCount} stale from ${result.mirrorRoot}`,
    );
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
