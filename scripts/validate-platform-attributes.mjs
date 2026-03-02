#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const ROOT = process.cwd();
const ASSETS_ROOT = path.join(ROOT, "workflows");
const BUNDLE_ROOT = path.join(ASSETS_ROOT, "workflows", "agent-environment-setup");
const SHARED_ROOT = path.join(BUNDLE_ROOT, "shared");
const SHARED_AGENTS_DIR = path.join(SHARED_ROOT, "agents");
const SHARED_WORKFLOWS_DIR = path.join(SHARED_ROOT, "workflows");
const MANIFEST_PATH = path.join(BUNDLE_ROOT, "manifest.json");
const GENERATE_PLATFORM_ASSETS_SCRIPT = path.join(ROOT, "scripts", "generate-platform-assets.mjs");
const SKILLS_INDEX_PATH = path.join(ASSETS_ROOT, "skills", "skills_index.json");
const CANONICAL_SKILLS_ROOT = path.join(ASSETS_ROOT, "skills");
const MCP_SKILLS_ROOT = path.join(ROOT, "mcp", "skills");
const MIRROR_SKILL_ROOTS = {
  copilot: path.join(BUNDLE_ROOT, "platforms", "copilot", "skills"),
  cursor: path.join(BUNDLE_ROOT, "platforms", "cursor", "skills"),
  windsurf: path.join(BUNDLE_ROOT, "platforms", "windsurf", "skills")
};

const CLI_ARGS = new Set(process.argv.slice(2));
const STRICT_MODE = CLI_ARGS.has("--strict");
const execFile = promisify(execFileCallback);

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

const WORKFLOW_REQUIRED_SECTIONS = [
  "When to use",
  "Workflow steps",
  "Context notes",
  "Verification"
];

const platforms = {
  antigravity: {
    workflowDir: "workflows",
    agentDir: "agents",
    commandsDir: "commands",
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
    promptsDir: "prompts",
    rulesFile: "rules/AGENTS.md"
  }
};

function parseFrontmatter(markdown) {
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

function parseMetadata(frontmatterRaw) {
  const lines = frontmatterRaw.split(/\r?\n/);
  const metadata = {};
  let inMetadata = false;
  for (const line of lines) {
    if (/^metadata\s*:\s*$/.test(line)) {
      inMetadata = true;
      continue;
    }
    if (!inMetadata) continue;
    if (!line.trim()) continue;
    if (!/^\s+/.test(line)) break;
    const kv = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.+)\s*$/);
    if (!kv) continue;
    metadata[kv[1]] = kv[2].trim().replace(/^['\"]|['\"]$/g, "");
  }
  return metadata;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1";
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

async function listMarkdownFiles(dirPath) {
  if (!(await pathExists(dirPath))) return [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
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

async function resolveIndexedTopLevelSkillIds(canonicalMap) {
  if (!(await pathExists(SKILLS_INDEX_PATH))) return [];
  const raw = await readUtf8(SKILLS_INDEX_PATH);
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed) ? parsed : [];
  const candidates = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.id === "string" && entry.id.trim()) {
      candidates.push(entry.id.trim());
    }
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
    if (canonicalMap && !canonicalMap.has(key)) continue;
    seen.add(key);
    out.push(canonicalMap?.get(key)?.id || candidate);
  }

  return out.sort((a, b) => a.localeCompare(b));
}

async function listTopLevelSkillIds(skillsRoot) {
  if (!(await pathExists(skillsRoot))) return [];
  const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function buildCanonicalSkillMap() {
  const map = new Map();
  for (const root of [CANONICAL_SKILLS_ROOT, MCP_SKILLS_ROOT]) {
    if (!(await pathExists(root))) continue;
    const ids = await listTopLevelSkillIds(root);
    for (const skillId of ids) {
      const skillFile = path.join(root, skillId, "SKILL.md");
      if (!(await pathExists(skillFile))) continue;
      map.set(skillId.toLowerCase(), { id: skillId, root });
    }
  }
  return map;
}

async function findDuplicateSkillNamesInIndex() {
  if (!(await pathExists(SKILLS_INDEX_PATH))) return [];
  const raw = await readUtf8(SKILLS_INDEX_PATH);
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed) ? parsed : [];

  const counts = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!name) continue;
    const key = name.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

async function findDuplicateSkillIdsInIndex() {
  if (!(await pathExists(SKILLS_INDEX_PATH))) return [];
  const raw = await readUtf8(SKILLS_INDEX_PATH);
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed) ? parsed : [];

  const counts = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const id = String(entry.id || "").trim() || extractSkillIdFromIndexPath(entry.path) || "";
    if (!id) continue;
    const key = id.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

function stripCodeFences(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, "");
}

function extractMarkdownLinks(markdown) {
  const content = stripCodeFences(markdown).replace(/`[^`]*`/g, "");
  const links = [];
  const regex = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(content))) {
    links.push(match[1].trim());
  }
  return links;
}

function shouldValidateRelativeLink(target) {
  if (!target) return false;
  if (target.startsWith("http://") || target.startsWith("https://")) return false;
  if (target.startsWith("mailto:") || target.startsWith("#")) return false;
  if (target.startsWith("/")) return false;
  if (target.includes("{") || target.includes("}")) return false;
  return true;
}

function error(errors, filePath, message) {
  errors.push(`${filePath}: ${message}`);
}

function warn(warnings, filePath, message) {
  const item = `${filePath}: ${message}`;
  if (!warnings.includes(item)) {
    warnings.push(item);
  }
}

function note(notes, filePath, message) {
  const item = `${filePath}: ${message}`;
  if (!notes.includes(item)) {
    notes.push(item);
  }
}

function validateWorkflowRequiredSections(body, filePath, errors) {
  for (const section of WORKFLOW_REQUIRED_SECTIONS) {
    if (!new RegExp(`^##\\s+${section}$`, "m").test(body)) {
      error(errors, filePath, `missing required section '## ${section}'`);
    }
  }
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

  validateWorkflowRequiredSections(fm.body, filePath, errors);
}

async function validateSkillFile({ filePath, platform, errors, notes, canonicalMap }) {
  const raw = await readUtf8(filePath);
  const fm = parseFrontmatter(raw);
  if (!fm) {
    error(errors, filePath, "missing frontmatter");
    return;
  }

  const keys = collectTopLevelKeys(fm.raw);
  const name = getScalar(fm.raw, "name");
  const description = getScalar(fm.raw, "description");
  const metadata = parseMetadata(fm.raw);

  if (!name) error(errors, filePath, "missing required 'name' in frontmatter");
  if (!description) error(errors, filePath, "missing required 'description' in frontmatter");

  if (toBoolean(metadata.deprecated)) {
    if (!metadata.replaced_by) {
      error(errors, filePath, "deprecated skill missing metadata.replaced_by");
    }
    if (!metadata.removal_target) {
      error(errors, filePath, "deprecated skill missing metadata.removal_target");
    }
    if (metadata.replaced_by) {
      const replacement = canonicalMap?.get(String(metadata.replaced_by).toLowerCase());
      if (!replacement) {
        error(errors, filePath, `deprecated skill replacement missing: ${metadata.replaced_by}`);
      }
    }
  }

  for (const href of extractMarkdownLinks(raw)) {
    if (!shouldValidateRelativeLink(href)) continue;
    const cleanHref = href.split("#")[0].split("?")[0];
    if (!cleanHref) continue;
    const resolved = path.resolve(path.dirname(filePath), cleanHref);
    if (!(await pathExists(resolved))) {
      error(errors, filePath, `broken local link in SKILL.md: ${href}`);
    }
  }

  if (platform === "copilot") {
    const unsupported = keys.filter((key) => !COPILOT_ALLOWED_SKILL_KEYS.has(key));
    if (unsupported.length > 0) {
      note(
        notes,
        filePath,
        `canonical skill has Copilot-unsupported keys (${unsupported.join(", ")}); installer sanitization remains fallback`
      );
    }
    return;
  }

  const nonStandard = keys.filter((key) => ![
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
  ].includes(key));
  if (nonStandard.length > 0) {
    note(notes, filePath, `non-standard skill keys present: ${nonStandard.join(", ")}`);
  }

}

async function validateAgentFile({ filePath, platform, skillSet, errors, notes }) {
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
      error(errors, filePath, `Copilot agent contains unsupported keys (${unsupported.join(", ")})`);
    }
    return;
  }

  const referencedSkills = getList(fm.raw, "skills");
  for (const skillId of referencedSkills) {
    if (skillSet.has(String(skillId || "").toLowerCase())) continue;
    if (skillId.includes("/")) {
      note(
        notes,
        filePath,
        `references hierarchical skill '${skillId}' (no direct skill folder; treated as conceptual alias)`
      );
      continue;
    }
    error(errors, filePath, `references missing skill '${skillId}'`);
  }
}

async function validateCanonicalSkillsStructure({ errors, canonicalMap }) {
  const canonicalIds = [...canonicalMap.values()].map((item) => item.id).sort((a, b) => a.localeCompare(b));
  const canonicalSet = new Set(canonicalIds.map((id) => id.toLowerCase()));

  for (const skillId of canonicalIds) {
    const source = canonicalMap.get(skillId.toLowerCase())?.root || CANONICAL_SKILLS_ROOT;
    const skillFile = path.join(source, skillId, "SKILL.md");
    if (!(await pathExists(skillFile))) {
      error(errors, skillFile, `top-level canonical skill '${skillId}' is missing SKILL.md`);
    }
  }

  for (const [label, mirrorRoot] of Object.entries(MIRROR_SKILL_ROOTS)) {
    if (!(await pathExists(mirrorRoot))) {
      error(errors, mirrorRoot, `mirror skills root missing for '${label}'`);
      continue;
    }

    const mirrorIds = await listTopLevelSkillIds(mirrorRoot);
    const mirrorSet = new Set(mirrorIds.map((id) => id.toLowerCase()));

    for (const skillId of canonicalIds) {
      if (!mirrorSet.has(skillId.toLowerCase())) {
        error(errors, mirrorRoot, `mirror '${label}' missing canonical skill '${skillId}'`);
      }
      const skillFile = path.join(mirrorRoot, skillId, "SKILL.md");
      if (await pathExists(path.join(mirrorRoot, skillId)) && !(await pathExists(skillFile))) {
        error(errors, skillFile, `mirror '${label}' skill '${skillId}' missing SKILL.md`);
      }
    }

    for (const mirrorId of mirrorIds) {
      if (!canonicalSet.has(mirrorId.toLowerCase())) {
        error(errors, mirrorRoot, `mirror '${label}' has non-canonical skill '${mirrorId}'`);
      }
    }
  }
}

function normalizedSet(values) {
  return new Set(values.map((value) => String(value || "").trim().toLowerCase()).filter(Boolean));
}

function assertFileSetParity({ label, expected, actual, errors, contextPath }) {
  const expectedSet = normalizedSet(expected);
  const actualSet = normalizedSet(actual);

  for (const item of expectedSet) {
    if (!actualSet.has(item)) {
      error(errors, contextPath, `${label} missing '${item}'`);
    }
  }

  for (const item of actualSet) {
    if (!expectedSet.has(item)) {
      error(errors, contextPath, `${label} has unexpected '${item}'`);
    }
  }
}

async function validateSharedSourceAndGeneratedParity({ manifest, errors, notes }) {
  if (!(await pathExists(SHARED_AGENTS_DIR))) {
    error(errors, SHARED_AGENTS_DIR, "shared agents directory missing");
    return;
  }
  if (!(await pathExists(SHARED_WORKFLOWS_DIR))) {
    error(errors, SHARED_WORKFLOWS_DIR, "shared workflows directory missing");
    return;
  }

  const sharedAgents = await listMarkdownFiles(SHARED_AGENTS_DIR);
  const sharedWorkflows = await listMarkdownFiles(SHARED_WORKFLOWS_DIR);

  if (sharedAgents.length === 0) {
    error(errors, SHARED_AGENTS_DIR, "no shared agent markdown files found");
  }
  if (sharedWorkflows.length === 0) {
    error(errors, SHARED_WORKFLOWS_DIR, "no shared workflow markdown files found");
  }

  for (const fileName of sharedWorkflows) {
    await validateWorkflowFile(path.join(SHARED_WORKFLOWS_DIR, fileName), errors);
  }

  for (const platformId of ["codex", "antigravity", "copilot"]) {
    const spec = manifest.platforms?.[platformId];
    if (!spec) {
      error(errors, MANIFEST_PATH, `manifest missing platform '${platformId}'`);
      continue;
    }

    const platformRoot = path.join(BUNDLE_ROOT, "platforms", platformId);
    const workflowFiles = Array.isArray(spec.workflows) ? spec.workflows : [];
    const agentFiles = Array.isArray(spec.agents) ? spec.agents : [];

    assertFileSetParity({
      label: `${platformId} workflow list`,
      expected: sharedWorkflows,
      actual: workflowFiles,
      errors,
      contextPath: MANIFEST_PATH
    });

    assertFileSetParity({
      label: `${platformId} agent list`,
      expected: sharedAgents,
      actual: agentFiles,
      errors,
      contextPath: MANIFEST_PATH
    });

    for (const fileName of sharedWorkflows) {
      const platformWorkflow = path.join(platformRoot, platforms[platformId].workflowDir, fileName);
      if (!(await pathExists(platformWorkflow))) {
        error(errors, platformWorkflow, "generated workflow missing");
      }
    }

    for (const fileName of sharedAgents) {
      const platformAgent = path.join(platformRoot, platforms[platformId].agentDir, fileName);
      if (!(await pathExists(platformAgent))) {
        error(errors, platformAgent, "generated agent missing");
      }
    }
  }

  const antigravitySpec = manifest.platforms?.antigravity || {};
  const antCommands = Array.isArray(antigravitySpec.commands) ? antigravitySpec.commands : [];
  if (antCommands.length !== sharedWorkflows.length) {
    error(
      errors,
      MANIFEST_PATH,
      `antigravity commands count mismatch: expected ${sharedWorkflows.length}, found ${antCommands.length}`
    );
  }
  for (const commandFile of antCommands) {
    const filePath = path.join(BUNDLE_ROOT, "platforms", "antigravity", "commands", commandFile);
    if (!(await pathExists(filePath))) {
      error(errors, filePath, "antigravity command file listed in manifest is missing");
    }
  }

  const copilotSpec = manifest.platforms?.copilot || {};
  const copilotPrompts = Array.isArray(copilotSpec.prompts) ? copilotSpec.prompts : [];
  if (copilotPrompts.length !== sharedWorkflows.length) {
    error(
      errors,
      MANIFEST_PATH,
      `copilot prompts count mismatch: expected ${sharedWorkflows.length}, found ${copilotPrompts.length}`
    );
  }
  for (const promptFile of copilotPrompts) {
    const filePath = path.join(BUNDLE_ROOT, "platforms", "copilot", "prompts", promptFile);
    if (!(await pathExists(filePath))) {
      error(errors, filePath, "copilot prompt file listed in manifest is missing");
    }
  }

  if (!(await pathExists(GENERATE_PLATFORM_ASSETS_SCRIPT))) {
    error(errors, GENERATE_PLATFORM_ASSETS_SCRIPT, "platform asset generator script is missing");
    return;
  }

  try {
    await execFile(process.execPath, [GENERATE_PLATFORM_ASSETS_SCRIPT, "--check"], {
      cwd: ROOT,
      env: process.env
    });
  } catch (runError) {
    const stderr = String(runError?.stderr || "").trim();
    const stdout = String(runError?.stdout || "").trim();
    const detail = stderr || stdout || runError.message;
    error(errors, GENERATE_PLATFORM_ASSETS_SCRIPT, `generated assets drift detected (${detail})`);
  }

  note(notes, SHARED_ROOT, `shared source validated (agents=${sharedAgents.length}, workflows=${sharedWorkflows.length})`);
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
  const canonicalMap = await buildCanonicalSkillMap();
  const indexedSkillIds = await resolveIndexedTopLevelSkillIds(canonicalMap);
  const indexedSkillSet = new Set(indexedSkillIds.map((id) => String(id).toLowerCase()));
  if (indexedSkillSet.size === 0) {
    error(errors, SKILLS_INDEX_PATH, "no indexed top-level skills resolved");
  }

  const duplicateSkillNames = await findDuplicateSkillNamesInIndex();
  for (const duplicate of duplicateSkillNames) {
    error(errors, SKILLS_INDEX_PATH, `duplicate skill name '${duplicate.name}' found ${duplicate.count} times`);
  }
  const duplicateSkillIds = await findDuplicateSkillIdsInIndex();
  for (const duplicate of duplicateSkillIds) {
    error(errors, SKILLS_INDEX_PATH, `duplicate skill id '${duplicate.id}' found ${duplicate.count} times`);
  }

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
        skillSet: indexedSkillSet,
        errors,
        notes
      });
    }

    if (Array.isArray(spec.commands)) {
      if (!platformCfg.commandsDir) {
        error(errors, MANIFEST_PATH, `platform '${platformId}' defines commands but has no commandsDir mapping`);
      }
      for (const rel of spec.commands) {
        const filePath = path.join(platformRoot, platformCfg.commandsDir || "commands", rel);
        if (!(await pathExists(filePath))) {
          error(errors, filePath, "command file listed in manifest is missing");
        }
      }
    }

    if (Array.isArray(spec.prompts)) {
      if (!platformCfg.promptsDir) {
        error(errors, MANIFEST_PATH, `platform '${platformId}' defines prompts but has no promptsDir mapping`);
      }
      for (const rel of spec.prompts) {
        const filePath = path.join(platformRoot, platformCfg.promptsDir || "prompts", rel);
        if (!(await pathExists(filePath))) {
          error(errors, filePath, "prompt file listed in manifest is missing");
        }
      }
    }

    for (const skillId of skills) {
      const canonicalSkill = canonicalMap.get(String(skillId).toLowerCase());
      if (!canonicalSkill) {
        error(errors, MANIFEST_PATH, `skill '${skillId}' listed in manifest for ${platformId} is missing`);
        continue;
      }
      const skillDir = path.join(canonicalSkill.root, canonicalSkill.id);
      const skillFile = path.join(skillDir, "SKILL.md");
      if (!(await pathExists(skillFile))) {
        error(errors, skillFile, `SKILL.md missing for skill '${skillId}'`);
        continue;
      }

      await validateSkillFile({
        filePath: skillFile,
        platform: platformId,
        errors,
        notes,
        canonicalMap
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

  await validateSharedSourceAndGeneratedParity({ manifest, errors, notes });
  await validateCanonicalSkillsStructure({ errors, canonicalMap });

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
    for (const item of notes.slice(0, 30)) {
      console.log(`- ${item}`);
    }
    if (notes.length > 30) {
      console.log(`- ...and ${notes.length - 30} more`);
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
