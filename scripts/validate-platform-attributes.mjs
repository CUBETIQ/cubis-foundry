#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import { checkPlatformAssets } from "./generate-platform-assets.mjs";

const ROOT = process.cwd();
const BUNDLE_ROOT = path.join(
  ROOT,
  "workflows",
  "workflows",
  "agent-environment-setup",
);
const MANIFEST_PATH = path.join(BUNDLE_ROOT, "manifest.json");
const CANONICAL_MODULES_ROOT = path.join(ROOT, "foundry", "modules");
const STRICT = process.argv.includes("--strict");
const REMOVED_SKILL_IDS = new Set([
  "qa",
  "unit-testing",
  "integration-testing",
  "playwright-interactive",
  "stitch",
  "mcp-core",
  "research-core",
  "rules-core",
]);

async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function error(errors, pathLabel, message) {
  errors.push(`- ${pathLabel}: ${message}`);
}

async function listCanonicalSkillIds() {
  const entries = await fs.readdir(CANONICAL_MODULES_ROOT, { withFileTypes: true });
  const ids = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const skillFile = path.join(CANONICAL_MODULES_ROOT, entry.name, "SKILL.md");
    if (await pathExists(skillFile)) ids.push(entry.name);
  }
  return ids.sort((a, b) => a.localeCompare(b));
}

async function validatePlatformFiles({
  errors,
  platformId,
  rootDir,
  paths,
  label,
}) {
  for (const relativePath of paths) {
    const targetPath = path.join(rootDir, relativePath);
    if (!(await pathExists(targetPath))) {
      error(errors, MANIFEST_PATH, `${platformId} ${label} '${relativePath}' is missing`);
    }
  }
}

async function main() {
  const errors = [];
  const notes = [];
  const manifest = await readJson(MANIFEST_PATH);
  const canonicalSkillIds = await listCanonicalSkillIds();
  const canonicalSkillSet = new Set(canonicalSkillIds);
  const drift = await checkPlatformAssets();
  if (drift.drift.length > 0) {
    for (const item of drift.drift) {
      const parts = [];
      if (item.diff.missing.length > 0) {
        parts.push(`missing ${item.diff.missing.join(", ")}`);
      }
      if (item.diff.changed.length > 0) {
        parts.push(`changed ${item.diff.changed.join(", ")}`);
      }
      if (item.diff.extra.length > 0) {
        parts.push(`extra ${item.diff.extra.join(", ")}`);
      }
      error(errors, MANIFEST_PATH, `generator drift for ${item.label}: ${parts.join("; ")}`);
    }
  }

  for (const [platformId, platformSpec] of Object.entries(manifest.platforms || {})) {
    const platformRoot = path.join(BUNDLE_ROOT, "platforms", platformId);

    for (const skillId of platformSpec.skills || []) {
      if (REMOVED_SKILL_IDS.has(skillId)) {
        error(errors, MANIFEST_PATH, `removed skill '${skillId}' still appears for ${platformId}`);
        continue;
      }
      if (!canonicalSkillSet.has(skillId)) {
        error(errors, MANIFEST_PATH, `skill '${skillId}' listed in manifest for ${platformId} is missing`);
      }
    }

    for (const generatedSkillId of platformSpec.generatedSkills || []) {
      if (!generatedSkillId.startsWith("workflow-")) {
        error(
          errors,
          MANIFEST_PATH,
          `${platformId} generated skill '${generatedSkillId}' must use workflow-* naming`,
        );
        continue;
      }
      const sourceId = generatedSkillId.replace(/^workflow-/, "");
      const generatedSkillFile = path.join(
        platformRoot,
        "generated-skills",
        sourceId,
        "SKILL.md",
      );
      if (!(await pathExists(generatedSkillFile))) {
        error(errors, MANIFEST_PATH, `${platformId} generated skill '${generatedSkillId}' is missing`);
      }
    }

    await validatePlatformFiles({
      errors,
      platformId,
      rootDir: platformRoot,
      paths: platformSpec.agents?.map((name) => `agents/${name}`) || [],
      label: "agent",
    });
    await validatePlatformFiles({
      errors,
      platformId,
      rootDir: platformRoot,
      paths: platformSpec.commands?.map((name) => `commands/${name}`) || [],
      label: "command",
    });
    await validatePlatformFiles({
      errors,
      platformId,
      rootDir: platformRoot,
      paths: platformSpec.prompts?.map((name) => `prompts/${name}`) || [],
      label: "prompt",
    });
    await validatePlatformFiles({
      errors,
      platformId,
      rootDir: platformRoot,
      paths:
        platformSpec.hooks?.map((entry) =>
          typeof entry === "string"
            ? `hooks/${entry}`
            : typeof entry?.file === "string"
              ? `hooks/${entry.file}`
              : null,
        ).filter(Boolean) || [],
      label: "hook",
    });

    if (platformSpec.rulesTemplate) {
      const rulesFile = path.join(BUNDLE_ROOT, platformSpec.rulesTemplate);
      if (!(await pathExists(rulesFile))) {
        error(errors, MANIFEST_PATH, `${platformId} rules template '${platformSpec.rulesTemplate}' is missing`);
      }
    }
  }

  const summary = {
    manifest: MANIFEST_PATH,
    platforms: Object.keys(manifest.platforms || {}),
    skillCount: canonicalSkillIds.length,
    strict: STRICT,
    errors: errors.length,
    warnings: 0,
    notes: notes.length,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (notes.length > 0) {
    console.log("\nNotes:");
    for (const note of notes) console.log(`- ${note}`);
  }
  if (errors.length > 0) {
    console.error("\nErrors:");
    for (const entry of errors) console.error(entry);
    process.exit(1);
  }
}

await main();
