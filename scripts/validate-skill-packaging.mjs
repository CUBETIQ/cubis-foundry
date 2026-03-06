#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";

const ROOT = process.cwd();
const CANONICAL_SKILLS_ROOT = path.join(ROOT, "workflows", "skills");
const SHARED_ROOT = path.join(
  ROOT,
  "workflows",
  "workflows",
  "agent-environment-setup",
  "shared",
);
const PLATFORM_SKILL_ROOTS = [
  path.join(ROOT, "workflows", "workflows", "agent-environment-setup", "platforms", "copilot", "skills"),
  path.join(ROOT, "workflows", "workflows", "agent-environment-setup", "platforms", "cursor", "skills"),
  path.join(ROOT, "workflows", "workflows", "agent-environment-setup", "platforms", "windsurf", "skills"),
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
  return [...markdown.matchAll(/`([^`\n]+\.md)`/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function shouldValidateLink(target) {
  if (!target) return false;
  if (target.startsWith("http://") || target.startsWith("https://")) return false;
  if (target.startsWith("mailto:") || target.startsWith("#")) return false;
  if (target.startsWith("/")) return false;
  if (target.includes("{") || target.includes("}")) return false;
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
        errors.push(`${markdownFile}: ${prefix} markdown reference '${target}' is empty`);
      }
    }
  }
}

async function validateCanonicalSkillReferences(errors) {
  for (const skillId of await listDirs(CANONICAL_SKILLS_ROOT)) {
    const skillRoot = path.join(CANONICAL_SKILLS_ROOT, skillId);
    const skillFile = path.join(skillRoot, "SKILL.md");
    if (!(await exists(skillFile))) continue;

    const powerFile = path.join(skillRoot, "POWER.md");
    if (await exists(powerFile)) {
      errors.push(`${skillRoot}: canonical POWER.md must not exist`);
    }

    const markdown = await readUtf8(skillFile);
    if (markdown.includes("workflows/powers/")) {
      errors.push(`${skillFile}: stale workflows/powers reference`);
    }
    if (markdown.includes("## Related Powers")) {
      errors.push(`${skillFile}: power-era section '## Related Powers' must be removed`);
    }
    if (markdown.includes("When to Use This Power")) {
      errors.push(`${skillFile}: power-era heading 'When to Use This Power' must be renamed`);
    }

    const entries = await fs.readdir(skillRoot, { withFileTypes: true });
    const topLevelMarkdown = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
    const extraTopLevel = topLevelMarkdown.filter((name) => name !== "SKILL.md");
    if (extraTopLevel.length > 0) {
      errors.push(`${skillRoot}: extra top-level markdown entries detected (${extraTopLevel.join(", ")})`);
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
        errors.push(`${skillRoot}: POWER.md must not be exposed in platform-facing skill bundles`);
      }
      const extraTopLevel = topLevelMarkdown.filter((name) => name !== "SKILL.md");
      if (extraTopLevel.length > 0) {
        errors.push(`${skillRoot}: extra top-level markdown entries detected (${extraTopLevel.join(", ")})`);
      }

      if (!(await exists(skillFile))) {
        errors.push(`${skillRoot}: SKILL.md missing in platform-facing skill bundle`);
        continue;
      }

      for (const markdownFile of await listRuntimeMarkdownFiles(skillRoot)) {
        await validateMarkdownTargets(markdownFile, errors, "broken mirrored");
      }
    }
  }
}

async function main() {
  const errors = [];
  await validateCanonicalSkillReferences(errors);
  await validateSharedPowerRefs(errors);
  await validatePlatformBundles(errors);

  if (errors.length > 0) {
    console.error("Skill packaging validation failed:");
    for (const item of errors) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log("✓ Skill packaging validation passed");
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
