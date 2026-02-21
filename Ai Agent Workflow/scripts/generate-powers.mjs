#!/usr/bin/env node
/**
 * generate-powers.mjs
 *
 * Generates POWER.md files for Kiro from the canonical SKILL.md files in the
 * skills/ directory. Powers are Kiro-specific wrappers around skills; the
 * install source of truth for `cbx install` is ALWAYS `skills/<id>/SKILL.md`.
 *
 * Source priority (matching cubis.js installBundleArtifacts):
 *   1. skills/<name>/SKILL.md  ← canonical (what `cbx install` uses)
 *   2. powers/<name>/SKILL.md  ← fallback (local override only)
 *
 * Usage:
 *   node "Ai Agent Workflow/scripts/generate-powers.mjs" [--dry-run] [--force] [--from-skills] [--sync-skills]
 *
 * Options:
 *   --dry-run      Preview changes without writing files
 *   --force        Overwrite existing POWER.md files
 *   --from-skills  Also create missing power directories from skills/
 *   --sync-skills  Sync canonical SKILL.md from skills/ → powers/ for every power
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const ASSETS_ROOT = path.join(ROOT, "Ai Agent Workflow");
const POWERS_ROOT = path.join(ASSETS_ROOT, "powers");
const SKILLS_ROOT = path.join(ASSETS_ROOT, "skills");

const ARGS = new Set(process.argv.slice(2));
const DRY_RUN = ARGS.has("--dry-run");
const FORCE = ARGS.has("--force");
const FROM_SKILLS = ARGS.has("--from-skills");
const SYNC_SKILLS = ARGS.has("--sync-skills");

// ─── Kiro POWER.md frontmatter keys ────────────────────────────────────────
// Keys added/ensured for Kiro power format
const KIRO_REQUIRED_KEYS = {
  inclusion: "manual",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

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

/**
 * Strip an outer code fence wrapper from file content.
 * Handles both:
 *   ```skill        (backtick × 3)
 *   ````skill       (backtick × 4)
 * Returns the raw inner content (the markdown string inside the fence),
 * or the original content unchanged if no fence is found.
 */
function stripCodeFence(content) {
  const trimmed = content.trim();
  // Match opening fence: 3+ backticks followed by optional language identifier
  const fenceMatch = trimmed.match(/^(`{3,})([a-zA-Z]*)\n([\s\S]*)\n\1\s*$/);
  if (!fenceMatch) return trimmed;
  return fenceMatch[3];
}

/**
 * Parse YAML frontmatter block from raw markdown.
 * Returns { frontmatterRaw, body } or null if no frontmatter found.
 */
function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  return {
    frontmatterRaw: match[1],
    body: match[2],
  };
}

/**
 * Inject Kiro-specific keys into a raw frontmatter string if they are absent.
 * Returns updated frontmatter string.
 */
function injectKiroKeys(frontmatterRaw) {
  let result = frontmatterRaw;
  for (const [key, value] of Object.entries(KIRO_REQUIRED_KEYS)) {
    const keyPresent = new RegExp(`^${key}\\s*:`, "m").test(result);
    if (!keyPresent) {
      // Prepend the key at the top of the frontmatter block
      result = `${key}: ${value}\n${result}`;
    }
  }
  return result;
}

/**
 * Build POWER.md content from a SKILL.md source string.
 * - Strips outer `skill` / ````skill fence if present
 * - Parses frontmatter and injects Kiro keys
 * - Re-wraps in a `markdown` code fence (matching the existing POWER.md convention)
 */
function buildPowerContent(skillMdContent) {
  // 1. Strip outer code fence (the ````skill ... ```` wrapper)
  const inner = stripCodeFence(skillMdContent);

  // 2. Parse and update frontmatter
  const parsed = parseFrontmatter(inner);
  if (!parsed) {
    // No frontmatter found – just re-wrap with markdown fence and return
    return `\`\`\`\`markdown\n${inner}\n\`\`\`\`\n`;
  }

  const updatedFrontmatter = injectKiroKeys(parsed.frontmatterRaw);
  const reconstructed = `---\n${updatedFrontmatter}\n---\n${parsed.body}`;

  // 3. Wrap in markdown code fence for Kiro power format
  return `\`\`\`\`markdown\n${reconstructed}\n\`\`\`\`\n`;
}

// ─── Core logic ─────────────────────────────────────────────────────────────

async function getSubdirectories(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

async function processPowerDir(powerName) {
  const powerDir = path.join(POWERS_ROOT, powerName);
  const powerMdPath = path.join(powerDir, "POWER.md");

  // Source priority mirrors cubis.js installBundleArtifacts (line ~2097):
  //   skills/<name>/SKILL.md  ← canonical; what `cbx install` copies to the platform
  //   powers/<name>/SKILL.md  ← local fallback only (may be a stale copy)
  // Using skills/ as primary ensures POWER.md is generated from the same
  // content that users receive when they run `cbx install`.
  const canonicalSkill = path.join(SKILLS_ROOT, powerName, "SKILL.md");
  const localSkill = path.join(powerDir, "SKILL.md");

  let skillSource;
  if (await pathExists(canonicalSkill)) {
    skillSource = canonicalSkill;
  } else if (await pathExists(localSkill)) {
    skillSource = localSkill; // fallback: power-local override
  } else {
    return {
      name: powerName,
      result: "skip",
      reason: "no SKILL.md found in skills/ or powers/",
    };
  }

  const powerExists = await pathExists(powerMdPath);
  if (powerExists && !FORCE) {
    return {
      name: powerName,
      result: "skip",
      reason: "POWER.md already exists (use --force to overwrite)",
    };
  }

  const skillContent = await readUtf8(skillSource);
  const powerContent = buildPowerContent(skillContent);

  await writeUtf8(powerMdPath, powerContent);

  return {
    name: powerName,
    result: powerExists ? "updated" : "created",
    source: path.relative(ROOT, skillSource),
  };
}

async function syncFromSkills() {
  const skillDirs = await getSubdirectories(SKILLS_ROOT);
  const created = [];

  for (const name of skillDirs) {
    // Skip non-skill entries
    if (name.startsWith(".") || name.endsWith(".json") || name.endsWith(".md"))
      continue;

    const powerDir = path.join(POWERS_ROOT, name);
    const skillDir = path.join(SKILLS_ROOT, name);
    const skillMdSrc = path.join(skillDir, "SKILL.md");

    if (!(await pathExists(skillMdSrc))) continue;
    if (await pathExists(powerDir)) continue; // already exists

    // Create power directory and copy SKILL.md
    const skillMdDest = path.join(powerDir, "SKILL.md");
    if (!DRY_RUN) {
      await fs.mkdir(powerDir, { recursive: true });
      await fs.copyFile(skillMdSrc, skillMdDest);
    }

    // Copy steering/, templates/, references/ if they exist
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

/**
 * Sync canonical SKILL.md from skills/ → powers/ for every power directory.
 * This keeps powers/<name>/SKILL.md byte-identical to what `cbx install` will
 * deliver to users, so Kiro and cbx users always see the same skill content.
 */
async function syncSkillsToPowers() {
  const powerDirs = await getSubdirectories(POWERS_ROOT);
  const synced = [];
  const unchanged = [];
  const missing = [];

  for (const name of powerDirs) {
    const canonicalSkill = path.join(SKILLS_ROOT, name, "SKILL.md");
    const powerSkill = path.join(POWERS_ROOT, name, "SKILL.md");

    if (!(await pathExists(canonicalSkill))) {
      missing.push(name);
      continue;
    }

    const canonical = await readUtf8(canonicalSkill);
    const existing = (await pathExists(powerSkill))
      ? await readUtf8(powerSkill)
      : null;

    if (existing === canonical) {
      unchanged.push(name);
      continue;
    }

    if (!DRY_RUN) {
      await fs.mkdir(path.join(POWERS_ROOT, name), { recursive: true });
      await fs.copyFile(canonicalSkill, powerSkill);
    }

    synced.push(name);
  }

  return { synced, unchanged, missing };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nCubis Foundry — generate-powers.mjs`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no files written)" : "LIVE"}`);
  if (FORCE) console.log("Force: overwriting existing POWER.md files");
  if (SYNC_SKILLS)
    console.log(
      "Sync-skills: syncing canonical SKILL.md from skills/ → powers/",
    );
  if (FROM_SKILLS)
    console.log("From-skills: creating missing power dirs from skills/");
  console.log();

  // 1a. Sync canonical SKILL.md from skills/ → powers/ so powers/SKILL.md matches
  //     what `cbx install` delivers (cubis.js always installs from skills/, not powers/).
  if (SYNC_SKILLS) {
    const { synced, missing } = await syncSkillsToPowers();
    if (synced.length > 0) {
      console.log(
        `Synced SKILL.md for ${synced.length} power${synced.length === 1 ? "" : "s"} from skills/:`,
      );
      for (const name of synced) {
        console.log(`  ↺ ${name}/SKILL.md`);
      }
      console.log();
    } else {
      console.log(
        "All power SKILL.md files are already in sync with skills/.\n",
      );
    }
    if (missing.length > 0) {
      console.log(
        `Note: ${missing.length} power${missing.length === 1 ? "" : "s"} have no matching skills/ entry (local-only):`,
      );
      for (const name of missing) console.log(`  ~ ${name}`);
      console.log();
    }
  }

  // 1b. Create missing power directories from skills/
  if (FROM_SKILLS) {
    const created = await syncFromSkills();
    if (created.length > 0) {
      console.log(
        `Created ${created.length} new power director${created.length === 1 ? "y" : "ies"} from skills/:`,
      );
      for (const name of created) {
        console.log(`  + ${name}/`);
      }
      console.log();
    } else {
      console.log("No new power directories needed from skills/.\n");
    }
  }

  // 2. Process each power directory
  const powerDirs = await getSubdirectories(POWERS_ROOT);
  const results = { created: [], updated: [], skipped: [], errors: [] };

  for (const name of powerDirs) {
    try {
      const result = await processPowerDir(name);
      if (result.result === "created") results.created.push(result);
      else if (result.result === "updated") results.updated.push(result);
      else results.skipped.push(result);
    } catch (err) {
      results.errors.push({ name, error: err.message });
    }
  }

  // 3. Report
  if (results.created.length > 0) {
    console.log(
      `Created ${results.created.length} POWER.md file${results.created.length === 1 ? "" : "s"}:`,
    );
    for (const r of results.created) {
      console.log(`  ✓ ${r.name}/POWER.md  (from ${r.source})`);
    }
    console.log();
  }

  if (results.updated.length > 0) {
    console.log(
      `Updated ${results.updated.length} POWER.md file${results.updated.length === 1 ? "" : "s"}:`,
    );
    for (const r of results.updated) {
      console.log(`  ↺ ${r.name}/POWER.md  (from ${r.source})`);
    }
    console.log();
  }

  if (results.skipped.length > 0) {
    console.log(
      `Skipped ${results.skipped.length} director${results.skipped.length === 1 ? "y" : "ies"}:`,
    );
    for (const r of results.skipped) {
      console.log(`  - ${r.name}: ${r.reason}`);
    }
    console.log();
  }

  if (results.errors.length > 0) {
    console.error(`Errors (${results.errors.length}):`);
    for (const r of results.errors) {
      console.error(`  ✗ ${r.name}: ${r.error}`);
    }
    console.log();
  }

  const total = results.created.length + results.updated.length;
  console.log(
    `Done. ${total} POWER.md file${total === 1 ? "" : "s"} ${DRY_RUN ? "would be" : ""} generated.`,
  );

  if (results.errors.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
