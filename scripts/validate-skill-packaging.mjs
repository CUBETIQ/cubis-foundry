#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import {
  getMetadataBlock,
  getScalar,
  normalizeBoolean,
  normalizeNullableString,
  parseFrontmatter,
} from "./lib/skill-catalog.mjs";

const ROOT = process.cwd();
const CANONICAL_SKILLS_ROOT = path.join(ROOT, "workflows", "skills");

// ─── Universal skill template constants ─────────────────────

const ALLOWED_FRONTMATTER_KEYS = new Set([
  "name",
  "description",
  "license",
  "metadata",
  "compatibility",
]);

const REQUIRED_HEADINGS = [
  /^# .+/m, // # Title
  /^## Purpose$/m, // ## Purpose
  /^## When to Use$/m, // ## When to Use
  /^## Instructions$/m, // ## Instructions
  /^## Output Format$/m, // ## Output Format
];

const REQUIRED_HEADING_NAMES = [
  "# Title",
  "## Purpose",
  "## When to Use",
  "## Instructions",
  "## Output Format",
];

const OPTIONAL_HEADINGS = ["## References", "## Scripts", "## Examples"];

const RETIRED_HEADINGS = [
  "## Core workflow",
  "## SOP",
  "## STANDARD OPERATING PROCEDURE",
  "## IDENTITY",
  "## BOUNDARIES",
  "## Baseline standards",
  "## Avoid",
  "## When Not to Use",
  "## When not to use",
  "## Implementation guidance",
  "## Reference files",
  "## Helper Scripts",
  "## Rules",
  "## Related Powers",
];

const REJECTED_METADATA_KEYS = new Set([
  "domain",
  "role",
  "stack",
  "category",
  "layer",
  "canonical",
  "maturity",
  "baseline",
  "provenance",
  "transition",
  "aliases",
  "tags",
  "deprecated",
  "replaced_by",
]);

const KEBAB_CASE_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const SHARED_ROOT = path.join(
  ROOT,
  "workflows",
  "workflows",
  "agent-environment-setup",
  "shared",
);
const PLATFORM_SKILL_ROOTS = [
  path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "copilot",
    "skills",
  ),
  path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "claude",
    "skills",
  ),
];

async function exists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function listDirs(root) {
  if (!(await exists(root))) return [];
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function readUtf8(filePath) {
  return fs.readFile(filePath, "utf8");
}

function extractMarkdownLinks(markdown) {
  const content = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "");
  return [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function extractBacktickedMarkdownPaths(markdown) {
  const content = markdown.replace(/```[\s\S]*?```/g, "");
  return [...content.matchAll(/`([^`\n]+\.md)`/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function shouldValidateLink(target) {
  if (!target) return false;
  if (target.startsWith("http://") || target.startsWith("https://"))
    return false;
  if (target.startsWith("mailto:") || target.startsWith("#")) return false;
  if (target.startsWith("/") || target.startsWith("~/")) return false;
  if (target.includes("{") || target.includes("}")) return false;
  if (target.includes("<") || target.includes(">")) return false;
  // Skip well-known generated or platform-external files
  if (target === "GEMINI.md") return false;
  if (target.startsWith(".idx/") || target.startsWith(".codex/")) return false;
  return true;
}

function normalizeMarkdownTarget(target) {
  const withoutAnchor = String(target).split("#")[0];
  return withoutAnchor.split("?")[0];
}

async function listMarkdownFiles(root) {
  const files = [];
  const queue = [root];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || !(await exists(current))) continue;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

async function listRuntimeMarkdownFiles(skillRoot) {
  const files = [];
  const skillFile = path.join(skillRoot, "SKILL.md");
  if (await exists(skillFile)) files.push(skillFile);

  for (const folder of ["references", "steering"]) {
    const folderPath = path.join(skillRoot, folder);
    if (!(await exists(folderPath))) continue;
    files.push(...(await listMarkdownFiles(folderPath)));
  }

  return files.sort((a, b) => a.localeCompare(b));
}

async function validateMarkdownTargets(markdownFile, errors, prefix) {
  const markdown = await readUtf8(markdownFile);
  const targets = new Set([
    ...extractMarkdownLinks(markdown),
    ...(path.basename(markdownFile) === "SKILL.md"
      ? extractBacktickedMarkdownPaths(markdown)
      : []),
  ]);

  for (const target of targets) {
    if (!shouldValidateLink(target)) continue;
    const normalizedTarget = normalizeMarkdownTarget(target);
    if (!normalizedTarget) continue;
    const resolved = path.resolve(path.dirname(markdownFile), normalizedTarget);
    if (!(await exists(resolved))) {
      errors.push(`${markdownFile}: ${prefix} markdown reference '${target}'`);
      continue;
    }
    if (path.extname(resolved) === ".md") {
      const linkedContent = (await readUtf8(resolved)).trim();
      if (!linkedContent) {
        errors.push(
          `${markdownFile}: ${prefix} markdown reference '${target}' is empty`,
        );
      }
    }
  }
}

// ─── Universal skill template validation ────────────────────

function extractFrontmatterKeys(frontmatterRaw) {
  const keys = [];
  for (const line of frontmatterRaw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (match) keys.push(match[1]);
  }
  return keys;
}

function extractMetadataSubkeys(frontmatterRaw) {
  const lines = frontmatterRaw.split(/\r?\n/);
  const subkeys = [];
  let inMetadata = false;
  for (const line of lines) {
    if (!inMetadata) {
      if (/^metadata\s*:\s*$/.test(line)) inMetadata = true;
      continue;
    }
    if (!line.trim()) continue;
    if (!/^\s+/.test(line)) break;
    const match = line.match(/^\s+([A-Za-z0-9_-]+)\s*:/);
    if (match) subkeys.push(match[1]);
  }
  return subkeys;
}

function validateUniversalFrontmatter(
  skillFile,
  skillId,
  frontmatterRaw,
  errors,
) {
  const name = getScalar(frontmatterRaw, "name");
  const description = getScalar(frontmatterRaw, "description");

  // Required fields
  if (!name) {
    errors.push(`${skillFile}: missing required frontmatter field 'name'`);
  } else if (!KEBAB_CASE_RE.test(name)) {
    errors.push(`${skillFile}: 'name' must be kebab-case, got '${name}'`);
  } else if (name !== skillId) {
    errors.push(
      `${skillFile}: 'name' (${name}) must match directory name (${skillId})`,
    );
  }

  if (!description) {
    errors.push(
      `${skillFile}: missing required frontmatter field 'description'`,
    );
  } else if (description.length < 20) {
    errors.push(
      `${skillFile}: 'description' must be at least 20 characters (got ${description.length})`,
    );
  }

  // Reject disallowed top-level keys
  const topKeys = extractFrontmatterKeys(frontmatterRaw);
  for (const key of topKeys) {
    if (!ALLOWED_FRONTMATTER_KEYS.has(key)) {
      errors.push(
        `${skillFile}: disallowed frontmatter key '${key}' (only name, description, license, metadata, compatibility allowed)`,
      );
    }
  }

  // Reject disallowed metadata subkeys
  const metaSubkeys = extractMetadataSubkeys(frontmatterRaw);
  const ALLOWED_META_SUBKEYS = new Set(["author", "version"]);
  for (const key of metaSubkeys) {
    if (!ALLOWED_META_SUBKEYS.has(key)) {
      errors.push(
        `${skillFile}: disallowed metadata subkey '${key}' (only author, version allowed)`,
      );
    }
  }
}

function validateUniversalHeadings(skillFile, body, errors, warnings) {
  // Check required headings
  for (let i = 0; i < REQUIRED_HEADINGS.length; i++) {
    if (!REQUIRED_HEADINGS[i].test(body)) {
      errors.push(
        `${skillFile}: missing required heading '${REQUIRED_HEADING_NAMES[i]}'`,
      );
    }
  }

  // Check retired headings
  for (const heading of RETIRED_HEADINGS) {
    const re = new RegExp(
      `^${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
      "m",
    );
    if (re.test(body)) {
      errors.push(
        `${skillFile}: retired heading '${heading}' must be migrated (see _schema/SKILL_FORMAT.md)`,
      );
    }
  }

  // Warn on missing optional headings
  for (const heading of OPTIONAL_HEADINGS) {
    const re = new RegExp(
      `^${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
      "m",
    );
    if (!re.test(body)) {
      warnings.push(`${skillFile}: optional heading '${heading}' not found`);
    }
  }
}

async function validateCanonicalSkillReferences(errors, warnings) {
  const legacySystemRoot = path.join(CANONICAL_SKILLS_ROOT, ".system");
  if (await exists(legacySystemRoot)) {
    errors.push(
      `${legacySystemRoot}: repo-owned .system skill source must not exist`,
    );
  }

  const legacySkillAuthoringRoot = path.join(
    CANONICAL_SKILLS_ROOT,
    "skill-authoring",
  );
  if (await exists(legacySkillAuthoringRoot)) {
    errors.push(
      `${legacySkillAuthoringRoot}: legacy skill-authoring package must be removed or renamed to skill-creator`,
    );
  }

  for (const skillId of await listDirs(CANONICAL_SKILLS_ROOT)) {
    if (skillId.startsWith("_")) continue;
    const skillRoot = path.join(CANONICAL_SKILLS_ROOT, skillId);
    const skillFile = path.join(skillRoot, "SKILL.md");
    if (!(await exists(skillFile))) continue;

    const powerFile = path.join(skillRoot, "POWER.md");
    if (await exists(powerFile)) {
      errors.push(`${skillRoot}: canonical POWER.md must not exist`);
    }

    const markdown = await readUtf8(skillFile);
    const { raw: frontmatterRaw, body } = parseFrontmatter(markdown);
    const metadata = getMetadataBlock(frontmatterRaw);

    // Universal template validation
    validateUniversalFrontmatter(skillFile, skillId, frontmatterRaw, errors);
    validateUniversalHeadings(skillFile, body, errors, warnings);

    if (markdown.includes("skill-authoring")) {
      errors.push(`${skillFile}: stale skill-authoring reference`);
    }
    if (markdown.includes("workflows/powers/")) {
      errors.push(`${skillFile}: stale workflows/powers reference`);
    }
    if (markdown.includes("## Related Powers")) {
      errors.push(
        `${skillFile}: power-era section '## Related Powers' must be removed`,
      );
    }
    if (markdown.includes("When to Use This Power")) {
      errors.push(
        `${skillFile}: power-era heading 'When to Use This Power' must be renamed`,
      );
    }

    const entries = await fs.readdir(skillRoot, { withFileTypes: true });
    const topLevelMarkdown = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
    const extraTopLevel = topLevelMarkdown.filter(
      (name) => name !== "SKILL.md",
    );
    if (extraTopLevel.length > 0) {
      errors.push(
        `${skillRoot}: extra top-level markdown entries detected (${extraTopLevel.join(", ")})`,
      );
    }

    const isDeprecated = normalizeBoolean(metadata.deprecated);
    const replacedBy = normalizeNullableString(metadata.replaced_by);
    if (isDeprecated && !replacedBy) {
      errors.push(
        `${skillFile}: deprecated compatibility skill must declare metadata.replaced_by`,
      );
    }
    if (replacedBy && replacedBy !== skillId) {
      const replacementSkill = path.join(
        CANONICAL_SKILLS_ROOT,
        replacedBy,
        "SKILL.md",
      );
      if (!(await exists(replacementSkill))) {
        errors.push(
          `${skillFile}: replacement target '${replacedBy}' does not exist`,
        );
      }
    }

    for (const markdownFile of await listRuntimeMarkdownFiles(skillRoot)) {
      await validateMarkdownTargets(markdownFile, errors, "missing referenced");
    }
  }
}

async function validateSharedPowerRefs(errors) {
  const queue = [SHARED_ROOT];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || !(await exists(current))) continue;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const content = await readUtf8(fullPath);
      if (content.includes("skill-authoring")) {
        errors.push(`${fullPath}: stale skill-authoring reference`);
      }
      if (content.includes("workflows/powers/")) {
        errors.push(`${fullPath}: stale workflows/powers reference`);
      }
    }
  }
}

async function validatePlatformBundles(errors) {
  for (const root of PLATFORM_SKILL_ROOTS) {
    for (const skillId of await listDirs(root)) {
      const skillRoot = path.join(root, skillId);
      const skillFile = path.join(skillRoot, "SKILL.md");
      const entries = await fs.readdir(skillRoot, { withFileTypes: true });
      const topLevelMarkdown = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));
      if (topLevelMarkdown.includes("POWER.md")) {
        errors.push(
          `${skillRoot}: POWER.md must not be exposed in platform-facing skill bundles`,
        );
      }
      const extraTopLevel = topLevelMarkdown.filter(
        (name) => name !== "SKILL.md",
      );
      if (extraTopLevel.length > 0) {
        errors.push(
          `${skillRoot}: extra top-level markdown entries detected (${extraTopLevel.join(", ")})`,
        );
      }

      if (!(await exists(skillFile))) {
        errors.push(
          `${skillRoot}: SKILL.md missing in platform-facing skill bundle`,
        );
        continue;
      }

      const raw = await readUtf8(skillFile);
      if (raw.includes("skill-authoring")) {
        errors.push(`${skillFile}: stale mirrored skill-authoring reference`);
      }

      for (const markdownFile of await listRuntimeMarkdownFiles(skillRoot)) {
        await validateMarkdownTargets(markdownFile, errors, "broken mirrored");
      }
    }
  }
}

async function main() {
  const errors = [];
  const warnings = [];
  await validateCanonicalSkillReferences(errors, warnings);
  await validateSharedPowerRefs(errors);
  await validatePlatformBundles(errors);

  if (warnings.length > 0) {
    console.warn("Skill packaging warnings:");
    for (const item of warnings) {
      console.warn(`  ⚠ ${item}`);
    }
    console.warn("");
  }

  if (errors.length > 0) {
    console.error("Skill packaging validation failed:");
    for (const item of errors) {
      console.error(`  ✗ ${item}`);
    }
    process.exit(1);
  }

  console.log("✓ Skill packaging validation passed");
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
