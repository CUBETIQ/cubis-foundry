#!/usr/bin/env node

import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import {
  deriveDescriptor,
  sortDescriptors,
} from "./lib/skill-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SKILLS_ROOT = path.join(ROOT, "workflows", "skills");
const GENERATED_ROOT = path.join(SKILLS_ROOT, "generated");
const CATALOG_OUT_FILE = path.join(GENERATED_ROOT, "skill-catalog.json");
const AUDIT_OUT_FILE = path.join(GENERATED_ROOT, "skill-audit.json");
const PROFILE_FILES = {
  core: path.join(SKILLS_ROOT, "catalogs", "core.json"),
  "web-backend": path.join(SKILLS_ROOT, "catalogs", "web-backend.json"),
};
const EXCLUDED_DIRS = new Set(["catalogs", "generated"]);

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    dryRun: args.has("--dry-run"),
    check: args.has("--check"),
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

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function listTopLevelSkillDirs() {
  const entries = await fs.readdir(SKILLS_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith(".") && !EXCLUDED_DIRS.has(name))
    .sort((a, b) => a.localeCompare(b));
}

async function collectSkillFiles(skillRoot) {
  const files = [];
  const queue = [skillRoot];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || !(await pathExists(current))) continue;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name === "SKILL.md") {
        const skillDir = path.dirname(fullPath);
        files.push({
          skillDir,
          filePath: fullPath,
          rawContent: await fs.readFile(fullPath, "utf8"),
        });
      }
    }
  }
  return files.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

async function readProfiles() {
  const core = await readJson(PROFILE_FILES.core);
  const webBackend = await readJson(PROFILE_FILES["web-backend"]);
  return {
    coreIds: new Set((core.skills || []).map((item) => String(item))),
    webBackendIds: new Set((webBackend.skills || []).map((item) => String(item))),
  };
}

function buildCatalog(descriptors) {
  const topLevel = descriptors.filter((item) => item.kind === "skill");
  const canonicalTopLevel = topLevel.filter((item) => item.canonical);
  const aliasTopLevel = topLevel.filter((item) => item.deprecated);
  const layers = [...new Set(topLevel.map((item) => item.layer))].sort();
  const categories = [...new Set(topLevel.map((item) => item.category))].sort();
  const tiers = [...new Set(topLevel.map((item) => item.tier))].sort();

  const body = {
    $schema: "cubis-foundry-skill-catalog-v1",
    generatedAt: "1970-01-01T00:00:00.000Z",
    summary: {
      totalEntries: descriptors.length,
      totalSkills: topLevel.length,
      totalSubskills: descriptors.length - topLevel.length,
      canonicalSkills: canonicalTopLevel.length,
      compatibilityAliases: aliasTopLevel.length,
      layers,
      categories,
      tiers,
    },
    skills: sortDescriptors(descriptors).map((item) => ({
      id: item.id,
      package_id: item.package_id,
      catalog_id: item.catalog_id,
      kind: item.kind,
      path: item.path,
      name: item.name,
      description: item.description,
      canonical: item.canonical,
      canonical_id: item.canonical_id,
      deprecated: item.deprecated,
      replaced_by: item.replaced_by,
      aliases: item.aliases,
      category: item.category,
      layer: item.layer,
      maturity: item.maturity,
      tier: item.tier,
      tags: item.tags,
      triggers: item.triggers,
    })),
  };

  const contentHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex")
    .slice(0, 16);

  return {
    ...body,
    contentHash,
  };
}

function buildAudit(descriptors) {
  const entries = descriptors
    .filter((item) => item.kind === "skill")
    .map((item) => {
      let status = "keep";
      let reason = "Canonical skill remains active in the layered catalog.";

      if (item.deprecated) {
        status = "alias-only";
        reason = `Compatibility alias for ${item.replaced_by}.`;
      } else if (item.layer === "vertical-composed") {
        if (String(item.metadata?.review_state || "").toLowerCase() === "approved") {
          status = "keep";
          reason =
            "Thin orchestrator skill stays active and defers implementation detail to lower-layer canonical skills.";
        } else {
          status = "review";
          reason =
            "Broad orchestration skill should stay thin and defer detail to lower-layer canonical skills.";
        }
      } else if (item.kind === "skill" && item.package_id === "database-skills") {
        status = "keep";
        reason =
          "Database hub stays active but routes into engine-specific subskills instead of duplicating engine detail.";
      }

      return {
        id: item.id,
        canonical_id: item.canonical_id,
        status,
        layer: item.layer,
        category: item.category,
        tier: item.tier,
        reason,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const summary = entries.reduce(
    (acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    },
    { keep: 0, review: 0, "alias-only": 0 },
  );

  const body = {
    $schema: "cubis-foundry-skill-audit-v1",
    generatedAt: "1970-01-01T00:00:00.000Z",
    summary,
    entries,
  };

  const contentHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex")
    .slice(0, 16);

  return {
    ...body,
    contentHash,
  };
}

async function writeCheckedJson({ filePath, payload, check, dryRun }) {
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  if (check) {
    if (!(await pathExists(filePath))) {
      throw new Error(`Missing generated file: ${filePath}`);
    }
    const existing = await fs.readFile(filePath, "utf8");
    if (existing !== content) {
      throw new Error(
        `Stale generated file: ${filePath}. Run node scripts/generate-skill-catalog.mjs.`,
      );
    }
    return;
  }

  if (dryRun) return;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

async function main() {
  const { dryRun, check } = parseArgs(process.argv);
  const { coreIds, webBackendIds } = await readProfiles();
  const descriptors = [];

  for (const skillId of await listTopLevelSkillDirs()) {
    const skillRoot = path.join(SKILLS_ROOT, skillId);
    const files = await collectSkillFiles(skillRoot);
    for (const file of files) {
      descriptors.push(
        deriveDescriptor({
          skillFile: file,
          skillsRoot: SKILLS_ROOT,
          coreProfileIds: coreIds,
          webBackendProfileIds: webBackendIds,
        }),
      );
    }
  }

  const canonicalById = new Map();
  for (const item of descriptors.filter((entry) => entry.kind === "skill")) {
    canonicalById.set(item.package_id, item);
  }
  for (const item of descriptors.filter((entry) => entry.kind === "skill")) {
    if (!item.deprecated || !item.replaced_by) continue;
    const target = canonicalById.get(item.replaced_by);
    if (!target) continue;
    const aliases = new Set([...(target.aliases || []), item.package_id]);
    target.aliases = [...aliases].sort((a, b) => a.localeCompare(b));
  }

  const catalog = buildCatalog(descriptors);
  const audit = buildAudit(descriptors);

  await writeCheckedJson({
    filePath: CATALOG_OUT_FILE,
    payload: catalog,
    check,
    dryRun,
  });
  await writeCheckedJson({
    filePath: AUDIT_OUT_FILE,
    payload: audit,
    check,
    dryRun,
  });

  const prefix = check ? "[check] " : dryRun ? "[dry-run] " : "";
  console.log(
    `${prefix}generated skill catalog (${catalog.summary.totalSkills} skills, ${catalog.summary.totalSubskills} subskills): ${CATALOG_OUT_FILE}`,
  );
  console.log(
    `${prefix}generated skill audit (${audit.summary.keep} keep, ${audit.summary.review} review, ${audit.summary["alias-only"]} alias-only): ${AUDIT_OUT_FILE}`,
  );
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
