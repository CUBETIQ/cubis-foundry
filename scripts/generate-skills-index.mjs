#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import {
  ROOT,
  buildSkillsIndexRows,
  pathExists,
} from "./lib/skill-inventory.mjs";

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
    throw new Error(`Duplicate skill name '${row.name}' found in target '${label}'`);
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
  const rows = await buildSkillsIndexRows({ roots, indexPathPrefix });
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
