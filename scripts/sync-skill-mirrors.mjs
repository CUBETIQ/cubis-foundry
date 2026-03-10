#!/usr/bin/env node

import path from "node:path";
import os from "node:os";
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
  claude: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "claude",
    "skills",
  ),
};

const COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS = new Set([
  "compatibility",
  "description",
  "license",
  "metadata",
  "name",
]);

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  const onlyArg = argv.find((item, idx) => argv[idx - 1] === "--only") || "all";
  const only = String(onlyArg).toLowerCase();
  return {
    check: args.has("--check"),
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

function extractFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: "", body: markdown, matched: false };
  return {
    frontmatter: match[1],
    body: markdown.slice(match[0].length),
    matched: true,
  };
}

function sanitizeSkillMarkdownForCopilot(markdown) {
  const extracted = extractFrontmatter(markdown);
  if (!extracted.matched) return markdown;

  const lines = extracted.frontmatter.split(/\r?\n/);
  const kept = [];
  let skipUnsupportedKey = null;

  for (const line of lines) {
    if (skipUnsupportedKey) {
      const isTopLevelKey =
        /^([A-Za-z0-9_-]+)\s*:/.test(line) && !/^\s/.test(line);
      if (!isTopLevelKey) {
        continue;
      }
      skipUnsupportedKey = null;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (!keyMatch || /^\s/.test(line)) {
      kept.push(line);
      continue;
    }

    const key = keyMatch[1];
    if (COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS.has(key)) {
      kept.push(line);
      continue;
    }

    const inlineArray = /\[[\s\S]*\]\s*$/.test(line);
    if (!inlineArray) {
      skipUnsupportedKey = key;
    }
  }

  const cleanedFrontmatter = kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
  const bodyWithoutLeadingNewlines = extracted.body.replace(/^(?:\r?\n)+/, "");
  return `---\n${cleanedFrontmatter}\n---\n${bodyWithoutLeadingNewlines}`;
}

async function copyFilteredSkillDir(source, destination, label, depth = 0) {
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyFilteredSkillDir(sourcePath, destinationPath, label, depth + 1);
      continue;
    }

    if (!entry.isFile()) continue;
    if (entry.name === "POWER.md") continue;
    if (
      depth === 0 &&
      entry.name.endsWith(".md") &&
      entry.name !== "SKILL.md"
    ) {
      continue;
    }

    if (label === "copilot" && entry.name === "SKILL.md") {
      const raw = await fs.readFile(sourcePath, "utf8");
      await fs.writeFile(
        destinationPath,
        sanitizeSkillMarkdownForCopilot(raw),
        "utf8",
      );
      continue;
    }

    await fs.copyFile(sourcePath, destinationPath);
  }
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
      await copyFilteredSkillDir(item.source, destination, label);
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

async function collectFiles(rootDir) {
  const files = new Map();

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const relativePath = path.relative(rootDir, fullPath);
      const content = await fs.readFile(fullPath, "utf8");
      files.set(relativePath, content);
    }
  }

  if (await pathExists(rootDir)) {
    await walk(rootDir);
  }

  return files;
}

async function checkMirror({ label, mirrorRoot, canonicalById }) {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), `cbx-skill-mirror-${label}-`),
  );
  const expectedRoot = path.join(tempRoot, label);

  try {
    await syncMirror({
      label,
      mirrorRoot: expectedRoot,
      canonicalById,
      dryRun: false,
      deleteMissing: true,
    });

    const expectedFiles = await collectFiles(expectedRoot);
    const actualFiles = await collectFiles(mirrorRoot);
    const problems = [];

    actualFiles.delete("skills_index.json");

    for (const [relativePath, expectedContent] of expectedFiles) {
      if (!actualFiles.has(relativePath)) {
        problems.push(`missing ${relativePath}`);
        continue;
      }

      const actualContent = actualFiles.get(relativePath);
      if (actualContent !== expectedContent) {
        problems.push(`stale ${relativePath}`);
      }
    }

    for (const relativePath of actualFiles.keys()) {
      if (!expectedFiles.has(relativePath)) {
        problems.push(`unexpected ${relativePath}`);
      }
    }

    return {
      label,
      mirrorRoot,
      ok: problems.length === 0,
      problems,
    };
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

async function main() {
  const { check, dryRun, deleteMissing, only } = parseArgs(process.argv);

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
      `Unknown --only target '${only}'. No mirror targets configured.`,
    );
  }

  if (check) {
    let hasProblems = false;

    for (const [label, mirrorRoot] of targets) {
      const result = await checkMirror({ label, mirrorRoot, canonicalById });
      if (result.ok) {
        console.log(`checked ${label}: OK (${result.mirrorRoot})`);
        continue;
      }

      hasProblems = true;
      console.error(`checked ${label}: stale (${result.mirrorRoot})`);
      for (const problem of result.problems) {
        console.error(`  - ${problem}`);
      }
    }

    if (hasProblems) {
      process.exit(1);
    }

    return;
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
