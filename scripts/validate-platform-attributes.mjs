#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";

const ROOT = process.cwd();
const ASSETS_ROOT = path.join(ROOT, "workflows");
const BUNDLE_ROOT = path.join(
  ASSETS_ROOT,
  "workflows",
  "agent-environment-setup"
);
const MANIFEST_PATH = path.join(BUNDLE_ROOT, "manifest.json");
const SKILLS_INDEX_PATH = path.join(ASSETS_ROOT, "skills", "skills_index.json");
const CLI_ARGS = new Set(process.argv.slice(2));
const STRICT_MODE = CLI_ARGS.has("--strict");

const COPILOT_ALLOWED_SKILL_KEYS = new Set([
  "compatibility",
  "description",
  "license",
  "metadata",
  "name"
]);

const COPILOT_ALLOWED_AGENT_KEYS = new Set([
  "name",
  "description",
  "tools",
  "target",
  "infer",
  "mcp-servers",
  "metadata",
  "model",
  "handoffs",
  "argument-hint"
]);
const COMMON_NON_STRICT_SKILL_KEYS = new Set([
  "name",
  "description",
  "keywords",
  "displayName",
  "triggers",
  "compatibility",
  "license",
  "metadata",
  "allowed-tools",
  "author",
  "version",
  "priority"
]);

const platforms = {
  antigravity: {
    workflowDir: "workflows",
    agentDir: "agents",
    rulesFile: "rules/GEMINI.md"
  },
  codex: {
    workflowDir: "workflows",
    agentDir: "agents",
    rulesFile: "rules/AGENTS.md"
  },
  copilot: {
    workflowDir: "workflows",
    agentDir: "agents",
    rulesFile: "rules/AGENTS.md"
  }
};

function parseFrontmatter(markdown) {
  // Accept both LF and CRLF line endings to avoid false "missing frontmatter" errors on Windows.
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  return {
    raw: match[1],
    body: markdown.slice(match[0].length)
  };
}

function collectTopLevelKeys(frontmatterRaw) {
  const keys = [];
  for (const line of frontmatterRaw.split(/\r?\n/)) {
    if (!line || /^\s/.test(line)) continue;
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (m) keys.push(m[1]);
  }
  return [...new Set(keys)];
}

function getScalar(frontmatterRaw, key) {
  const m = frontmatterRaw.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"));
  if (!m) return null;
  return m[1].trim().replace(/^['\"]|['\"]$/g, "");
}

function parseInlineList(text) {
  if (!text) return [];
  const trimmed = text.trim();
  const inner =
    trimmed.startsWith("[") && trimmed.endsWith("]")
      ? trimmed.slice(1, -1)
      : trimmed;
  return inner
    .split(",")
    .map((item) => item.trim().replace(/^['\"]|['\"]$/g, ""))
    .filter(Boolean);
}

function getList(frontmatterRaw, key) {
  const lines = frontmatterRaw.split(/\r?\n/);
  const out = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const keyMatch = line.match(new RegExp(`^${key}\\s*:\\s*(.*)$`));
    if (!keyMatch) continue;

    const rest = keyMatch[1].trim();
    if (rest) {
      out.push(...parseInlineList(rest));
      return [...new Set(out)];
    }

    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j];
      if (!next.trim()) continue;
      if (/^[A-Za-z0-9_-]+\s*:/.test(next)) break;

      const bullet = next.match(/^\s*-\s*(.+)$/);
      if (!bullet) continue;
      out.push(bullet[1].trim().replace(/^['\"]|['\"]$/g, ""));
    }

    return [...new Set(out)];
  }

  return [];
}

async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readUtf8(filePath) {
  return fs.readFile(filePath, "utf8");
}

function extractSkillIdFromIndexPath(indexPathValue) {
  const raw = String(indexPathValue || "").trim();
  if (!raw) return null;
  const normalized = raw.replace(/\\\\/g, "/");
  const marker = "/skills/";
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex === -1) return null;
  const remainder = normalized.slice(markerIndex + marker.length);
  const [skillId] = remainder.split("/");
  const normalizedSkillId = String(skillId || "").trim();
  return normalizedSkillId || null;
}

async function resolveIndexedTopLevelSkillIds(skillRoot) {
  if (!(await pathExists(SKILLS_INDEX_PATH))) return [];
  const raw = await readUtf8(SKILLS_INDEX_PATH);
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed) ? parsed : [];
  const candidates = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.name === "string" && entry.name.trim()) {
      candidates.push(entry.name.trim());
    }
    const byPath = extractSkillIdFromIndexPath(entry.path);
    if (byPath) candidates.push(byPath);
  }

  const out = [];
  const seen = new Set();
  for (const candidate of candidates) {
    if (!candidate || candidate.startsWith(".")) continue;
    const key = candidate.toLowerCase();
    if (seen.has(key)) continue;
    const skillDir = path.join(skillRoot, candidate);
    const skillFile = path.join(skillDir, "SKILL.md");
    if (!(await pathExists(skillDir))) continue;
    if (!(await pathExists(skillFile))) continue;
    seen.add(key);
    out.push(candidate);
  }

  return out.sort((a, b) => a.localeCompare(b));
}

function error(errors, filePath, message) {
  errors.push(`${filePath}: ${message}`);
}

function warn(warnings, filePath, message) {
  warnings.push(`${filePath}: ${message}`);
}

async function validateWorkflowFile(filePath, errors) {
  const raw = await readUtf8(filePath);
  const fm = parseFrontmatter(raw);
  if (!fm) {
    error(errors, filePath, "missing frontmatter");
    return;
  }

  const command = getScalar(fm.raw, "command");
  const description = getScalar(fm.raw, "description");

  if (!command || !command.startsWith("/")) {
    error(errors, filePath, "frontmatter command is missing or invalid (must start with '/')");
  }
  if (!description) {
    error(errors, filePath, "frontmatter description is missing");
  }
}

async function validateSkillFile({ filePath, platform, errors, warnings, notes }) {
  const raw = await readUtf8(filePath);
  const fm = parseFrontmatter(raw);
  if (!fm) {
    error(errors, filePath, "missing frontmatter");
    return;
  }

  const keys = collectTopLevelKeys(fm.raw);
  const name = getScalar(fm.raw, "name");
  const description = getScalar(fm.raw, "description");

  if (!name) error(errors, filePath, "missing required 'name' in frontmatter");
  if (!description) error(errors, filePath, "missing required 'description' in frontmatter");

  if (platform === "copilot") {
    const unsupported = keys.filter((key) => !COPILOT_ALLOWED_SKILL_KEYS.has(key));
    if (unsupported.length > 0) {
      notes.push(
        `${filePath}: source skill has Copilot-unsupported keys (${unsupported.join(
          ", "
        )}); installer is expected to sanitize these on Copilot install`
      );
    }
  }

  if (platform !== "copilot") {
    const unknown = keys.filter((key) => !COMMON_NON_STRICT_SKILL_KEYS.has(key));
    if (unknown.length > 0) {
      warn(warnings, filePath, `non-standard skill keys present: ${unknown.join(", ")}`);
    }
  }
}

async function validateAgentFile({
  filePath,
  platform,
  skillSet,
  errors,
  warnings,
  notes
}) {
  const raw = await readUtf8(filePath);
  const fm = parseFrontmatter(raw);
  if (!fm) {
    error(errors, filePath, "missing frontmatter");
    return;
  }

  const keys = collectTopLevelKeys(fm.raw);
  const name = getScalar(fm.raw, "name");
  const description = getScalar(fm.raw, "description");

  if (!name) error(errors, filePath, "missing required 'name' in frontmatter");
  if (!description) error(errors, filePath, "missing required 'description' in frontmatter");

  if (platform === "copilot") {
    const unsupported = keys.filter((key) => !COPILOT_ALLOWED_AGENT_KEYS.has(key));
    if (unsupported.length > 0) {
      notes.push(`${filePath}: source Copilot agent has unsupported keys (${unsupported.join(
        ", "
      )}); installer is expected to sanitize these during install`);
    }

    const ignoredOnGithub = keys.filter((key) => ["model", "handoffs", "argument-hint"].includes(key));
    if (ignoredOnGithub.length > 0) {
      warn(
        warnings,
        filePath,
        `keys ignored by github.com coding agent (still valid in VS Code): ${ignoredOnGithub.join(", ")}`
      );
    }
    return;
  }

  const referencedSkills = getList(fm.raw, "skills");
  for (const skillId of referencedSkills) {
    if (!skillSet.has(skillId)) {
      if (skillId.includes("/")) {
        warn(
          warnings,
          filePath,
          `references hierarchical skill '${skillId}' (no direct skill folder; treated as conceptual alias)`
        );
      } else {
        error(errors, filePath, `references missing skill '${skillId}'`);
      }
    }
  }
}

async function main() {
  const errors = [];
  const warnings = [];
  const notes = [];

  if (!(await pathExists(MANIFEST_PATH))) {
    console.error(`Manifest not found: ${MANIFEST_PATH}`);
    process.exit(1);
  }

  const manifest = JSON.parse(await readUtf8(MANIFEST_PATH));
  const skillRoot = path.join(ASSETS_ROOT, "skills");
  const powerRoot = path.join(ASSETS_ROOT, "powers");
  const indexedSkillIds = await resolveIndexedTopLevelSkillIds(skillRoot);
  const indexedSkillSet = new Set(indexedSkillIds);
  if (indexedSkillSet.size === 0) {
    error(errors, SKILLS_INDEX_PATH, "no indexed top-level skills resolved");
  }

  const allManifestSkills = new Set();

  for (const [platformId, spec] of Object.entries(manifest.platforms || {})) {
    const platformCfg = platforms[platformId];
    if (!platformCfg) {
      error(errors, MANIFEST_PATH, `unknown platform in manifest: '${platformId}'`);
      continue;
    }

    const platformRoot = path.join(BUNDLE_ROOT, "platforms", platformId);

    const workflowFiles = Array.isArray(spec.workflows) ? spec.workflows : [];
    const agentFiles = Array.isArray(spec.agents) ? spec.agents : [];
    const skills = Array.isArray(spec.skills) ? spec.skills : [];

    const uniqueSkills = new Set(indexedSkillSet);
    for (const skillId of skills) allManifestSkills.add(skillId);

    for (const rel of workflowFiles) {
      const filePath = path.join(platformRoot, platformCfg.workflowDir, rel);
      if (!(await pathExists(filePath))) {
        error(errors, filePath, "workflow file listed in manifest is missing");
        continue;
      }
      await validateWorkflowFile(filePath, errors);
    }

    for (const rel of agentFiles) {
      const filePath = path.join(platformRoot, platformCfg.agentDir, rel);
      if (!(await pathExists(filePath))) {
        error(errors, filePath, "agent file listed in manifest is missing");
        continue;
      }
      await validateAgentFile({
        filePath,
        platform: platformId,
        skillSet: uniqueSkills,
        errors,
        warnings,
        notes
      });
    }

    for (const skillId of skills) {
      const skillDir = path.join(skillRoot, skillId);
      const skillFile = path.join(skillDir, "SKILL.md");
      if (!(await pathExists(skillDir))) {
        error(errors, skillDir, `skill listed in manifest for ${platformId} is missing`);
        continue;
      }
      if (!(await pathExists(skillFile))) {
        error(errors, skillFile, `SKILL.md missing for skill '${skillId}'`);
        continue;
      }

      await validateSkillFile({
        filePath: skillFile,
        platform: platformId,
        errors,
        warnings,
        notes
      });
    }

    if (spec.rulesTemplate) {
      const rulesPath = path.join(BUNDLE_ROOT, spec.rulesTemplate);
      if (!(await pathExists(rulesPath))) {
        error(errors, rulesPath, "rulesTemplate path is missing");
      }
    } else {
      error(errors, MANIFEST_PATH, `rulesTemplate missing for platform '${platformId}'`);
    }
  }

  for (const skillId of allManifestSkills) {
    const powerDir = path.join(powerRoot, skillId);
    if (!(await pathExists(powerDir))) {
      warn(warnings, powerDir, `no matching power folder for skill '${skillId}'`);
    }
  }

  const summary = {
    manifest: MANIFEST_PATH,
    platforms: Object.keys(manifest.platforms || {}),
    skillCount: indexedSkillSet.size,
    strict: STRICT_MODE,
    errors: errors.length,
    warnings: warnings.length,
    notes: notes.length
  };

  console.log(JSON.stringify(summary, null, 2));

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const item of warnings.slice(0, 40)) {
      console.log(`- ${item}`);
    }
    if (warnings.length > 40) {
      console.log(`- ...and ${warnings.length - 40} more`);
    }
  }

  if (notes.length > 0) {
    console.log("\nNotes:");
    for (const item of notes.slice(0, 20)) {
      console.log(`- ${item}`);
    }
    if (notes.length > 20) {
      console.log(`- ...and ${notes.length - 20} more`);
    }
  }

  if (errors.length > 0) {
    console.error("\nErrors:");
    for (const item of errors) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  if (STRICT_MODE && warnings.length > 0) {
    console.error(`\nStrict mode failed: ${warnings.length} warning(s) found.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
