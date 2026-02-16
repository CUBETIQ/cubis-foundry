#!/usr/bin/env node

import { confirm, select } from "@inquirer/prompts";
import { Command } from "commander";
import { existsSync } from "node:fs";
import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { version: CLI_VERSION } = require("../package.json");

const MANAGED_BLOCK_START_RE = /<!--\s*cbx:workflows:auto:start[^>]*-->/g;
const MANAGED_BLOCK_END_RE = /<!--\s*cbx:workflows:auto:end\s*-->/g;
const AGENT_ASSETS_SUBDIR = "Ai Agent Workflow";
const COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS = new Set([
  "compatibility",
  "description",
  "license",
  "metadata",
  "name"
]);
const COPILOT_ALLOWED_AGENT_FRONTMATTER_KEYS = new Set([
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

const WORKFLOW_PROFILES = {
  antigravity: {
    id: "antigravity",
    label: "Antigravity",
    project: {
      workflowDirs: [".agent/workflows"],
      agentDirs: [".agent/agents"],
      skillDirs: [".agent/skills"],
      ruleFilesByPriority: [".agent/rules/GEMINI.md"]
    },
    global: {
      workflowDirs: ["~/.gemini/antigravity/workflows"],
      agentDirs: ["~/.gemini/antigravity/agents"],
      skillDirs: ["~/.gemini/antigravity/skills"],
      ruleFilesByPriority: ["~/.gemini/GEMINI.md"]
    },
    detectorPaths: [".agent", ".agent/workflows", ".agent/rules/GEMINI.md"],
    legacyDetectorPaths: [],
    ruleHintName: "GEMINI.md"
  },
  codex: {
    id: "codex",
    label: "Codex",
    project: {
      workflowDirs: [".agents/workflows"],
      agentDirs: [".agents/agents"],
      skillDirs: [".agents/skills"],
      ruleFilesByPriority: ["AGENTS.md"]
    },
    global: {
      workflowDirs: ["~/.agents/workflows"],
      agentDirs: ["~/.agents/agents"],
      skillDirs: ["~/.agents/skills"],
      ruleFilesByPriority: ["~/.codex/AGENTS.md"]
    },
    detectorPaths: [".agents", ".agents/workflows", ".agents/skills", "AGENTS.md"],
    legacyDetectorPaths: [".codex/skills"],
    ruleHintName: "AGENTS.md"
  },
  copilot: {
    id: "copilot",
    label: "GitHub Copilot",
    project: {
      workflowDirs: [".github/copilot/workflows"],
      agentDirs: [".github/agents"],
      skillDirs: [".github/skills"],
      ruleFilesByPriority: ["AGENTS.md", ".github/copilot-instructions.md"]
    },
    global: {
      workflowDirs: ["~/.copilot/workflows"],
      agentDirs: ["~/.copilot/agents"],
      skillDirs: ["~/.copilot/skills"],
      ruleFilesByPriority: ["~/.copilot/copilot-instructions.md"]
    },
    detectorPaths: [
      ".github/agents",
      ".github/skills",
      ".github/copilot-instructions.md",
      ".github/instructions",
      "AGENTS.md"
    ],
    legacyDetectorPaths: [],
    ruleHintName: "AGENTS.md or .github/copilot-instructions.md"
  }
};

const PLATFORM_IDS = Object.keys(WORKFLOW_PROFILES);

const PLATFORM_ALIASES = {
  antigravity: "antigravity",
  "google-antigravity": "antigravity",
  "google-antigravity-cli": "antigravity",
  "google-antigravity-ide": "antigravity",
  codex: "codex",
  openai: "codex",
  copilot: "copilot",
  "github-copilot": "copilot",
  "copilot-chat": "copilot",
  "copilot-cli": "copilot",
  github: "copilot"
};

function packageRoot() {
  const filename = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(filename), "..");
}

function agentAssetsRoot() {
  const preferred = path.join(packageRoot(), AGENT_ASSETS_SUBDIR);
  return existsSync(preferred) ? preferred : packageRoot();
}

function expandPath(inputPath, cwd = process.cwd()) {
  if (!inputPath) return cwd;
  if (inputPath === "~") return os.homedir();
  if (inputPath.startsWith("~/")) return path.join(os.homedir(), inputPath.slice(2));
  if (path.isAbsolute(inputPath)) return inputPath;
  return path.resolve(cwd, inputPath);
}

function normalizePlatform(value) {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return PLATFORM_ALIASES[normalized] || normalized;
}

function normalizeScope(value) {
  if (!value) return "project";
  const normalized = value.trim().toLowerCase();
  if (normalized === "project" || normalized === "global") return normalized;
  throw new Error(`Unknown scope '${value}'. Use --scope project or --scope global.`);
}

function defaultState() {
  return {
    schemaVersion: 1,
    lastSelected: {
      platform: null,
      scope: "project"
    },
    targets: {}
  };
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function targetStateKey(platform, scope) {
  return `${platform}:${scope}`;
}

function getStateFilePath(scope, cwd = process.cwd()) {
  if (scope === "global") return path.join(os.homedir(), ".cbx", "state.json");
  return path.join(cwd, ".cbx", "workflows-state.json");
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readState(scope, cwd = process.cwd()) {
  const statePath = getStateFilePath(scope, cwd);
  if (!(await pathExists(statePath))) return defaultState();

  try {
    const raw = await readFile(statePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultState();

    return {
      schemaVersion: 1,
      lastSelected: {
        platform:
          parsed.lastSelected && typeof parsed.lastSelected.platform === "string"
            ? parsed.lastSelected.platform
            : null,
        scope:
          parsed.lastSelected && parsed.lastSelected.scope === "global" ? "global" : "project"
      },
      targets: parsed.targets && typeof parsed.targets === "object" ? parsed.targets : {}
    };
  } catch {
    return defaultState();
  }
}

async function writeState(scope, state, cwd = process.cwd()) {
  const statePath = getStateFilePath(scope, cwd);
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function setLastSelectedState(scope, platform, cwd = process.cwd()) {
  const state = await readState(scope, cwd);
  state.lastSelected = { platform, scope };
  await writeState(scope, state, cwd);
}

async function recordBundleInstallState({ scope, platform, bundleId, artifacts, ruleFilePath, cwd }) {
  const state = await readState(scope, cwd);
  const key = targetStateKey(platform, scope);
  if (!state.targets[key]) {
    state.targets[key] = {
      updatedAt: null,
      ruleFile: null,
      bundles: {}
    };
  }

  state.lastSelected = { platform, scope };
  state.targets[key].updatedAt = new Date().toISOString();
  state.targets[key].ruleFile = ruleFilePath ? toPosixPath(ruleFilePath) : null;
  state.targets[key].bundles[bundleId] = {
    installedAt: new Date().toISOString(),
    workflows: artifacts.workflows.map(toPosixPath),
    agents: artifacts.agents.map(toPosixPath),
    skills: artifacts.skills.map(toPosixPath)
  };

  await writeState(scope, state, cwd);
}

async function recordBundleRemovalState({ scope, platform, bundleId, ruleFilePath, cwd }) {
  const state = await readState(scope, cwd);
  const key = targetStateKey(platform, scope);
  if (state.targets[key] && state.targets[key].bundles[bundleId]) {
    delete state.targets[key].bundles[bundleId];
    state.targets[key].updatedAt = new Date().toISOString();
    if (ruleFilePath) state.targets[key].ruleFile = toPosixPath(ruleFilePath);
  }
  state.lastSelected = { platform, scope };
  await writeState(scope, state, cwd);
}

async function resolveProfilePaths(profileId, scope, cwd = process.cwd()) {
  const profile = WORKFLOW_PROFILES[profileId];
  if (!profile) throw new Error(`Unknown platform '${profileId}'.`);
  const cfg = profile[scope];

  return {
    workflowsDir: expandPath(cfg.workflowDirs[0], cwd),
    agentsDir: expandPath(cfg.agentDirs[0], cwd),
    skillsDir: expandPath(cfg.skillDirs[0], cwd),
    ruleFilesByPriority: cfg.ruleFilesByPriority.map((filePath) => expandPath(filePath, cwd))
  };
}

async function listBundleIds() {
  const root = path.join(agentAssetsRoot(), "workflows");
  if (!(await pathExists(root))) return [];

  const entries = await readdir(root, { withFileTypes: true });
  const bundleIds = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const manifestPath = path.join(root, entry.name, "manifest.json");
    if (await pathExists(manifestPath)) {
      bundleIds.push(entry.name);
    }
  }

  return bundleIds.sort((a, b) => a.localeCompare(b));
}

async function readBundleManifest(bundleId) {
  const manifestPath = path.join(agentAssetsRoot(), "workflows", bundleId, "manifest.json");
  if (!(await pathExists(manifestPath))) {
    throw new Error(`Bundle '${bundleId}' not found at ${manifestPath}`);
  }

  const raw = await readFile(manifestPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid manifest JSON for '${bundleId}': ${error.message}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid manifest for '${bundleId}': expected object.`);
  }

  return parsed;
}

async function chooseBundle(bundleOption) {
  const bundleIds = await listBundleIds();
  if (bundleIds.length === 0) {
    throw new Error("No workflow bundles found in local catalog.");
  }

  if (bundleOption) {
    if (!bundleIds.includes(bundleOption)) {
      throw new Error(`Unknown bundle '${bundleOption}'. Run 'cbx workflows platforms' and docs for options.`);
    }
    return bundleOption;
  }

  if (!process.stdin.isTTY) {
    if (bundleIds.includes("agent-environment-setup")) {
      return "agent-environment-setup";
    }
    return bundleIds[0];
  }

  return select({
    message: "Select workflow bundle:",
    choices: bundleIds.map((id) => ({ name: id, value: id }))
  });
}

async function detectPlatformCandidates(cwd = process.cwd()) {
  const scores = new Map(PLATFORM_IDS.map((id) => [id, 0]));

  for (const platformId of PLATFORM_IDS) {
    const profile = WORKFLOW_PROFILES[platformId];

    for (const marker of profile.detectorPaths) {
      if (await pathExists(expandPath(marker, cwd))) {
        scores.set(platformId, (scores.get(platformId) || 0) + 3);
      }
    }

    for (const legacyMarker of profile.legacyDetectorPaths || []) {
      if (await pathExists(expandPath(legacyMarker, cwd))) {
        scores.set(platformId, (scores.get(platformId) || 0) + 1);
      }
    }
  }

  const maxScore = Math.max(...scores.values());
  if (!Number.isFinite(maxScore) || maxScore <= 0) return [];

  return [...scores.entries()]
    .filter(([, score]) => score === maxScore)
    .map(([id]) => id)
    .sort((a, b) => a.localeCompare(b));
}

async function resolvePlatform(optionValue, scope, cwd = process.cwd()) {
  const normalized = normalizePlatform(optionValue);
  if (normalized) {
    if (!WORKFLOW_PROFILES[normalized]) {
      throw new Error(`Unknown platform '${optionValue}'. Use 'cbx workflows platforms'.`);
    }
    return normalized;
  }

  const candidates = await detectPlatformCandidates(cwd);
  if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidates.length > 1) {
    const state = await readState(scope, cwd);
    if (state.lastSelected.platform && candidates.includes(state.lastSelected.platform)) {
      return state.lastSelected.platform;
    }

    if (!process.stdin.isTTY) {
      throw new Error(`Multiple platforms detected (${candidates.join(", ")}). Use --platform.`);
    }

    return select({
      message: "Multiple platforms detected. Select active platform:",
      choices: candidates.map((id) => ({
        name: `${WORKFLOW_PROFILES[id].label} (${id})`,
        value: id
      }))
    });
  }

  const state = await readState(scope, cwd);
  if (state.lastSelected.platform && WORKFLOW_PROFILES[state.lastSelected.platform]) {
    return state.lastSelected.platform;
  }

  if (!process.stdin.isTTY) {
    throw new Error("Missing --platform in non-interactive mode.");
  }

  return select({
    message: "Select platform:",
    choices: PLATFORM_IDS.map((id) => ({
      name: `${WORKFLOW_PROFILES[id].label} (${id})`,
      value: id
    }))
  });
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseInlineArray(raw) {
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((item) => stripQuotes(item.replace(/\[|\]/g, "").trim()))
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function extractFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: "", body: markdown };
  }
  return {
    frontmatter: match[1],
    body: markdown.slice(match[0].length)
  };
}

function hasFrontmatter(markdown) {
  return /^---\n[\s\S]*?\n---\n?/.test(markdown);
}

function collectTopLevelFrontmatterKeys(frontmatter) {
  const keys = [];
  for (const line of frontmatter.split(/\r?\n/)) {
    if (!line || /^\s/.test(line)) continue;
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (!match) continue;
    keys.push(match[1]);
  }
  return unique(keys);
}

function unsupportedCopilotSkillFrontmatterKeys(frontmatter) {
  const keys = collectTopLevelFrontmatterKeys(frontmatter);
  return keys.filter((key) => !COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS.has(key));
}

function unsupportedCopilotAgentFrontmatterKeys(frontmatter) {
  const keys = collectTopLevelFrontmatterKeys(frontmatter);
  return keys.filter((key) => !COPILOT_ALLOWED_AGENT_FRONTMATTER_KEYS.has(key));
}

function sanitizeSkillMarkdownForCopilot(markdown) {
  if (!hasFrontmatter(markdown)) {
    return { changed: false, content: markdown, removedKeys: [] };
  }

  const { frontmatter, body } = extractFrontmatter(markdown);
  const lines = frontmatter.split(/\r?\n/);
  const kept = [];
  const removedKeys = [];
  let skipUnsupportedKey = null;

  for (const line of lines) {
    if (skipUnsupportedKey) {
      const isTopLevelKey = /^([A-Za-z0-9_-]+)\s*:/.test(line) && !/^\s/.test(line);
      if (!isTopLevelKey) {
        continue;
      }
      skipUnsupportedKey = null;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (!keyMatch || /^\s/.test(line)) {
      kept.push(line);
      continue;
    }

    const key = keyMatch[1];
    if (COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS.has(key)) {
      kept.push(line);
      continue;
    }

    removedKeys.push(key);
    const inlineArray = /\[[\s\S]*\]\s*$/.test(line);
    if (!inlineArray) {
      skipUnsupportedKey = key;
    }
  }

  const cleanedFrontmatter = kept.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
  const bodyWithoutLeadingNewlines = body.replace(/^\n+/, "");
  const rebuilt = `---\n${cleanedFrontmatter}\n---\n${bodyWithoutLeadingNewlines}`;
  const dedupedRemovedKeys = unique(removedKeys);

  if (dedupedRemovedKeys.length === 0) {
    return { changed: false, content: markdown, removedKeys: [] };
  }

  return {
    changed: rebuilt !== markdown,
    content: rebuilt,
    removedKeys: dedupedRemovedKeys
  };
}

function sanitizeAgentMarkdownForCopilot(markdown) {
  if (!hasFrontmatter(markdown)) {
    return { changed: false, content: markdown, removedKeys: [] };
  }

  const { frontmatter, body } = extractFrontmatter(markdown);
  const lines = frontmatter.split(/\r?\n/);
  const kept = [];
  const removedKeys = [];
  let skipUnsupportedKey = null;

  for (const line of lines) {
    if (skipUnsupportedKey) {
      const isTopLevelKey = /^([A-Za-z0-9_-]+)\s*:/.test(line) && !/^\s/.test(line);
      if (!isTopLevelKey) {
        continue;
      }
      skipUnsupportedKey = null;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (!keyMatch || /^\s/.test(line)) {
      kept.push(line);
      continue;
    }

    const key = keyMatch[1];
    if (COPILOT_ALLOWED_AGENT_FRONTMATTER_KEYS.has(key)) {
      kept.push(line);
      continue;
    }

    removedKeys.push(key);
    const inlineArray = /\[[\s\S]*\]\s*$/.test(line);
    if (!inlineArray) {
      skipUnsupportedKey = key;
    }
  }

  const cleanedFrontmatter = kept.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
  const bodyWithoutLeadingNewlines = body.replace(/^\n+/, "");
  const rebuilt = `---\n${cleanedFrontmatter}\n---\n${bodyWithoutLeadingNewlines}`;
  const dedupedRemovedKeys = unique(removedKeys);

  if (dedupedRemovedKeys.length === 0) {
    return { changed: false, content: markdown, removedKeys: [] };
  }

  return {
    changed: rebuilt !== markdown,
    content: rebuilt,
    removedKeys: dedupedRemovedKeys
  };
}

function extractFrontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"));
  if (!match) return null;
  return stripQuotes(match[1]);
}

function extractFrontmatterArray(frontmatter, key) {
  const bracketMatch = frontmatter.match(new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, "m"));
  if (bracketMatch) {
    return unique(parseInlineArray(bracketMatch[1]));
  }

  const singleLine = frontmatter.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"));
  if (!singleLine) return [];
  return unique(parseInlineArray(singleLine[1]));
}

function extractHeading(body) {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractFallbackDescription(body) {
  const lines = body.split(/\r?\n/).map((line) => line.trim());
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("#")) continue;
    if (line.startsWith("---")) continue;
    if (line.startsWith("```")) continue;
    return line;
  }
  return "No description available.";
}

async function parseWorkflowMetadata(filePath) {
  const raw = await readFile(filePath, "utf8");
  const { frontmatter, body } = extractFrontmatter(raw);
  const id = path.basename(filePath, path.extname(filePath));
  const command = extractFrontmatterValue(frontmatter, "command") || `/${id}`;
  const description =
    extractFrontmatterValue(frontmatter, "description") || extractFallbackDescription(body);
  const heading = extractHeading(body) || id;
  const triggers = unique([
    ...extractFrontmatterArray(frontmatter, "triggers"),
    ...extractFrontmatterArray(frontmatter, "keywords")
  ]).slice(0, 8);

  return {
    id,
    command,
    name: heading,
    description,
    triggers,
    path: filePath
  };
}

async function collectInstalledWorkflows(profileId, scope, cwd = process.cwd()) {
  const profilePaths = await resolveProfilePaths(profileId, scope, cwd);
  if (!(await pathExists(profilePaths.workflowsDir))) return [];

  const entries = await readdir(profilePaths.workflowsDir, { withFileTypes: true });
  const workflows = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name.startsWith(".")) continue;
    const filePath = path.join(profilePaths.workflowsDir, entry.name);
    workflows.push(await parseWorkflowMetadata(filePath));
  }

  return workflows.sort((a, b) => a.command.localeCompare(b.command));
}

function buildManagedWorkflowBlock(platformId, workflows) {
  const lines = [];
  lines.push(`<!-- cbx:workflows:auto:start platform=${platformId} version=1 -->`);
  lines.push("## CBX Workflow Routing (auto-managed)");
  lines.push("Use the following workflows proactively when task intent matches:");
  lines.push("");

  if (workflows.length === 0) {
    lines.push("- No installed workflows found yet.");
  } else {
    for (const workflow of workflows) {
      lines.push(`- \`${workflow.command}\`: ${workflow.description}`);
      if (workflow.triggers.length > 0) {
        lines.push(`  Triggers: ${workflow.triggers.join(", ")}`);
      } else {
        lines.push("  Triggers: (derived from workflow description)");
      }
      lines.push("");
    }
    if (lines[lines.length - 1] === "") lines.pop();
  }

  lines.push("");
  lines.push("Selection policy:");
  lines.push("1. Match explicit slash command first.");
  lines.push("2. Else match user intent to workflow description and triggers.");
  lines.push("3. Prefer one primary workflow; reference others only when needed.");
  lines.push("");
  lines.push("<!-- cbx:workflows:auto:end -->");

  return lines.join("\n");
}

function analyzeManagedBlock(content) {
  const starts = [...content.matchAll(MANAGED_BLOCK_START_RE)];
  const ends = [...content.matchAll(MANAGED_BLOCK_END_RE)];

  if (starts.length === 0 && ends.length === 0) {
    return { status: "absent", starts: 0, ends: 0, range: null };
  }

  let range = null;
  for (const startMatch of starts) {
    const endMatch = ends.find((candidate) => candidate.index > startMatch.index);
    if (endMatch) {
      range = {
        start: startMatch.index,
        end: endMatch.index + endMatch[0].length
      };
      break;
    }
  }

  if (!range) {
    return { status: "malformed", starts: starts.length, ends: ends.length, range: null };
  }

  if (starts.length === 1 && ends.length === 1) {
    return { status: "valid", starts: 1, ends: 1, range };
  }

  return { status: "multiple", starts: starts.length, ends: ends.length, range };
}

async function resolveRuleFilePath(profileId, scope, cwd = process.cwd()) {
  const profilePaths = await resolveProfilePaths(profileId, scope, cwd);

  for (const ruleFilePath of profilePaths.ruleFilesByPriority) {
    if (await pathExists(ruleFilePath)) return ruleFilePath;
  }

  return profilePaths.ruleFilesByPriority[0] || null;
}

async function upsertManagedRuleBlock(ruleFilePath, platformId, workflows, dryRun = false) {
  const block = buildManagedWorkflowBlock(platformId, workflows);
  const exists = await pathExists(ruleFilePath);
  const warnings = [];
  const original = exists ? await readFile(ruleFilePath, "utf8") : "";
  const analysis = analyzeManagedBlock(original);

  let nextContent = original;
  if (!exists || analysis.status === "absent") {
    const trimmed = original.trimEnd();
    nextContent = trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  } else if (analysis.range) {
    if (analysis.status === "multiple") {
      warnings.push("Multiple managed workflow blocks found; patched the first valid block.");
    }
    nextContent = `${original.slice(0, analysis.range.start)}${block}${original.slice(analysis.range.end)}`;
  } else {
    warnings.push("Malformed managed workflow block; appended a new canonical block.");
    const trimmed = original.trimEnd();
    nextContent = trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  }

  if (nextContent === original) {
    return {
      action: "unchanged",
      filePath: ruleFilePath,
      warnings
    };
  }

  if (!dryRun) {
    await mkdir(path.dirname(ruleFilePath), { recursive: true });
    await writeFile(ruleFilePath, nextContent, "utf8");
  }

  return {
    action: exists ? (dryRun ? "would-patch" : "patched") : dryRun ? "would-create" : "created",
    filePath: ruleFilePath,
    warnings
  };
}

async function syncRulesForPlatform({ platform, scope, cwd = process.cwd(), dryRun = false }) {
  const ruleFilePath = await resolveRuleFilePath(platform, scope, cwd);
  if (!ruleFilePath) throw new Error(`No rule file configured for platform '${platform}'.`);

  const workflows = await collectInstalledWorkflows(platform, scope, cwd);
  const patchResult = await upsertManagedRuleBlock(ruleFilePath, platform, workflows, dryRun);

  if (!dryRun) {
    await setLastSelectedState(scope, platform, cwd);
  }

  return {
    platform,
    scope,
    dryRun,
    filePath: ruleFilePath,
    action: patchResult.action,
    warnings: patchResult.warnings,
    workflowsCount: workflows.length
  };
}

async function safeRemove(targetPath, dryRun = false) {
  if (await pathExists(targetPath)) {
    if (!dryRun) {
      await rm(targetPath, { recursive: true, force: true });
    }
    return true;
  }
  return false;
}

async function copyArtifact({ source, destination, overwrite, dryRun = false }) {
  const exists = await pathExists(destination);
  if (exists && !overwrite) {
    return { action: dryRun ? "would-skip" : "skipped", path: destination };
  }

  if (!dryRun && exists && overwrite) {
    await rm(destination, { recursive: true, force: true });
  }

  if (!dryRun) {
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: true, force: true });
  }

  if (dryRun) {
    return { action: exists ? "would-replace" : "would-install", path: destination };
  }
  return { action: exists ? "replaced" : "installed", path: destination };
}

async function sanitizeInstalledSkillsForPlatform({
  platform,
  skillDirs,
  dryRun = false
}) {
  if (dryRun || platform !== "copilot") return [];

  const sanitized = [];

  for (const skillDir of skillDirs) {
    const skillFile = path.join(skillDir, "SKILL.md");
    if (!(await pathExists(skillFile))) continue;

    const raw = await readFile(skillFile, "utf8");
    const { changed, content, removedKeys } = sanitizeSkillMarkdownForCopilot(raw);
    if (!changed) continue;

    await writeFile(skillFile, content, "utf8");
    sanitized.push({
      skillId: path.basename(skillDir),
      removedKeys
    });
  }

  return sanitized;
}

async function sanitizeInstalledAgentsForPlatform({
  platform,
  agentFiles,
  dryRun = false
}) {
  if (dryRun || platform !== "copilot") return [];

  const sanitized = [];

  for (const agentFile of agentFiles) {
    if (!(await pathExists(agentFile))) continue;
    const raw = await readFile(agentFile, "utf8");
    const { changed, content, removedKeys } = sanitizeAgentMarkdownForCopilot(raw);
    if (!changed) continue;

    await writeFile(agentFile, content, "utf8");
    const agentId = path.basename(agentFile).replace(/\.agent\.md$/i, "").replace(/\.md$/i, "");
    sanitized.push({
      agentId,
      removedKeys
    });
  }

  return sanitized;
}

async function validateCopilotSkillsSchema(skillsDir) {
  if (!(await pathExists(skillsDir))) return [];

  const entries = await readdir(skillsDir, { withFileTypes: true });
  const findings = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(skillsDir, entry.name, "SKILL.md");
    if (!(await pathExists(skillFile))) continue;

    const raw = await readFile(skillFile, "utf8");
    if (!hasFrontmatter(raw)) continue;
    const { frontmatter } = extractFrontmatter(raw);
    const unsupportedKeys = unsupportedCopilotSkillFrontmatterKeys(frontmatter);
    if (unsupportedKeys.length === 0) continue;

    findings.push({
      skillId: entry.name,
      unsupportedKeys
    });
  }

  return findings;
}

async function validateCopilotAgentsSchema(agentsDir) {
  if (!(await pathExists(agentsDir))) return [];

  const entries = await readdir(agentsDir, { withFileTypes: true });
  const findings = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".md")) continue;
    const agentFile = path.join(agentsDir, entry.name);
    if (!(await pathExists(agentFile))) continue;

    const raw = await readFile(agentFile, "utf8");
    if (!hasFrontmatter(raw)) continue;
    const { frontmatter } = extractFrontmatter(raw);
    const unsupportedKeys = unsupportedCopilotAgentFrontmatterKeys(frontmatter);
    if (unsupportedKeys.length === 0) continue;

    findings.push({
      agentId: entry.name.replace(/\.agent\.md$/i, "").replace(/\.md$/i, ""),
      unsupportedKeys
    });
  }

  return findings;
}

async function installBundleArtifacts({
  bundleId,
  manifest,
  platform,
  scope,
  overwrite,
  dryRun = false,
  cwd = process.cwd()
}) {
  const profilePaths = await resolveProfilePaths(platform, scope, cwd);
  const platformSpec = manifest.platforms?.[platform];

  if (!platformSpec) {
    throw new Error(`Bundle '${bundleId}' does not define platform '${platform}'.`);
  }

  if (!dryRun) {
    await mkdir(profilePaths.workflowsDir, { recursive: true });
    await mkdir(profilePaths.agentsDir, { recursive: true });
    await mkdir(profilePaths.skillsDir, { recursive: true });
  }

  const bundleRoot = path.join(agentAssetsRoot(), "workflows", bundleId);
  const platformRoot = path.join(bundleRoot, "platforms", platform);

  const installed = [];
  const skipped = [];
  const artifacts = { workflows: [], agents: [], skills: [] };

  const workflowFiles = Array.isArray(platformSpec.workflows) ? platformSpec.workflows : [];
  for (const workflowFile of workflowFiles) {
    const source = path.join(platformRoot, "workflows", workflowFile);
    const destination = path.join(profilePaths.workflowsDir, path.basename(workflowFile));

    if (!(await pathExists(source))) {
      throw new Error(`Missing workflow source file: ${source}`);
    }

    const result = await copyArtifact({ source, destination, overwrite, dryRun });
    artifacts.workflows.push(destination);
    if (result.action === "skipped" || result.action === "would-skip") skipped.push(destination);
    else installed.push(destination);
  }

  const agentFiles = Array.isArray(platformSpec.agents) ? platformSpec.agents : [];
  for (const agentFile of agentFiles) {
    const source = path.join(platformRoot, "agents", agentFile);
    const destination = path.join(profilePaths.agentsDir, path.basename(agentFile));

    if (!(await pathExists(source))) {
      throw new Error(`Missing agent source file: ${source}`);
    }

    const result = await copyArtifact({ source, destination, overwrite, dryRun });
    artifacts.agents.push(destination);
    if (result.action === "skipped" || result.action === "would-skip") skipped.push(destination);
    else installed.push(destination);
  }

  const skillIds = Array.isArray(platformSpec.skills) ? platformSpec.skills : [];
  for (const skillId of skillIds) {
    const source = path.join(agentAssetsRoot(), "skills", skillId);
    const destination = path.join(profilePaths.skillsDir, skillId);

    if (!(await pathExists(source))) {
      throw new Error(`Missing skill source directory: ${source}`);
    }

    const result = await copyArtifact({ source, destination, overwrite, dryRun });
    artifacts.skills.push(destination);
    if (result.action === "skipped" || result.action === "would-skip") skipped.push(destination);
    else installed.push(destination);
  }

  const sanitizedSkills = await sanitizeInstalledSkillsForPlatform({
    platform,
    skillDirs: artifacts.skills,
    dryRun
  });
  const sanitizedAgents = await sanitizeInstalledAgentsForPlatform({
    platform,
    agentFiles: artifacts.agents,
    dryRun
  });

  return {
    profilePaths,
    installed,
    skipped,
    artifacts,
    sanitizedSkills,
    sanitizedAgents
  };
}

async function seedRuleFileFromTemplateIfMissing({
  bundleId,
  manifest,
  platform,
  scope,
  dryRun = false,
  cwd = process.cwd()
}) {
  const platformSpec = manifest.platforms?.[platform];
  if (!platformSpec || !platformSpec.rulesTemplate) return { ruleFilePath: null, action: "none" };

  const profilePaths = await resolveProfilePaths(platform, scope, cwd);
  const ruleFilePath = profilePaths.ruleFilesByPriority[0];
  if (!ruleFilePath) return { ruleFilePath: null, action: "none" };
  if (await pathExists(ruleFilePath)) return { ruleFilePath, action: "exists" };

  const templatePath = path.join(agentAssetsRoot(), "workflows", bundleId, platformSpec.rulesTemplate);
  if (!(await pathExists(templatePath))) return { ruleFilePath, action: "missing-template" };

  if (!dryRun) {
    await mkdir(path.dirname(ruleFilePath), { recursive: true });
    await cp(templatePath, ruleFilePath, { recursive: false, force: true });
    return { ruleFilePath, action: "created" };
  }

  return { ruleFilePath, action: "would-create" };
}

function commandToFilename(command) {
  if (!command) return null;
  const normalized = command.trim().replace(/^\//, "").replace(/\s+/g, "-").toLowerCase();
  if (!normalized) return null;
  return `${normalized}.md`;
}

async function findWorkflowFileByTarget(workflowsDir, target) {
  const direct = target.endsWith(".md") ? target : `${target}.md`;
  const directPath = path.join(workflowsDir, direct);
  if (await pathExists(directPath)) return directPath;

  const commandFile = commandToFilename(target);
  if (commandFile) {
    const commandPath = path.join(workflowsDir, commandFile);
    if (await pathExists(commandPath)) return commandPath;
  }

  if (!(await pathExists(workflowsDir))) return null;
  const entries = await readdir(workflowsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const fullPath = path.join(workflowsDir, entry.name);
    const metadata = await parseWorkflowMetadata(fullPath);
    if (metadata.command === target || metadata.id === target || metadata.name === target) {
      return fullPath;
    }
  }

  return null;
}

async function removeBundleArtifacts({
  bundleId,
  manifest,
  platform,
  scope,
  dryRun = false,
  cwd = process.cwd()
}) {
  const profilePaths = await resolveProfilePaths(platform, scope, cwd);
  const platformSpec = manifest.platforms?.[platform];
  if (!platformSpec) throw new Error(`Bundle '${bundleId}' does not define platform '${platform}'.`);

  const removed = [];

  for (const workflowFile of platformSpec.workflows || []) {
    const destination = path.join(profilePaths.workflowsDir, path.basename(workflowFile));
    if (await safeRemove(destination, dryRun)) removed.push(destination);
  }

  for (const agentFile of platformSpec.agents || []) {
    const destination = path.join(profilePaths.agentsDir, path.basename(agentFile));
    if (await safeRemove(destination, dryRun)) removed.push(destination);
  }

  for (const skillId of platformSpec.skills || []) {
    const destination = path.join(profilePaths.skillsDir, skillId);
    if (await safeRemove(destination, dryRun)) removed.push(destination);
  }

  return { removed, profilePaths };
}

function printPlatforms() {
  console.log("Workflow platforms:");
  for (const profileId of PLATFORM_IDS) {
    const profile = WORKFLOW_PROFILES[profileId];
    console.log(`- ${profile.id} (${profile.label})`);
    console.log(`  project workflows: ${profile.project.workflowDirs[0]}`);
    console.log(`  project agents:    ${profile.project.agentDirs[0]}`);
    console.log(`  project skills:    ${profile.project.skillDirs[0]}`);
    console.log(`  project rules:     ${profile.project.ruleFilesByPriority.join(" | ")}`);
    console.log(`  global workflows:  ${profile.global.workflowDirs[0]}`);
    console.log(`  global agents:     ${profile.global.agentDirs[0]}`);
    console.log(`  global skills:     ${profile.global.skillDirs[0]}`);
    console.log(`  global rules:      ${profile.global.ruleFilesByPriority.join(" | ")}`);
  }
}

function printRuleSyncResult(result) {
  console.log("\nRule sync:");
  if (result.dryRun) {
    console.log("- Mode: dry-run (no files changed)");
  }
  console.log(`- Platform: ${result.platform}`);
  console.log(`- Scope: ${result.scope}`);
  console.log(`- File: ${result.filePath}`);
  console.log(`- Action: ${result.action}`);
  console.log(`- Workflows indexed: ${result.workflowsCount}`);

  if (result.warnings.length > 0) {
    console.log("- Warnings:");
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
  }
}

function printInstallSummary({
  platform,
  scope,
  bundleId,
  installed,
  skipped,
  sanitizedSkills = [],
  sanitizedAgents = [],
  dryRun = false
}) {
  console.log(`\nPlatform: ${platform}`);
  console.log(`Scope: ${scope}`);
  console.log(`Bundle: ${bundleId}`);
  if (dryRun) {
    console.log("Mode: dry-run (no files changed)");
  }

  if (installed.length > 0) {
    console.log(`\n${dryRun ? "Would install/replace" : "Installed"} (${installed.length}):`);
    for (const item of installed) console.log(`- ${item}`);
  }

  if (skipped.length > 0) {
    console.log(`\n${dryRun ? "Would skip existing" : "Skipped existing"} (${skipped.length}):`);
    for (const item of skipped) console.log(`- ${item}`);
    console.log(`\nTip: rerun with --overwrite to ${dryRun ? "preview replacements" : "replace skipped files"}.`);
  }

  if (installed.length === 0 && skipped.length === 0) {
    console.log("\nNo changes made.");
  }

  if (!dryRun && sanitizedSkills.length > 0) {
    console.log(`\nCopilot skill schema normalization (${sanitizedSkills.length}):`);
    for (const item of sanitizedSkills.slice(0, 8)) {
      const keys = item.removedKeys.join(", ");
      console.log(`- ${item.skillId}: removed unsupported top-level keys (${keys})`);
    }
    if (sanitizedSkills.length > 8) {
      console.log(`- ...and ${sanitizedSkills.length - 8} more skill(s).`);
    }
  }

  if (!dryRun && sanitizedAgents.length > 0) {
    console.log(`\nCopilot agent schema normalization (${sanitizedAgents.length}):`);
    for (const item of sanitizedAgents.slice(0, 8)) {
      const keys = item.removedKeys.join(", ");
      console.log(`- ${item.agentId}: removed unsupported top-level keys (${keys})`);
    }
    if (sanitizedAgents.length > 8) {
      console.log(`- ...and ${sanitizedAgents.length - 8} more agent file(s).`);
    }
  }
}

function printRemoveSummary({ platform, scope, target, removed, dryRun = false }) {
  console.log(`\nPlatform: ${platform}`);
  console.log(`Scope: ${scope}`);
  console.log(`Target: ${target}`);
  if (dryRun) {
    console.log("Mode: dry-run (no files changed)");
  }

  if (removed.length > 0) {
    console.log(`\n${dryRun ? "Would remove" : "Removed"} (${removed.length}):`);
    for (const item of removed) console.log(`- ${item}`);
  } else {
    console.log(`\nNo files were ${dryRun ? "selected for removal" : "removed"}.`);
  }
}

async function createDoctorReport({ platform, scope, cwd = process.cwd() }) {
  const profile = WORKFLOW_PROFILES[platform];
  const profilePaths = await resolveProfilePaths(platform, scope, cwd);

  const pathStatus = {
    workflows: {
      path: profilePaths.workflowsDir,
      exists: await pathExists(profilePaths.workflowsDir)
    },
    agents: {
      path: profilePaths.agentsDir,
      exists: await pathExists(profilePaths.agentsDir)
    },
    skills: {
      path: profilePaths.skillsDir,
      exists: await pathExists(profilePaths.skillsDir)
    }
  };

  let activeRuleFile = null;
  for (const candidate of profilePaths.ruleFilesByPriority) {
    if (await pathExists(candidate)) {
      activeRuleFile = candidate;
      break;
    }
  }

  const preferredRuleFile = profilePaths.ruleFilesByPriority[0];
  const ruleFileToCheck = activeRuleFile || preferredRuleFile;

  let managedBlockStatus = "absent";
  let managedBlockCounts = { starts: 0, ends: 0 };
  if (activeRuleFile && (await pathExists(activeRuleFile))) {
    const content = await readFile(activeRuleFile, "utf8");
    const analysis = analyzeManagedBlock(content);
    managedBlockStatus = analysis.status;
    managedBlockCounts = { starts: analysis.starts, ends: analysis.ends };
  }

  const recommendations = [];
  const warnings = [];

  if (!activeRuleFile) {
    recommendations.push(
      `No instruction file found. Run 'cbx workflows sync-rules --platform ${platform} --scope ${scope}' to create ${profile.ruleHintName}.`
    );
  }

  if (activeRuleFile && managedBlockStatus === "absent") {
    recommendations.push(
      `Instruction file exists but lacks CBX managed block. Run 'cbx workflows sync-rules --platform ${platform} --scope ${scope}'.`
    );
  }

  if (managedBlockStatus === "multiple" || managedBlockStatus === "malformed") {
    recommendations.push(
      `Managed block is not clean. Run 'cbx workflows sync-rules --platform ${platform} --scope ${scope}' to normalize it.`
    );
  }

  if (!pathStatus.workflows.exists && !pathStatus.skills.exists && !pathStatus.agents.exists) {
    recommendations.push("No workflow/agent/skill directories found in this scope.");
  }

  if (platform === "codex" && scope === "project") {
    const legacyCodexSkills = path.join(cwd, ".codex", "skills");
    if (await pathExists(legacyCodexSkills)) {
      warnings.push("Legacy path ./.codex/skills detected. Recommended path is ./.agents/skills.");
      recommendations.push(
        "Migrate legacy Codex skills path: move ./.codex/skills to ./.agents/skills to align with official defaults."
      );
    }
  }

  if (platform === "antigravity" && scope === "project") {
    const gitignorePath = path.join(cwd, ".gitignore");
    if (await pathExists(gitignorePath)) {
      const gitignore = await readFile(gitignorePath, "utf8");
      const lines = gitignore.split(/\r?\n/).map((line) => line.trim());
      const hasAgentIgnore = lines.some((line) => line === ".agent" || line === ".agent/" || line === "/.agent/");
      if (hasAgentIgnore) {
        warnings.push(".agent/ is ignored in .gitignore; this can hide team workflow/rule updates.");
        recommendations.push(
          "Prefer tracking .agent/ in git. For local-only excludes, use '.git/info/exclude' instead of .gitignore."
        );
      }
    }
  }

  if (platform === "copilot" && pathStatus.skills.exists) {
    const findings = await validateCopilotSkillsSchema(profilePaths.skillsDir);
    if (findings.length > 0) {
      const preview = findings
        .slice(0, 5)
        .map((item) => `${item.skillId}(${item.unsupportedKeys.join(",")})`)
        .join("; ");
      warnings.push(
        `Unsupported top-level Copilot skill attributes detected in ${findings.length} skill(s): ${preview}${findings.length > 5 ? "; ..." : ""}`
      );
      recommendations.push(
        `Normalize Copilot skill frontmatter by reinstalling with overwrite: cbx workflows install --platform copilot --bundle agent-environment-setup --scope ${scope} --overwrite`
      );
    }
  }

  if (platform === "copilot" && pathStatus.agents.exists) {
    const findings = await validateCopilotAgentsSchema(profilePaths.agentsDir);
    if (findings.length > 0) {
      const preview = findings
        .slice(0, 5)
        .map((item) => `${item.agentId}(${item.unsupportedKeys.join(",")})`)
        .join("; ");
      warnings.push(
        `Unsupported top-level Copilot agent attributes detected in ${findings.length} agent file(s): ${preview}${findings.length > 5 ? "; ..." : ""}`
      );
      recommendations.push(
        `Normalize Copilot agent frontmatter by reinstalling with overwrite: cbx workflows install --platform copilot --bundle agent-environment-setup --scope ${scope} --overwrite`
      );
    }
  }

  return {
    platform,
    scope,
    ruleFileStatus: {
      active: activeRuleFile,
      preferred: ruleFileToCheck,
      exists: Boolean(activeRuleFile)
    },
    paths: pathStatus,
    managedBlockStatus,
    managedBlockCounts,
    warnings,
    recommendations
  };
}

function printDoctorReport(report) {
  console.log(`Platform: ${report.platform}`);
  console.log(`Scope: ${report.scope}`);

  console.log("\nRule file:");
  console.log(`- Active: ${report.ruleFileStatus.active || "(missing)"}`);
  console.log(`- Preferred: ${report.ruleFileStatus.preferred}`);

  console.log("\nPaths:");
  console.log(`- Workflows: ${report.paths.workflows.path} : ${report.paths.workflows.exists ? "exists" : "missing"}`);
  console.log(`- Agents: ${report.paths.agents.path} : ${report.paths.agents.exists ? "exists" : "missing"}`);
  console.log(`- Skills: ${report.paths.skills.path} : ${report.paths.skills.exists ? "exists" : "missing"}`);

  console.log("\nManaged block:");
  console.log(`- Status: ${report.managedBlockStatus}`);
  console.log(`- Markers: start=${report.managedBlockCounts.starts}, end=${report.managedBlockCounts.ends}`);

  if (report.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of report.warnings) console.log(`- ${warning}`);
  }

  console.log("\nRecommendations:");
  if (report.recommendations.length === 0) {
    console.log("- No issues detected.");
  } else {
    for (const recommendation of report.recommendations) console.log(`- ${recommendation}`);
  }
}

function withWorkflowBaseOptions(command) {
  return command
    .option("-p, --platform <platform>", "target platform id")
    .option("--scope <scope>", "target scope: project|global", "project");
}

function withInstallOptions(command) {
  return withWorkflowBaseOptions(command)
    .option("-b, --bundle <bundle>", "bundle id (default: agent-environment-setup)")
    .option("--overwrite", "overwrite existing files")
    .option("--dry-run", "preview install without writing files")
    .option("-y, --yes", "skip interactive confirmation");
}

function printSkillsDeprecation() {
  console.log("[deprecation] 'cbx skills ...' is now an alias. Use 'cbx workflows ...'.");
}

async function runWorkflowInstall(options) {
  try {
    const scope = normalizeScope(options.scope);
    const dryRun = Boolean(options.dryRun);
    const platform = await resolvePlatform(options.platform, scope, process.cwd());
    const bundleId = await chooseBundle(options.bundle);
    const manifest = await readBundleManifest(bundleId);

    if (!dryRun && !options.yes && process.stdin.isTTY) {
      const proceed = await confirm({
        message: `Install bundle '${bundleId}' for ${platform} (${scope})?`,
        default: true
      });
      if (!proceed) {
        console.log("Cancelled.");
        process.exit(0);
      }
    }

    const installResult = await installBundleArtifacts({
      bundleId,
      manifest,
      platform,
      scope,
      overwrite: Boolean(options.overwrite),
      dryRun,
      cwd: process.cwd()
    });

    await seedRuleFileFromTemplateIfMissing({
      bundleId,
      manifest,
      platform,
      scope,
      dryRun,
      cwd: process.cwd()
    });

    const syncResult = await syncRulesForPlatform({
      platform,
      scope,
      dryRun,
      cwd: process.cwd()
    });

    if (!dryRun) {
      await recordBundleInstallState({
        scope,
        platform,
        bundleId,
        artifacts: installResult.artifacts,
        ruleFilePath: syncResult.filePath,
        cwd: process.cwd()
      });
    }

    printInstallSummary({
      platform,
      scope,
      bundleId,
      installed: installResult.installed,
      skipped: installResult.skipped,
      sanitizedSkills: installResult.sanitizedSkills,
      sanitizedAgents: installResult.sanitizedAgents,
      dryRun
    });
    printRuleSyncResult(syncResult);
    if (dryRun) {
      console.log("\nDry-run complete. Re-run without `--dry-run` to apply changes.");
    } else {
      console.log("\nTip: run `cbx workflows doctor --platform " + platform + " --scope " + scope + "`.");
    }
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("\nCancelled.");
      process.exit(130);
    }
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runWorkflowRemove(target, options) {
  try {
    if (!target) {
      throw new Error("Missing <bundle-or-workflow>. Usage: cbx workflows remove <bundle-or-workflow>");
    }

    const scope = normalizeScope(options.scope);
    const dryRun = Boolean(options.dryRun);
    const platform = await resolvePlatform(options.platform, scope, process.cwd());
    const bundleIds = await listBundleIds();

    let removed = [];
    let removedType = "workflow";

    if (bundleIds.includes(target)) {
      removedType = "bundle";
      const manifest = await readBundleManifest(target);

      if (!dryRun && !options.yes && process.stdin.isTTY) {
        const proceed = await confirm({
          message: `Remove bundle '${target}' from ${platform} (${scope})?`,
          default: true
        });
        if (!proceed) {
          console.log("Cancelled.");
          process.exit(0);
        }
      }

      const removeResult = await removeBundleArtifacts({
        bundleId: target,
        manifest,
        platform,
        scope,
        dryRun,
        cwd: process.cwd()
      });

      removed = removeResult.removed;
    } else {
      const profilePaths = await resolveProfilePaths(platform, scope, process.cwd());
      const workflowFile = await findWorkflowFileByTarget(profilePaths.workflowsDir, target);

      if (!workflowFile) {
        throw new Error(`Could not find workflow or bundle '${target}' in platform '${platform}'.`);
      }

      if (!dryRun && !options.yes && process.stdin.isTTY) {
        const proceed = await confirm({
          message: `Remove workflow '${path.basename(workflowFile)}' from ${platform} (${scope})?`,
          default: true
        });
        if (!proceed) {
          console.log("Cancelled.");
          process.exit(0);
        }
      }

      if (await safeRemove(workflowFile, dryRun)) {
        removed.push(workflowFile);
      }
    }

    const syncResult = await syncRulesForPlatform({
      platform,
      scope,
      dryRun,
      cwd: process.cwd()
    });

    if (!dryRun && removedType === "bundle") {
      await recordBundleRemovalState({
        scope,
        platform,
        bundleId: target,
        ruleFilePath: syncResult.filePath,
        cwd: process.cwd()
      });
    }

    printRemoveSummary({
      platform,
      scope,
      target,
      removed,
      dryRun
    });
    printRuleSyncResult(syncResult);
    if (dryRun) {
      console.log("\nDry-run complete. Re-run without `--dry-run` to apply changes.");
    }
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("\nCancelled.");
      process.exit(130);
    }
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runWorkflowSyncRules(options) {
  try {
    const scope = normalizeScope(options.scope);
    const dryRun = Boolean(options.dryRun);
    const platform = await resolvePlatform(options.platform, scope, process.cwd());
    const syncResult = await syncRulesForPlatform({ platform, scope, dryRun, cwd: process.cwd() });

    if (options.json) {
      console.log(JSON.stringify(syncResult, null, 2));
      return;
    }

    printRuleSyncResult(syncResult);
    if (dryRun) {
      console.log("\nDry-run complete. Re-run without `--dry-run` to apply changes.");
    }
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("\nCancelled.");
      process.exit(130);
    }
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

async function runWorkflowDoctor(platformArg, options) {
  try {
    const scope = normalizeScope(options.scope);
    const platform = await resolvePlatform(platformArg || options.platform, scope, process.cwd());
    const report = await createDoctorReport({ platform, scope, cwd: process.cwd() });

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    printDoctorReport(report);
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("\nCancelled.");
      process.exit(130);
    }
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

const program = new Command();

program
  .name("cbx")
  .description("Cubis Foundry CLI for workflow-first AI agent environments")
  .version(CLI_VERSION);

const workflowsCommand = program
  .command("workflows")
  .description("Install and manage workflow bundles for Antigravity, Codex, and Copilot");

workflowsCommand.command("platforms").description("List workflow platform ids and defaults").action(printPlatforms);

withInstallOptions(
  workflowsCommand.command("install").description("Install a workflow bundle into the selected platform")
).action(runWorkflowInstall);

withInstallOptions(
  workflowsCommand.command("init").description("Alias for 'workflows install'")
).action(runWorkflowInstall);

withWorkflowBaseOptions(
  workflowsCommand
    .command("remove <bundle-or-workflow>")
    .description("Remove an installed bundle or workflow and sync rules")
    .option("--dry-run", "preview remove and sync without writing files")
    .option("-y, --yes", "skip interactive confirmation")
).action(runWorkflowRemove);

withWorkflowBaseOptions(
  workflowsCommand
    .command("sync-rules")
    .description("Rebuild the managed workflow routing block for the selected platform")
    .option("--dry-run", "preview managed rule sync without writing files")
    .option("--json", "output JSON")
).action(runWorkflowSyncRules);

withWorkflowBaseOptions(
  workflowsCommand
    .command("doctor [platform]")
    .description("Validate workflow paths, rule file status, and managed block health")
    .option("--json", "output JSON")
).action(runWorkflowDoctor);

workflowsCommand.action(() => {
  workflowsCommand.help();
});

const skillsCommand = program
  .command("skills")
  .description("Deprecated alias for 'workflows' (kept for one minor release)");

skillsCommand.command("platforms").description("Alias for workflows platforms").action(() => {
  printSkillsDeprecation();
  printPlatforms();
});

withInstallOptions(
  skillsCommand.command("install").description("Alias for workflows install")
).action(async (options) => {
  printSkillsDeprecation();
  await runWorkflowInstall(options);
});

withInstallOptions(skillsCommand.command("init").description("Alias for workflows install")).action(
  async (options) => {
    printSkillsDeprecation();
    await runWorkflowInstall(options);
  }
);

withWorkflowBaseOptions(
  skillsCommand
    .command("remove <bundle-or-workflow>")
    .description("Alias for workflows remove")
    .option("--dry-run", "preview remove and sync without writing files")
    .option("-y, --yes", "skip interactive confirmation")
).action(async (target, options) => {
  printSkillsDeprecation();
  await runWorkflowRemove(target, options);
});

withWorkflowBaseOptions(
  skillsCommand
    .command("sync-rules")
    .description("Alias for workflows sync-rules")
    .option("--dry-run", "preview managed rule sync without writing files")
    .option("--json", "output JSON")
).action(async (options) => {
  printSkillsDeprecation();
  await runWorkflowSyncRules(options);
});

withWorkflowBaseOptions(
  skillsCommand
    .command("doctor [platform]")
    .description("Alias for workflows doctor")
    .option("--json", "output JSON")
).action(async (platform, options) => {
  printSkillsDeprecation();
  await runWorkflowDoctor(platform, options);
});

skillsCommand.action(() => {
  printSkillsDeprecation();
  skillsCommand.help();
});

const agentsCommand = program.command("agents").description("Cubis Agent Bot commands");

agentsCommand
  .command("status")
  .description("Show Cubis Agent Bot availability")
  .action(() => {
    console.log("Cubis Agent Bot is planned but not wired yet.");
    console.log("Use `cbx workflows` to install and manage workflow bundles.");
  });

agentsCommand.action(() => {
  agentsCommand.help();
});

program
  .command("platforms")
  .description("Legacy alias for workflows platforms")
  .action(printPlatforms);

withInstallOptions(program.command("install").description("Legacy alias for workflows install")).action(
  runWorkflowInstall
);

withInstallOptions(program.command("init").description("Legacy alias for workflows install")).action(
  runWorkflowInstall
);

if (process.argv.length <= 2) {
  program.outputHelp();
  process.exit(0);
}

program.parseAsync(process.argv).catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
