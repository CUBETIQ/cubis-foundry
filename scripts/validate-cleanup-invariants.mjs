#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";
import { promises as fs } from "node:fs";
import {
  ROOT,
  listMarkdownFiles,
  pathExists,
} from "./lib/skill-inventory.mjs";

const execFile = promisify(execFileCallback);
const errors = [];

const REMOVED_PATHS = [
  "docs/google_mcp_with_notebookllm_research (1).md",
  "workflows/skills/doc.md",
];

const CANONICAL_REFERENCES_ROOT = path.join(
  ROOT,
  "workflows",
  "skills",
  "skill-creator",
  "references",
);

const MIRRORED_REFERENCE_ROOTS = {
  antigravity: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "antigravity",
    "skills",
    "skill-creator",
    "references",
  ),
  claude: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "claude",
    "skills",
    "skill-creator",
    "references",
  ),
  codex: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "codex",
    "skills",
    "skill-creator",
    "references",
  ),
  copilot: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "copilot",
    "skills",
    "skill-creator",
    "references",
  ),
  gemini: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "gemini",
    "skills",
    "skill-creator",
    "references",
  ),
};

const INDEX_VARIANTS = {
  canonical: {
    filePath: path.join(ROOT, "workflows", "skills", "skills_index.json"),
    prefix: ".agents/skills/",
  },
  claude: {
    filePath: path.join(
      ROOT,
      "workflows",
      "workflows",
      "agent-environment-setup",
      "platforms",
      "claude",
      "skills",
      "skills_index.json",
    ),
    prefix: ".claude/skills/",
  },
  copilot: {
    filePath: path.join(
      ROOT,
      "workflows",
      "workflows",
      "agent-environment-setup",
      "platforms",
      "copilot",
      "skills",
      "skills_index.json",
    ),
    prefix: ".github/skills/",
  },
};

function error(message) {
  errors.push(message);
}

async function gitTrackedFiles(targetPath) {
  const { stdout } = await execFile("git", ["ls-files", "--", targetPath], {
    cwd: ROOT,
  });
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function ensureRemovedPath(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (await pathExists(absolutePath)) {
    error(`${relativePath} should be removed from the repository tree.`);
  }
  const tracked = await gitTrackedFiles(relativePath);
  if (tracked.length > 0) {
    error(`${relativePath} should not remain tracked in git.`);
  }
}

function normalizeIndexRows(rows, expectedPrefix, label) {
  return rows.map((row) => {
    const relativeSkillPath = String(row?.path || "");
    if (!relativeSkillPath.startsWith(expectedPrefix)) {
      throw new Error(
        `${label} skills index contains unexpected path prefix '${relativeSkillPath}'`,
      );
    }

    return {
      ...row,
      path: relativeSkillPath.slice(expectedPrefix.length),
    };
  });
}

async function validateSkillsIndexPrefixes() {
  const canonicalRows = JSON.parse(
    await fs.readFile(INDEX_VARIANTS.canonical.filePath, "utf8"),
  );
  const claudeRows = JSON.parse(
    await fs.readFile(INDEX_VARIANTS.claude.filePath, "utf8"),
  );
  const copilotRows = JSON.parse(
    await fs.readFile(INDEX_VARIANTS.copilot.filePath, "utf8"),
  );

  const canonicalNormalized = normalizeIndexRows(
    canonicalRows,
    INDEX_VARIANTS.canonical.prefix,
    "canonical",
  );
  const claudeNormalized = normalizeIndexRows(
    claudeRows,
    INDEX_VARIANTS.claude.prefix,
    "claude",
  );
  const copilotNormalized = normalizeIndexRows(
    copilotRows,
    INDEX_VARIANTS.copilot.prefix,
    "copilot",
  );

  const canonicalJson = JSON.stringify(canonicalNormalized);
  if (canonicalJson !== JSON.stringify(claudeNormalized)) {
    error("Canonical and Claude skills indexes diverge beyond the path prefix transform.");
  }
  if (canonicalJson !== JSON.stringify(copilotNormalized)) {
    error("Canonical and Copilot skills indexes diverge beyond the path prefix transform.");
  }
}

async function validateSkillCreatorReferenceMirrors() {
  const canonicalFiles = await listMarkdownFiles(CANONICAL_REFERENCES_ROOT);
  const canonicalRelativePaths = canonicalFiles.map((filePath) =>
    path.relative(CANONICAL_REFERENCES_ROOT, filePath),
  );

  for (const [platformId, mirrorRoot] of Object.entries(MIRRORED_REFERENCE_ROOTS)) {
    const mirrorFiles = await listMarkdownFiles(mirrorRoot);
    const mirrorRelativePaths = mirrorFiles.map((filePath) =>
      path.relative(mirrorRoot, filePath),
    );

    if (JSON.stringify(mirrorRelativePaths) !== JSON.stringify(canonicalRelativePaths)) {
      error(
        `skill-creator reference file set for ${platformId} does not match the canonical source.`,
      );
      continue;
    }

    for (const relativePath of canonicalRelativePaths) {
      const canonicalContent = await fs.readFile(
        path.join(CANONICAL_REFERENCES_ROOT, relativePath),
        "utf8",
      );
      const mirrorContent = await fs.readFile(
        path.join(mirrorRoot, relativePath),
        "utf8",
      );
      if (canonicalContent !== mirrorContent) {
        error(
          `skill-creator reference '${relativePath}' drifted for ${platformId}.`,
        );
      }
    }
  }
}

async function main() {
  const trackedCoverage = await gitTrackedFiles("mcp/coverage");
  if (trackedCoverage.length > 0) {
    error("Generated coverage output under mcp/coverage must not remain tracked.");
  }
  if (await pathExists(path.join(ROOT, "mcp", "coverage"))) {
    error("mcp/coverage should not exist in the working tree.");
  }

  for (const relativePath of REMOVED_PATHS) {
    await ensureRemovedPath(relativePath);
  }

  await validateSkillCreatorReferenceMirrors();
  await validateSkillsIndexPrefixes();

  if (errors.length > 0) {
    for (const message of errors) {
      console.error(`- ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("cleanup invariants OK");
}

await main();
