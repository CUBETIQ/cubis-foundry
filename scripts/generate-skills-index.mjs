#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";

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
  cursor: {
    roots: [
      path.join(
        ROOT,
        "workflows",
        "workflows",
        "agent-environment-setup",
        "platforms",
        "cursor",
        "skills",
      ),
    ],
    outFile: path.join(
      ROOT,
      "workflows",
      "workflows",
      "agent-environment-setup",
      "platforms",
      "cursor",
      "skills",
      "skills_index.json",
    ),
    indexPathPrefix: ".cursor/skills",
  },
  windsurf: {
    roots: [
      path.join(
        ROOT,
        "workflows",
        "workflows",
        "agent-environment-setup",
        "platforms",
        "windsurf",
        "skills",
      ),
    ],
    outFile: path.join(
      ROOT,
      "workflows",
      "workflows",
      "agent-environment-setup",
      "platforms",
      "windsurf",
      "skills",
      "skills_index.json",
    ),
    indexPathPrefix: ".windsurf/skills",
  },
};

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  const targetArg =
    argv.find((item, idx) => argv[idx - 1] === "--target") || "all";
  const target = String(targetArg).toLowerCase();
  const dryRun = args.has("--dry-run");
  return { target, dryRun };
}

function splitTopLevelCsv(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim().replace(/^['\"]|['\"]$/g, ""))
    .filter(Boolean);
}

function parseInlineList(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]"))
    return splitTopLevelCsv(trimmed);
  const inner = trimmed.slice(1, -1);
  return splitTopLevelCsv(inner);
}

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
    const metaStart = line.match(/^metadata\s*:\s*$/);
    if (metaStart) {
      inMetadata = true;
      continue;
    }
    if (!inMetadata) continue;
    if (!line.trim()) continue;
    if (!/^\s+/.test(line)) break;
    const kv = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.+)\s*$/);
    if (!kv) continue;
    const key = kv[1];
    const value = kv[2].trim().replace(/^['\"]|['\"]$/g, "");
    metadata[key] = value;
  }
  return metadata;
}

function getAllTriggerValues(frontmatterRaw) {
  const lines = frontmatterRaw.split(/\r?\n/);
  const values = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const triggerMatch = line.match(/^\s*triggers\s*:\s*(.*)$/);
    if (!triggerMatch) continue;

    const rest = triggerMatch[1].trim();
    if (rest) {
      values.push(...parseInlineList(rest));
      continue;
    }

    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j];
      if (!next.trim()) continue;
      if (/^\s*[A-Za-z0-9_-]+\s*:/.test(next)) break;

      const bullet = next.match(/^\s*-\s*(.+)$/);
      if (!bullet) continue;
      values.push(bullet[1].trim().replace(/^['\"]|['\"]$/g, ""));
    }
  }

  return [...new Set(values.filter(Boolean))];
}

async function pathExists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1";
}

async function collectSkillsIndexEntries(roots, indexPathPrefix) {
  const rowById = new Map();

  for (const skillsRoot of roots) {
    if (!(await pathExists(skillsRoot))) continue;

    const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const skillId = entry.name;
      const skillFile = path.join(skillsRoot, skillId, "SKILL.md");
      if (!(await pathExists(skillFile))) continue;

      const raw = await fs.readFile(skillFile, "utf8");
      const fm = parseFrontmatter(raw);
      const metadata = getMetadataBlock(fm.raw);

      const id = skillId;
      const name = getScalar(fm.raw, "name") || id;
      const description = getScalar(fm.raw, "description") || "";
      const triggers = getAllTriggerValues(fm.raw);
      const deprecated = normalizeBoolean(metadata.deprecated);
      const replacedBy = metadata.replaced_by
        ? String(metadata.replaced_by).trim()
        : null;
      const canonicalId = replacedBy || id;

      // Later roots override earlier roots for same id (MCP canonical preferred).
      rowById.set(String(id).toLowerCase(), {
        id,
        name,
        canonical_id: canonicalId,
        deprecated,
        replaced_by: replacedBy,
        path: `${indexPathPrefix}/${id}/SKILL.md`,
        description,
        triggers,
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

async function writeIndex({ label, roots, outFile, indexPathPrefix, dryRun }) {
  const rows = await collectSkillsIndexEntries(roots, indexPathPrefix);
  ensureUniqueNames(rows, label);
  ensureUniqueIds(rows, label);

  const content = `${JSON.stringify(rows, null, 2)}\n`;
  if (!dryRun) {
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, content, "utf8");
  }

  return { label, outFile, count: rows.length, dryRun };
}

async function main() {
  const { target, dryRun } = parseArgs(process.argv);

  const targetLabels =
    target === "all"
      ? Object.keys(DEFAULT_TARGETS)
      : Object.keys(DEFAULT_TARGETS).filter((key) => key === target);

  if (targetLabels.length === 0) {
    throw new Error(
      `Unknown target '${target}'. Use one of: all, canonical, copilot, cursor, windsurf.`,
    );
  }

  for (const label of targetLabels) {
    const spec = DEFAULT_TARGETS[label];
    const result = await writeIndex({ label, ...spec, dryRun });
    console.log(
      `${result.dryRun ? "[dry-run] " : ""}generated ${result.label} skills index (${result.count} entries): ${result.outFile}`,
    );
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
