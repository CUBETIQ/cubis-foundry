#!/usr/bin/env node

import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import {
  ROOT,
  SKILLS_ROOT,
  SKILLS_GENERATED_ROOT,
  collectCanonicalDescriptors,
  pathExists,
} from "./lib/skill-inventory.mjs";
import { sortDescriptors } from "./lib/skill-catalog.mjs";
import {
  ANTHROPIC_SKILL_INTAKE_OUTPUT,
  applyAnthropicAliasesToDescriptors,
  buildAnthropicSkillIntakeReport,
  readAnthropicSkillIntake,
} from "./lib/external-skill-intake.mjs";

const CATALOG_OUT_FILE = path.join(SKILLS_GENERATED_ROOT, "skill-catalog.json");
const AUDIT_OUT_FILE = path.join(SKILLS_GENERATED_ROOT, "skill-audit.json");

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    dryRun: args.has("--dry-run"),
    check: args.has("--check"),
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
  const descriptors = await collectCanonicalDescriptors();
  const anthropicIntake = await readAnthropicSkillIntake();
  applyAnthropicAliasesToDescriptors(descriptors, anthropicIntake);

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
  const anthropicReport = buildAnthropicSkillIntakeReport({
    intakeManifest: anthropicIntake,
    canonicalSkillIds: descriptors
      .filter((item) => item.kind === "skill")
      .map((item) => item.package_id),
  });

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
  await writeCheckedJson({
    filePath: ANTHROPIC_SKILL_INTAKE_OUTPUT,
    payload: anthropicReport,
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
  console.log(
    `${prefix}generated Anthropic skill intake (${anthropicReport.summary.total} entries, ${anthropicReport.summary.adoptedAliases} adopted aliases): ${ANTHROPIC_SKILL_INTAKE_OUTPUT}`,
  );
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
