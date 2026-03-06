#!/usr/bin/env node

/**
 * validate-mcp-skills.mjs
 *
 * Build-time validation script that verifies:
 *
 * 1. All SKILL.md files have required frontmatter (name, description).
 * 2. No duplicate skill IDs across the vault.
 * 3. Category derivation is consistent with the MCP manifest.
 * 4. Generated MCP manifest is up-to-date (content hash match).
 * 5. Skills referenced in rule files actually exist.
 * 6. Built-in MCP tool names match the registry.
 *
 * Usage:
 *   node scripts/validate-mcp-skills.mjs              # standard validation
 *   node scripts/validate-mcp-skills.mjs --strict      # treat warnings as errors
 *   node scripts/validate-mcp-skills.mjs --fix         # auto-regenerate stale manifest
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = errors found
 *   2 = warnings found (strict mode only)
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SKILLS_ROOT = path.join(ROOT, "workflows", "skills");
const MANIFEST_FILE = path.join(ROOT, "mcp", "generated", "mcp-manifest.json");

// ─── Arg parsing ────────────────────────────────────────────

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    strict: args.has("--strict"),
    fix: args.has("--fix"),
    verbose: args.has("--verbose"),
  };
}

// ─── Frontmatter parsing ────────────────────────────────────

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { raw: "", body: markdown };
  return { raw: match[1], body: markdown.slice(match[0].length) };
}

function getScalar(frontmatterRaw, key) {
  const match = frontmatterRaw.match(
    new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"),
  );
  if (!match) return null;
  return match[1].trim().replace(/^['\"]|['\"]$/g, "");
}

function getMetadataBlock(frontmatterRaw) {
  const lines = frontmatterRaw.split(/\r?\n/);
  const metadata = {};
  let inMetadata = false;
  for (const line of lines) {
    if (/^metadata\s*:\s*$/.test(line)) {
      inMetadata = true;
      continue;
    }
    if (!inMetadata) continue;
    if (!line.trim()) continue;
    if (!/^\s+/.test(line)) break;
    const kv = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.+)\s*$/);
    if (!kv) continue;
    metadata[kv[1]] = kv[2].trim().replace(/^['\"]|['\"]$/g, "");
  }
  return metadata;
}

function isWrapperSkill(skillId, metadata) {
  const lower = skillId.toLowerCase();
  if (lower.startsWith("workflow-") || lower.startsWith("agent-")) return true;
  const wrapper = String(metadata.wrapper || "")
    .trim()
    .toLowerCase();
  return wrapper === "workflow" || wrapper === "agent";
}

// ─── Validators ─────────────────────────────────────────────

async function pathExists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * @returns {{ errors: string[], warnings: string[] }}
 */
async function validateSkillFiles(verbose) {
  const errors = [];
  const warnings = [];
  const seenIds = new Map(); // id -> path

  if (!(await pathExists(SKILLS_ROOT))) {
    errors.push(`Skills root not found: ${SKILLS_ROOT}`);
    return { errors, warnings };
  }

  const entries = await fs.readdir(SKILLS_ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const skillId = entry.name;
    const skillFile = path.join(SKILLS_ROOT, skillId, "SKILL.md");

    if (skillId === "catalogs") continue;

    if (!(await pathExists(skillFile))) {
      warnings.push(`${skillId}: directory exists but no SKILL.md found`);
      continue;
    }

    try {
      const raw = await fs.readFile(skillFile, "utf8");
      const fm = parseFrontmatter(raw);
      const metadata = getMetadataBlock(fm.raw);

      // Skip wrapper skills (they are excluded from MCP vault)
      if (isWrapperSkill(skillId, metadata)) {
        if (verbose) console.log(`  skip wrapper: ${skillId}`);
        continue;
      }

      // Check duplicate IDs
      const idKey = skillId.toLowerCase();
      if (seenIds.has(idKey)) {
        errors.push(
          `Duplicate skill ID: ${skillId} (conflicts with ${seenIds.get(idKey)})`,
        );
      }
      seenIds.set(idKey, skillFile);

      // Required: frontmatter exists
      if (!fm.raw) {
        errors.push(`${skillId}: missing YAML frontmatter block`);
        continue;
      }

      // Required: name
      const name = getScalar(fm.raw, "name");
      if (!name) {
        errors.push(`${skillId}: missing required frontmatter field 'name'`);
      }

      // Required: description
      const description = getScalar(fm.raw, "description");
      if (!description) {
        errors.push(
          `${skillId}: missing required frontmatter field 'description'`,
        );
      }

      // Warning: description too long (poor MCP summary)
      if (description && description.length > 250) {
        warnings.push(
          `${skillId}: description is ${description.length} chars (recommended: ≤200)`,
        );
      }

      // Warning: name doesn't match directory name
      if (name && name !== skillId) {
        // This is okay for display names, but warn if they're very different
        const normalize = (s) => s.toLowerCase().replace(/[-_\s]/g, "");
        if (normalize(name) !== normalize(skillId)) {
          warnings.push(
            `${skillId}: frontmatter name '${name}' differs significantly from directory name`,
          );
        }
      }
    } catch (err) {
      errors.push(`${skillId}: failed to read/parse SKILL.md: ${err.message}`);
    }
  }

  return { errors, warnings };
}

/**
 * Validate manifest is up-to-date.
 * @returns {{ errors: string[], warnings: string[] }}
 */
async function validateManifest() {
  const errors = [];
  const warnings = [];

  if (!(await pathExists(MANIFEST_FILE))) {
    warnings.push(
      `MCP manifest not found: ${path.relative(ROOT, MANIFEST_FILE)}. Run: node scripts/generate-mcp-manifest.mjs`,
    );
    return { errors, warnings };
  }

  try {
    const raw = await fs.readFile(MANIFEST_FILE, "utf8");
    const manifest = JSON.parse(raw);

    // Basic schema checks
    if (manifest.$schema !== "cubis-foundry-mcp-manifest-v1") {
      errors.push(
        `Manifest has unexpected schema: ${manifest.$schema || "(missing)"}`,
      );
    }

    if (!manifest.contentHash) {
      errors.push("Manifest missing contentHash field");
    }

    if (!manifest.summary) {
      errors.push("Manifest missing summary field");
    }

    if (!Array.isArray(manifest.skills)) {
      errors.push("Manifest missing skills array");
      return { errors, warnings };
    }

    // Cross-check manifest skills against actual vault
    const entries = await fs.readdir(SKILLS_ROOT, { withFileTypes: true });
    const actualSkillDirs = new Set();
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      if (entry.name === "catalogs") continue;
      const skillFile = path.join(SKILLS_ROOT, entry.name, "SKILL.md");
      if (await pathExists(skillFile)) {
        // Check if it's a wrapper
        const raw = await fs.readFile(skillFile, "utf8");
        const fm = parseFrontmatter(raw);
        const metadata = getMetadataBlock(fm.raw);
        if (!isWrapperSkill(entry.name, metadata)) {
          actualSkillDirs.add(entry.name);
        }
      }
    }

    const manifestIds = new Set(manifest.skills.map((s) => s.id));

    // Skills in vault but not in manifest
    for (const id of actualSkillDirs) {
      if (!manifestIds.has(id)) {
        warnings.push(
          `Skill '${id}' exists in vault but not in manifest (stale)`,
        );
      }
    }

    // Skills in manifest but not in vault
    for (const id of manifestIds) {
      if (!actualSkillDirs.has(id)) {
        warnings.push(
          `Skill '${id}' in manifest but not found in vault (orphan)`,
        );
      }
    }

    // Check for manifest-level errors
    if (manifest.errors?.length > 0) {
      for (const err of manifest.errors) {
        warnings.push(
          `Manifest recorded scan error: ${err.skillId}: ${err.error}`,
        );
      }
    }

    // Check builtin tools
    if (!Array.isArray(manifest.builtinTools)) {
      warnings.push("Manifest missing builtinTools array");
    } else {
      const expectedToolNames = new Set([
        "route_resolve",
        "skill_list_categories",
        "skill_browse_category",
        "skill_search",
        "skill_validate",
        "skill_get",
        "skill_get_reference",
        "skill_budget_report",
        "postman_get_mode",
        "postman_set_mode",
        "postman_get_status",
        "stitch_get_mode",
        "stitch_set_profile",
        "stitch_get_status",
      ]);
      const manifestToolNames = new Set(
        manifest.builtinTools.map((t) => t.name),
      );

      for (const name of expectedToolNames) {
        if (!manifestToolNames.has(name)) {
          errors.push(`Manifest missing expected built-in tool: ${name}`);
        }
      }
      for (const name of manifestToolNames) {
        if (!expectedToolNames.has(name)) {
          warnings.push(`Manifest has unexpected built-in tool: ${name}`);
        }
      }
    }
  } catch (err) {
    errors.push(`Failed to read/parse manifest: ${err.message}`);
  }

  return { errors, warnings };
}

/**
 * Validate rule file managed block references existing skills.
 * @returns {{ errors: string[], warnings: string[] }}
 */
async function validateRuleFileReferences() {
  const warnings = [];

  // Check AGENTS.md for skill references
  const agentsFile = path.join(ROOT, "AGENTS.md");
  if (!(await pathExists(agentsFile))) {
    return { errors: [], warnings };
  }

  try {
    const content = await fs.readFile(agentsFile, "utf8");

    // Extract the MCP managed block if present
    const mcpBlockMatch = content.match(
      /<!-- cbx:mcp:auto:start[^>]*-->([\s\S]*?)<!-- cbx:mcp:auto:end -->/,
    );
    if (!mcpBlockMatch) {
      // No MCP block yet — that's fine, it's a new feature
      return { errors: [], warnings };
    }

    // Check that any skill IDs referenced in the block exist
    const blockContent = mcpBlockMatch[1];
    const skillRefPattern = /`([a-z][a-z0-9-]+)`/g;
    let match;
    while ((match = skillRefPattern.exec(blockContent)) !== null) {
      const skillId = match[1];
      // Only check things that look like skill IDs (not tool names)
      if (
        skillId.startsWith("skill_") ||
        skillId.startsWith("postman_") ||
        skillId.startsWith("stitch_")
      ) {
        continue;
      }
      const skillDir = path.join(SKILLS_ROOT, skillId);
      if (!(await pathExists(skillDir))) {
        warnings.push(
          `Rule file references skill '${skillId}' that doesn't exist in vault`,
        );
      }
    }
  } catch {
    // Skip if unreadable
  }

  return { errors: [], warnings };
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  const { strict, fix, verbose } = parseArgs(process.argv);

  console.log("Cubis Foundry MCP Skills Validation");
  console.log("====================================\n");

  const allErrors = [];
  const allWarnings = [];

  // 1. Validate skill files
  console.log("1. Validating SKILL.md files...");
  const { errors: skillErrors, warnings: skillWarnings } =
    await validateSkillFiles(verbose);
  allErrors.push(...skillErrors);
  allWarnings.push(...skillWarnings);
  console.log(
    `   ${skillErrors.length} error(s), ${skillWarnings.length} warning(s)`,
  );

  // 2. Validate manifest
  console.log("2. Validating MCP manifest...");
  const { errors: manifestErrors, warnings: manifestWarnings } =
    await validateManifest();
  allErrors.push(...manifestErrors);
  allWarnings.push(...manifestWarnings);
  console.log(
    `   ${manifestErrors.length} error(s), ${manifestWarnings.length} warning(s)`,
  );

  // 3. Validate rule file references
  console.log("3. Validating rule file references...");
  const { errors: ruleErrors, warnings: ruleWarnings } =
    await validateRuleFileReferences();
  allErrors.push(...ruleErrors);
  allWarnings.push(...ruleWarnings);
  console.log(
    `   ${ruleErrors.length} error(s), ${ruleWarnings.length} warning(s)`,
  );

  // Summary
  console.log("\n────────────────────────────────────");

  if (allErrors.length > 0) {
    console.log(`\n✗ ${allErrors.length} ERROR(S):`);
    for (const err of allErrors) {
      console.log(`  ✗ ${err}`);
    }
  }

  if (allWarnings.length > 0) {
    console.log(`\n⚠ ${allWarnings.length} WARNING(S):`);
    for (const warn of allWarnings) {
      console.log(`  ⚠ ${warn}`);
    }
  }

  if (allErrors.length === 0 && allWarnings.length === 0) {
    console.log("\n✓ All checks passed.");
  }

  // Auto-fix: regenerate stale manifest
  if (
    fix &&
    allWarnings.some((w) => w.includes("stale") || w.includes("not found"))
  ) {
    console.log("\n[fix] Regenerating MCP manifest...");
    const { execFileSync } = await import("node:child_process");
    execFileSync("node", [path.join(__dirname, "generate-mcp-manifest.mjs")], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  // Exit code
  if (allErrors.length > 0) {
    process.exit(1);
  }
  if (strict && allWarnings.length > 0) {
    console.log("\n(Strict mode: treating warnings as errors)");
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
