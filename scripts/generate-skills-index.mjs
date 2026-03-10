#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import {
  deriveDescriptor,
  getMetadataBlock,
  parseFrontmatter,
} from "./lib/skill-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DEFAULT_TARGETS = {
  canonical: {
    roots: [path.join(ROOT, "workflows", "skills")],
    outFile: path.join(ROOT, "workflows", "skills", "skills_index.json"),
    indexPathPrefix: ".agents/skills",
  },
  copilot: {
    roots: [
      path.join(
        ROOT,
        "workflows",
        "workflows",
        "agent-environment-setup",
        "platforms",
        "copilot",
        "skills",
      ),
    ],
    outFile: path.join(
      ROOT,
      "workflows",
      "workflows",
      "agent-environment-setup",
      "platforms",
      "copilot",
      "skills",
      "skills_index.json",
    ),
    indexPathPrefix: ".github/skills",
  },
  claude: {
    roots: [
      path.join(
        ROOT,
        "workflows",
        "workflows",
        "agent-environment-setup",
        "platforms",
        "claude",
        "skills",
      ),
    ],
    outFile: path.join(
      ROOT,
      "workflows",
      "workflows",
      "agent-environment-setup",
      "platforms",
      "claude",
      "skills",
      "skills_index.json",
    ),
    indexPathPrefix: ".claude/skills",
  },
};

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  const targetArg =
    argv.find((item, idx) => argv[idx - 1] === "--target") || "all";
  const target = String(targetArg).toLowerCase();
  const dryRun = args.has("--dry-run");
  const check = args.has("--check");
  return { target, dryRun, check };
}

async function pathExists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function listSkillFiles(root) {
  const files = [];
  const queue = [root];
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
        files.push(fullPath);
      }
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function normalizeLower(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isCodexWrapperSkill(id, metadata) {
  const lowerId = normalizeLower(id);
  if (lowerId.startsWith("workflow-") || lowerId.startsWith("agent-")) {
    return true;
  }

  const wrapperKind = normalizeLower(metadata.wrapper);
  return wrapperKind === "workflow" || wrapperKind === "agent";
}

async function collectSkillsIndexEntries(roots, indexPathPrefix) {
  const rowById = new Map();
  const coreProfile = JSON.parse(
    await fs.readFile(path.join(ROOT, "workflows", "skills", "catalogs", "core.json"), "utf8"),
  );
  const webBackendProfile = JSON.parse(
    await fs.readFile(
      path.join(ROOT, "workflows", "skills", "catalogs", "web-backend.json"),
      "utf8",
    ),
  );
  const coreProfileIds = new Set((coreProfile.skills || []).map((item) => String(item)));
  const webBackendProfileIds = new Set(
    (webBackendProfile.skills || []).map((item) => String(item)),
  );

  for (const skillsRoot of roots) {
    if (!(await pathExists(skillsRoot))) continue;

    for (const skillFile of await listSkillFiles(skillsRoot)) {
      const skillDir = path.dirname(skillFile);
      const skillId = path.basename(skillDir);
      const raw = await fs.readFile(skillFile, "utf8");
      const fm = parseFrontmatter(raw);
      const metadata = getMetadataBlock(fm.raw);

      if (isCodexWrapperSkill(skillId, metadata)) {
        continue;
      }

      const descriptor = deriveDescriptor({
        skillFile: {
          skillDir,
          filePath: skillFile,
          rawContent: raw,
        },
        skillsRoot,
        coreProfileIds,
        webBackendProfileIds,
      });
      const id = skillId;

      // Later roots override earlier roots for same id (MCP canonical preferred).
      rowById.set(String(id).toLowerCase(), {
        id,
        package_id: descriptor.package_id,
        catalog_id: descriptor.catalog_id,
        kind: descriptor.kind,
        name: descriptor.name,
        canonical: descriptor.canonical,
        canonical_id: descriptor.canonical_id,
        deprecated: descriptor.deprecated,
        replaced_by: descriptor.replaced_by,
        aliases: descriptor.aliases,
        category: descriptor.category,
        layer: descriptor.layer,
        maturity: descriptor.maturity,
        tier: descriptor.tier,
        tags: descriptor.tags,
        path: `${indexPathPrefix}/${path.relative(skillsRoot, skillFile).replaceAll(path.sep, "/")}`,
        description: descriptor.description,
        triggers: descriptor.triggers,
      });
    }
  }

  const rows = [...rowById.values()];
  rows.sort((a, b) => {
    const nameCmp = a.name.localeCompare(b.name);
    if (nameCmp !== 0) return nameCmp;
    return a.path.localeCompare(b.path);
  });

  return rows;
}

function ensureUniqueNames(rows, label) {
  const seen = new Map();
  for (const row of rows) {
    const key = String(row.name || "").toLowerCase();
    if (!key) continue;
    if (!seen.has(key)) {
      seen.set(key, 1);
      continue;
    }
    const count = seen.get(key) + 1;
    seen.set(key, count);
    throw new Error(
      `Duplicate skill name '${row.name}' found in target '${label}'`,
    );
  }
}

function ensureUniqueIds(rows, label) {
  const seen = new Set();
  for (const row of rows) {
    const id = String(row.id || "").trim();
    if (!id) throw new Error(`Missing skill id in target '${label}'`);
    const key = id.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Duplicate skill id '${id}' found in target '${label}'`);
    }
    seen.add(key);
  }
}

async function writeIndex({
  label,
  roots,
  outFile,
  indexPathPrefix,
  dryRun,
  check,
}) {
  const rows = await collectSkillsIndexEntries(roots, indexPathPrefix);
  ensureUniqueNames(rows, label);
  ensureUniqueIds(rows, label);

  const content = `${JSON.stringify(rows, null, 2)}\n`;
  if (check) {
    if (!(await pathExists(outFile))) {
      throw new Error(`Missing skills index for target '${label}': ${outFile}`);
    }
    const existing = await fs.readFile(outFile, "utf8");
    if (existing !== content) {
      throw new Error(
        `Stale skills index for target '${label}': ${outFile}. Run npm run generate:skills-index.`,
      );
    }
  } else if (!dryRun) {
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, content, "utf8");
  }

  return { label, outFile, count: rows.length, dryRun, check };
}

async function main() {
  const { target, dryRun, check } = parseArgs(process.argv);

  const targetLabels =
    target === "all"
      ? Object.keys(DEFAULT_TARGETS)
      : Object.keys(DEFAULT_TARGETS).filter((key) => key === target);

  if (targetLabels.length === 0) {
    throw new Error(
      `Unknown target '${target}'. Use one of: all, canonical, copilot, claude.`,
    );
  }

  for (const label of targetLabels) {
    const spec = DEFAULT_TARGETS[label];
    const result = await writeIndex({ label, ...spec, dryRun, check });
    console.log(
      `${result.check ? "[check] " : result.dryRun ? "[dry-run] " : ""}${result.check ? "validated" : "generated"} ${result.label} skills index (${result.count} entries): ${result.outFile}`,
    );
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
