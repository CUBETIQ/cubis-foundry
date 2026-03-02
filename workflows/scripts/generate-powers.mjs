#!/usr/bin/env node
/**
 * generate-powers.mjs
 *
 * Generates POWER.md files for Kiro from canonical SKILL.md files.
 * Supports both workflow and MCP catalogs:
 * - workflows/skills -> workflows/powers
 * - mcp/skills -> mcp/powers
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const ROOT_PAIRS = [
  {
    label: "workflows",
    skillsRoot: path.join(ROOT, "workflows", "skills"),
    powersRoot: path.join(ROOT, "workflows", "powers"),
  },
];

const ARGS = new Set(process.argv.slice(2));
const DRY_RUN = ARGS.has("--dry-run");
const FORCE = ARGS.has("--force");
const FROM_SKILLS = ARGS.has("--from-skills");
const SYNC_SKILLS = ARGS.has("--sync-skills");

const KIRO_REQUIRED_KEYS = {
  inclusion: "manual",
};

async function pathExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function readUtf8(p) {
  return fs.readFile(p, "utf8");
}

async function writeUtf8(p, content) {
  if (DRY_RUN) return;
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, content, "utf8");
}

async function copyDir(src, dest) {
  if (DRY_RUN) return;
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

function stripCodeFence(content) {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^(`{3,})([a-zA-Z]*)\n([\s\S]*)\n\1\s*$/);
  if (!fenceMatch) return trimmed;
  return fenceMatch[3];
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  return {
    frontmatterRaw: match[1],
    body: match[2],
  };
}

function injectKiroKeys(frontmatterRaw) {
  let result = frontmatterRaw;
  for (const [key, value] of Object.entries(KIRO_REQUIRED_KEYS)) {
    const keyPresent = new RegExp(`^${key}\\s*:`, "m").test(result);
    if (!keyPresent) {
      result = `${key}: ${value}\n${result}`;
    }
  }
  return result;
}

function buildPowerContent(skillMdContent) {
  const inner = stripCodeFence(skillMdContent);
  const parsed = parseFrontmatter(inner);
  if (!parsed) {
    return `\`\`\`\`markdown\n${inner}\n\`\`\`\`\n`;
  }

  const updatedFrontmatter = injectKiroKeys(parsed.frontmatterRaw);
  const reconstructed = `---\n${updatedFrontmatter}\n---\n${parsed.body}`;
  return `\`\`\`\`markdown\n${reconstructed}\n\`\`\`\`\n`;
}

async function getSubdirectories(dir) {
  if (!(await pathExists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

async function processPowerDir(pair, powerName) {
  const powerDir = path.join(pair.powersRoot, powerName);
  const powerMdPath = path.join(powerDir, "POWER.md");

  const canonicalSkill = path.join(pair.skillsRoot, powerName, "SKILL.md");
  const localSkill = path.join(powerDir, "SKILL.md");

  let skillSource;
  if (await pathExists(canonicalSkill)) {
    skillSource = canonicalSkill;
  } else if (await pathExists(localSkill)) {
    skillSource = localSkill;
  } else {
    return {
      name: powerName,
      result: "skip",
      reason: "no SKILL.md found in skills/ or powers/",
      pair: pair.label,
    };
  }

  const powerExists = await pathExists(powerMdPath);
  if (powerExists && !FORCE) {
    return {
      name: powerName,
      result: "skip",
      reason: "POWER.md already exists (use --force to overwrite)",
      pair: pair.label,
    };
  }

  const skillContent = await readUtf8(skillSource);
  const powerContent = buildPowerContent(skillContent);
  await writeUtf8(powerMdPath, powerContent);

  return {
    name: powerName,
    result: powerExists ? "updated" : "created",
    source: path.relative(ROOT, skillSource),
    pair: pair.label,
  };
}

async function syncFromSkills(pair) {
  const skillDirs = await getSubdirectories(pair.skillsRoot);
  const created = [];

  for (const name of skillDirs) {
    if (name.startsWith(".") || name.endsWith(".json") || name.endsWith(".md"))
      continue;

    const powerDir = path.join(pair.powersRoot, name);
    const skillDir = path.join(pair.skillsRoot, name);
    const skillMdSrc = path.join(skillDir, "SKILL.md");

    if (!(await pathExists(skillMdSrc))) continue;
    if (await pathExists(powerDir)) continue;

    const skillMdDest = path.join(powerDir, "SKILL.md");
    if (!DRY_RUN) {
      await fs.mkdir(powerDir, { recursive: true });
      await fs.copyFile(skillMdSrc, skillMdDest);
    }

    for (const subdir of ["steering", "templates", "references"]) {
      const srcSub = path.join(skillDir, subdir);
      const destSub = path.join(powerDir, subdir);
      if (await pathExists(srcSub)) {
        await copyDir(srcSub, destSub);
      }
    }

    created.push(name);
  }

  return created;
}

async function syncSkillsToPowers(pair) {
  const powerDirs = await getSubdirectories(pair.powersRoot);
  const synced = [];
  const unchanged = [];
  const missing = [];

  for (const name of powerDirs) {
    const canonicalSkill = path.join(pair.skillsRoot, name, "SKILL.md");
    const powerSkill = path.join(pair.powersRoot, name, "SKILL.md");

    if (!(await pathExists(canonicalSkill))) {
      missing.push(name);
      continue;
    }

    const canonicalContent = await readUtf8(canonicalSkill);
    const existingContent = (await pathExists(powerSkill))
      ? await readUtf8(powerSkill)
      : null;

    if (existingContent === canonicalContent) {
      unchanged.push(name);
      continue;
    }

    await writeUtf8(powerSkill, canonicalContent);
    synced.push(name);
  }

  return { synced, unchanged, missing };
}

async function main() {
  const pairResults = [];

  for (const pair of ROOT_PAIRS) {
    if (
      !(await pathExists(pair.skillsRoot)) &&
      !(await pathExists(pair.powersRoot))
    ) {
      continue;
    }

    if (FROM_SKILLS) {
      const created = await syncFromSkills(pair);
      if (created.length > 0) {
        console.log(
          `${DRY_RUN ? "[dry-run] " : ""}Created ${created.length} missing powers from ${pair.label}/skills:`,
        );
        for (const name of created) {
          console.log(`  + ${pair.label}/${name}`);
        }
      }
    }

    if (SYNC_SKILLS) {
      const syncResult = await syncSkillsToPowers(pair);
      if (syncResult.synced.length > 0) {
        console.log(
          `${DRY_RUN ? "[dry-run] " : ""}Synced ${syncResult.synced.length} SKILL.md files from ${pair.label}/skills to ${pair.label}/powers`,
        );
      }
      if (syncResult.missing.length > 0) {
        console.log(
          `Skipping ${syncResult.missing.length} ${pair.label}/powers entries with no canonical ${pair.label}/skills source.`,
        );
      }
    }

    const powerDirs = await getSubdirectories(pair.powersRoot);
    if (powerDirs.length === 0) continue;

    const results = [];
    for (const powerName of powerDirs) {
      results.push(await processPowerDir(pair, powerName));
    }
    pairResults.push({ pair, results });
  }

  const allResults = pairResults.flatMap((item) => item.results);
  const created = allResults.filter((r) => r.result === "created");
  const updated = allResults.filter((r) => r.result === "updated");
  const skipped = allResults.filter((r) => r.result === "skip");

  if (created.length === 0 && updated.length === 0 && skipped.length === 0) {
    console.log("No powers directories found.");
    return;
  }

  console.log("\nPOWER.md generation summary");
  console.log(`  Created: ${created.length}`);
  console.log(`  Updated: ${updated.length}`);
  console.log(`  Skipped: ${skipped.length}`);

  for (const result of [...created, ...updated]) {
    console.log(
      `  ${result.result === "created" ? "+" : "~"} [${result.pair}] ${result.name} (${result.source})`,
    );
  }

  if (skipped.length > 0) {
    console.log("\nSkipped:");
    for (const result of skipped) {
      console.log(`  - [${result.pair}] ${result.name}: ${result.reason}`);
    }
  }

  if (DRY_RUN) {
    console.log("\nDry-run mode: no files were written.");
  }
}

main().catch((err) => {
  console.error(err?.stack || err?.message || String(err));
  process.exit(1);
});
