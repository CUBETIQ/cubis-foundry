#!/usr/bin/env node

import path from "node:path";
import os from "node:os";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import { rewriteLegacySkillIds } from "./lib/legacy-skill-map.mjs";
import {
  buildCanonicalSkillSourceMap,
  listSkillDirs,
  pathExists,
} from "./lib/skill-inventory.mjs";
import {
  buildAnthropicAliasMap,
  readAnthropicSkillIntake,
} from "./lib/external-skill-intake.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PLATFORM_ATTRS_PATH = path.join(
  ROOT,
  "workflows",
  "skills",
  "_schema",
  "skill-platform-attributes.json",
);
const PLATFORM_NOTES_DIR = path.join(
  ROOT,
  "workflows",
  "skills",
  "_schema",
  "platform-notes",
);
const MIRRORS = {
  antigravity: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "antigravity",
    "skills",
  ),
  codex: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "codex",
    "skills",
  ),
  copilot: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "copilot",
    "skills",
  ),
  claude: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "claude",
    "skills",
  ),
  gemini: path.join(
    ROOT,
    "workflows",
    "workflows",
    "agent-environment-setup",
    "platforms",
    "gemini",
    "skills",
  ),
};

const COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS = new Set([
  "argument-hint",
  "compatibility",
  "description",
  "disable-model-invocation",
  "license",
  "metadata",
  "name",
  "user-invocable",
]);

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  const onlyArg = argv.find((item, idx) => argv[idx - 1] === "--only") || "all";
  const only = String(onlyArg).toLowerCase();
  return {
    check: args.has("--check"),
    dryRun: args.has("--dry-run"),
    deleteMissing: !args.has("--no-delete"),
    only,
  };
}

function extractFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: "", body: markdown, matched: false };
  return {
    frontmatter: match[1],
    body: markdown.slice(match[0].length),
    matched: true,
  };
}

let _platformAttrs = null;
let _platformNotes = {};
let _anthropicAliasMap = null;

async function loadPlatformAttributes() {
  if (_platformAttrs) return _platformAttrs;
  try {
    const raw = await fs.readFile(PLATFORM_ATTRS_PATH, "utf8");
    _platformAttrs = JSON.parse(raw);
  } catch {
    _platformAttrs = {};
  }
  return _platformAttrs;
}

async function loadPlatformNote(platform) {
  if (_platformNotes[platform] !== undefined) return _platformNotes[platform];
  const notePath = path.join(PLATFORM_NOTES_DIR, `${platform}.md`);
  try {
    _platformNotes[platform] = (await fs.readFile(notePath, "utf8")).trim();
  } catch {
    _platformNotes[platform] = "";
  }
  return _platformNotes[platform];
}

async function loadAnthropicAliasMap() {
  if (_anthropicAliasMap) return _anthropicAliasMap;
  const intake = await readAnthropicSkillIntake();
  _anthropicAliasMap = buildAnthropicAliasMap(intake);
  return _anthropicAliasMap;
}

async function getAnthropicAliasesForSkill(skillId) {
  const aliasMap = await loadAnthropicAliasMap();
  return [...(aliasMap.get(String(skillId || "").toLowerCase()) || [])];
}

function injectDescriptionAliases(frontmatter, aliases) {
  if (!Array.isArray(aliases) || aliases.length === 0) return frontmatter;
  const aliasLabel = ` Anthropic compatibility aliases: ${aliases.join(", ")}.`;
  const lines = frontmatter.split(/\r?\n/);
  let updated = false;

  const nextLines = lines.map((line) => {
    if (updated || /^\s/.test(line)) return line;
    const match = line.match(/^description\s*:\s*(.*)$/);
    if (!match) return line;

    const value = match[1] || "";
    if (value.includes(aliasLabel.trim())) {
      updated = true;
      return line;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      const quote = value[0];
      const inner = value.slice(1, -1);
      updated = true;
      return `description: ${quote}${inner}${aliasLabel}${quote}`;
    }

    updated = true;
    return `description: ${value}${aliasLabel}`;
  });

  return nextLines.join("\n");
}

function injectCompatibilityAliasSection(body, aliases) {
  if (!Array.isArray(aliases) || aliases.length === 0) return body;
  const normalized = [...new Set(aliases.filter(Boolean))];
  if (normalized.length === 0) return body;

  const heading = "## Compatibility Aliases";
  if (body.includes(heading)) return body;

  const section = [
    heading,
    "",
    `Anthropic upstream compatibility names for this skill: ${normalized
      .map((alias) => `\`${alias}\``)
      .join(", ")}.`,
    "Treat requests that use those names as equivalent to this canonical Foundry skill.",
  ].join("\n");

  return `${body.trimEnd()}\n\n${section}\n`;
}

function buildStitchPlatformSection(platform, skillId) {
  const platformName =
    platform === "codex"
      ? "Codex"
      : platform === "claude"
        ? "Claude"
        : platform === "copilot"
          ? "Copilot"
          : platform === "gemini"
            ? "Gemini"
            : platform === "antigravity"
              ? "Antigravity"
              : "Foundry";

  const settingsPath =
    platform === "claude"
      ? "`.mcp.json`"
      : platform === "copilot" || platform === "codex"
        ? "`.vscode/mcp.json`"
        : "`.gemini/settings.json`";

  if (skillId === "stitch") {
    return `## ${platformName} Stitch Compatibility Flow

- Treat this skill as a compatibility wrapper only. Route the real work through \`frontend-design\`, \`stitch-prompt-enhancement\`, \`stitch-design-system\` when needed, \`stitch-design-orchestrator\`, and \`stitch-implementation-handoff\`.
- Verify the Foundry Stitch MCP configuration from ${settingsPath} before choosing any Stitch tool path.
- Prefer the shared \`/implement\` Stitch UI flow for new work so the design-first sequence stays intact on ${platformName}.`;
  }

  if (skillId === "stitch-design-orchestrator") {
    return `## ${platformName} Stitch Orchestration

- Run this as a workflow-first sequence: design prep, prompt enhancement, optional design-system refresh, Stitch preflight, minimal tool selection, then implementation handoff.
- Verify \`stitch_get_status\`, \`mcp_gateway_status\`, and \`stitch_list_enabled_tools\` before any generation or edit call.
- Treat Stitch as a rate-sensitive remote service on ${platformName}: allow one generation or edit action per turn by default, prefer \`edit_screens\` over full regeneration, and stop after two automatic retries with backoff.`;
  }

  if (skillId === "stitch-prompt-enhancement") {
    return `## ${platformName} Stitch Prompt Rules

- Convert vague UI intent into a compact prompt that names the target screen, visual direction, component hierarchy, and exact change scope.
- Pull design language from \`frontend-design\` and \`docs/foundation/DESIGN.md\` instead of pasting raw repo context or long transcripts into Stitch.
- Keep edit prompts narrow on ${platformName}: request one or two deltas at a time once a screen already exists.`;
  }

  if (skillId === "stitch-design-system") {
    return `## ${platformName} Design Context Sync

- Keep \`docs/foundation/DESIGN.md\` as the canonical project design document and mirror it to \`.stitch/DESIGN.md\` for Stitch-facing flows.
- Refresh this context only when the design language is missing, stale, or needs to stay consistent across multiple screens.
- Derive the design system from repo truth first, then use Stitch artifacts only to fill missing visual context on ${platformName}.`;
  }

  if (skillId === "stitch-implementation-handoff") {
    return `## ${platformName} Stitch Implementation Handoff

- Pull the final Stitch artifact before coding, then map it into the repo's real framework, tokens, routing, and components.
- Preserve existing business logic, tests, and accessibility behavior while applying the UI diff.
- Keep the result repo-native on ${platformName}: reuse local primitives and explain any intentional drift from the Stitch artifact.`;
  }

  return "";
}

function buildDeepResearchPlatformSection(platform) {
  if (platform === "codex") {
    return `## Codex Research Flow

- Start in the repo. Gather code, config, tests, and docs before using any external source.
- When external evidence is required, prefer official docs first and keep community evidence clearly labeled as secondary because Codex environments may be network-restricted or stale.
- End with a concrete next route: direct execution, a workflow, an agent posture, or one exact follow-up skill.`;
  }

  if (platform === "claude") {
    return `## Claude Research Flow

- Use \`$ARGUMENTS\` as the research topic when this skill is invoked directly.
- Prefer official docs, upstream repos, and maintainer material before blog posts or Reddit threads.
- If Claude hook templates are installed, let them reinforce repo-first inspection and research escalation, but keep the final research output aligned with this skill's evidence contract.`;
  }

  if (platform === "copilot") {
    return `## Copilot Research Flow

- Restate the research question, freshness requirement, and comparison scope before gathering sources.
- Use repo evidence and \`#file:\` context first, then bring in official docs, then labeled community evidence only if it adds implementation color.
- Finish with the next recommended route so the research result can hand off cleanly into a workflow, prompt file, or agent.`;
  }

  if (platform === "gemini") {
    return `## Gemini Research Flow

- Treat Gemini commands and GEMINI.md as routing aids, not primary evidence. The evidence still comes from the repo first, then official docs, then labeled community sources.
- Use the mirrored references to keep the research output structured: verified facts, secondary evidence, gaps, and recommended next route.
- When a request is implementation-heavy but freshness matters, complete the research pass first, then move into the chosen workflow.`;
  }

  if (platform === "antigravity") {
    return `## Antigravity Research Flow

- Keep research repo-first even when Agent Manager is available. Do not fan out web browsing before you understand the local system.
- Official docs and upstream sources stay primary. Reddit and other community posts can inform practical tradeoffs, but label them as secondary evidence.
- Use Agent Manager only when the research can be cleanly split into independent tracks, then synthesize one final evidence-backed recommendation.`;
  }

  return "";
}

function injectPlatformSpecificSkillGuidance(body, skillId, platform) {
  let section = "";
  if (
    skillId === "stitch" ||
    skillId === "stitch-design-orchestrator" ||
    skillId === "stitch-prompt-enhancement" ||
    skillId === "stitch-design-system" ||
    skillId === "stitch-implementation-handoff"
  ) {
    section = buildStitchPlatformSection(platform, skillId);
  } else if (skillId === "deep-research") {
    section = buildDeepResearchPlatformSection(platform);
  } else {
    return body;
  }
  if (!section) return body;
  return body.trimEnd() + "\n\n" + section + "\n";
}

function stripFrontmatterKeys(frontmatter, keysToRemove) {
  const lines = frontmatter.split(/\r?\n/);
  const kept = [];
  let skipKey = null;

  for (const line of lines) {
    if (skipKey) {
      const isTopLevelKey =
        /^([A-Za-z0-9_-]+)\s*:/.test(line) && !/^\s/.test(line);
      if (!isTopLevelKey) continue;
      skipKey = null;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (keyMatch && !/^\s/.test(line) && keysToRemove.has(keyMatch[1])) {
      const inlineArray = /\[[\s\S]*\]\s*$/.test(line);
      if (!inlineArray) skipKey = keyMatch[1];
      continue;
    }

    kept.push(line);
  }

  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

function injectFrontmatterKeys(frontmatter, entries) {
  const lines = frontmatter.split(/\r?\n/);
  const additions = [];
  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      additions.push(`${key}: [${value.join(", ")}]`);
    } else if (typeof value === "boolean") {
      additions.push(`${key}: ${value}`);
    } else {
      additions.push(`${key}: ${value}`);
    }
  }
  return [...lines, ...additions].join("\n").trimEnd();
}

async function enrichClaudeSkillMarkdown(markdown, skillId) {
  const attrs = (await loadPlatformAttributes())[skillId] || {};
  const anthropicAliases = await getAnthropicAliasesForSkill(skillId);
  const extracted = extractFrontmatter(markdown);
  if (!extracted.matched) return markdown;

  // Remove canonical-only keys
  const CANONICAL_ONLY_KEYS = new Set(["license", "compatibility", "metadata"]);
  let fm = stripFrontmatterKeys(extracted.frontmatter, CANONICAL_ONLY_KEYS);

  // Inject Claude-specific keys
  const injections = [];
  if (attrs.allowedTools && attrs.allowedTools.length > 0) {
    injections.push(["allowed-tools", attrs.allowedTools.join(" ")]);
  }
  if (attrs.contextFork) {
    injections.push(["context", "fork"]);
    if (attrs.forkAgent) {
      injections.push(["agent", attrs.forkAgent]);
    }
  }
  if (attrs.userInvocable !== undefined) {
    injections.push(["user-invocable", attrs.userInvocable]);
  }
  if (attrs.argumentHint) {
    injections.push(["argument-hint", `"${attrs.argumentHint}"`]);
  }

  fm = injectFrontmatterKeys(fm, injections);

  // Build body with platform notes
  let body = rewriteLegacySkillIds(extracted.body);
  body = injectPlatformSpecificSkillGuidance(body, skillId, "claude");
  body = injectCompatibilityAliasSection(body, anthropicAliases);
  const note = await loadPlatformNote("claude");
  if (note) {
    body = body.trimEnd() + "\n\n" + note + "\n";
  }

  return `---\n${fm}\n---\n${body}`;
}

function retainMinimalSkillFrontmatter(frontmatter) {
  const lines = frontmatter.split(/\r?\n/);
  const kept = [];
  let skipUnsupportedKey = null;

  for (const line of lines) {
    if (skipUnsupportedKey) {
      const isTopLevelKey =
        /^([A-Za-z0-9_-]+)\s*:/.test(line) && !/^\s/.test(line);
      if (!isTopLevelKey) continue;
      skipUnsupportedKey = null;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (!keyMatch || /^\s/.test(line)) {
      if (kept.length > 0) kept.push(line);
      continue;
    }

    const key = keyMatch[1];
    if (key === "name" || key === "description") {
      kept.push(line);
      continue;
    }

    const inlineArray = /\[[\s\S]*\]\s*$/.test(line);
    if (!inlineArray) {
      skipUnsupportedKey = key;
    }
  }

  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

async function transformMinimalSkillMarkdown(markdown, platform, skillId) {
  const anthropicAliases = await getAnthropicAliasesForSkill(skillId);
  const extracted = extractFrontmatter(markdown);
  if (!extracted.matched) return markdown;

  let minimalFrontmatter = retainMinimalSkillFrontmatter(extracted.frontmatter);
  minimalFrontmatter = injectDescriptionAliases(minimalFrontmatter, anthropicAliases);
  let body = rewriteLegacySkillIds(extracted.body);
  body = body.replace(/\$ARGUMENTS/g, "user input");
  body = body.replace(/\$\{CLAUDE_SKILL_DIR\}/g, "the skill directory");

  if (platform === "codex") {
    body = body.replace(/\bsub-?agents?\b/gi, "postures");
    body = body.replace(/`?context:\s*fork`?/gi, "inline posture guidance");
  } else if (platform === "antigravity") {
    body = body.replace(/\bsub-?agents?\b/gi, "agent-manager handoffs");
    body = body.replace(/`?context:\s*fork`?/gi, "workflow or Agent Manager routing");
  } else if (platform === "gemini") {
    body = body.replace(/\bsub-?agents?\b/gi, "inline specialist postures");
    body = body.replace(/`?context:\s*fork`?/gi, "inline skill execution");
  }

  body = injectPlatformSpecificSkillGuidance(body, skillId, platform);
  body = injectCompatibilityAliasSection(body, anthropicAliases);

  const note = await loadPlatformNote(platform);
  if (note) {
    body = body.trimEnd() + "\n\n" + note + "\n";
  }

  const bodyWithoutLeadingNewlines = body.replace(/^(?:\r?\n)+/, "");
  return `---\n${minimalFrontmatter}\n---\n${bodyWithoutLeadingNewlines}`;
}

function filterFrontmatterByAllowedKeys(frontmatter, allowedKeys) {
  const lines = frontmatter.split(/\r?\n/);
  const kept = [];
  let skipUnsupportedKey = null;

  for (const line of lines) {
    if (skipUnsupportedKey) {
      const isTopLevelKey =
        /^([A-Za-z0-9_-]+)\s*:/.test(line) && !/^\s/.test(line);
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
    if (allowedKeys.has(key)) {
      kept.push(line);
      continue;
    }

    const inlineArray = /\[[\s\S]*\]\s*$/.test(line);
    if (!inlineArray) {
      skipUnsupportedKey = key;
    }
  }

  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

async function transformCopilotSkillMarkdown(markdown, skillId) {
  const anthropicAliases = await getAnthropicAliasesForSkill(skillId);
  const extracted = extractFrontmatter(markdown);
  if (!extracted.matched) return markdown;

  const cleanedFrontmatter = filterFrontmatterByAllowedKeys(
    extracted.frontmatter,
    COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS,
  );

  // Sanitize body: replace Claude-specific references
  let body = rewriteLegacySkillIds(extracted.body);
  body = body.replace(/\$ARGUMENTS/g, "user input");
  body = body.replace(/\$\{CLAUDE_SKILL_DIR\}/g, "the skill directory");
  body = body.replace(/`?context:\s*fork`?/gi, "");
  body = injectPlatformSpecificSkillGuidance(body, skillId, "copilot");
  body = injectCompatibilityAliasSection(body, anthropicAliases);

  // Append Copilot platform notes
  const note = await loadPlatformNote("copilot");
  if (note) {
    body = body.trimEnd() + "\n\n" + note + "\n";
  }

  const bodyWithoutLeadingNewlines = body.replace(/^(?:\r?\n)+/, "");
  return `---\n${cleanedFrontmatter}\n---\n${bodyWithoutLeadingNewlines}`;
}

async function copyFilteredSkillDir(source, destination, label, depth = 0) {
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyFilteredSkillDir(sourcePath, destinationPath, label, depth + 1);
      continue;
    }

    if (!entry.isFile()) continue;
    if (entry.name === "POWER.md") continue;
    if (
      depth === 0 &&
      entry.name.endsWith(".md") &&
      entry.name !== "SKILL.md"
    ) {
      continue;
    }

    if (entry.name === "SKILL.md") {
      const raw = await fs.readFile(sourcePath, "utf8");
      let transformed = raw;
      const skillId = path.basename(source);
      if (label === "copilot") {
        transformed = await transformCopilotSkillMarkdown(raw, skillId);
      } else if (label === "claude") {
        transformed = await enrichClaudeSkillMarkdown(raw, skillId);
      } else if (
        label === "codex" ||
        label === "antigravity" ||
        label === "gemini"
      ) {
        transformed = await transformMinimalSkillMarkdown(raw, label, skillId);
      }
      await fs.writeFile(destinationPath, transformed, "utf8");
      continue;
    }

    await fs.copyFile(sourcePath, destinationPath);
  }
}

async function syncMirror({
  label,
  mirrorRoot,
  canonicalById,
  dryRun,
  deleteMissing,
}) {
  await fs.mkdir(mirrorRoot, { recursive: true });
  const mirrorSkillIds = await listSkillDirs(mirrorRoot);
  const canonicalIds = [...canonicalById.values()].map((item) => item.id);
  const canonicalSet = new Set(canonicalIds.map((id) => id.toLowerCase()));

  const removed = [];
  if (deleteMissing) {
    for (const mirrorSkillId of mirrorSkillIds) {
      if (!canonicalSet.has(mirrorSkillId.toLowerCase())) {
        const target = path.join(mirrorRoot, mirrorSkillId);
        if (!dryRun) {
          await fs.rm(target, { recursive: true, force: true });
        }
        removed.push(mirrorSkillId);
      }
    }
  }

  const synced = [];
  for (const item of [...canonicalById.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    const destination = path.join(mirrorRoot, item.id);
    if (!dryRun) {
      await fs.rm(destination, { recursive: true, force: true });
      await copyFilteredSkillDir(item.source, destination, label);
    }
    synced.push(item.id);
  }

  return {
    label,
    mirrorRoot,
    syncedCount: synced.length,
    removedCount: removed.length,
    dryRun,
  };
}

async function collectFiles(rootDir) {
  const files = new Map();

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const relativePath = path.relative(rootDir, fullPath);
      const content = await fs.readFile(fullPath, "utf8");
      files.set(relativePath, content);
    }
  }

  if (await pathExists(rootDir)) {
    await walk(rootDir);
  }

  return files;
}

async function checkMirror({ label, mirrorRoot, canonicalById }) {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), `cbx-skill-mirror-${label}-`),
  );
  const expectedRoot = path.join(tempRoot, label);

  try {
    await syncMirror({
      label,
      mirrorRoot: expectedRoot,
      canonicalById,
      dryRun: false,
      deleteMissing: true,
    });

    const expectedFiles = await collectFiles(expectedRoot);
    const actualFiles = await collectFiles(mirrorRoot);
    const problems = [];

    actualFiles.delete("skills_index.json");

    for (const [relativePath, expectedContent] of expectedFiles) {
      if (!actualFiles.has(relativePath)) {
        problems.push(`missing ${relativePath}`);
        continue;
      }

      const actualContent = actualFiles.get(relativePath);
      if (actualContent !== expectedContent) {
        problems.push(`stale ${relativePath}`);
      }
    }

    for (const relativePath of actualFiles.keys()) {
      if (!expectedFiles.has(relativePath)) {
        problems.push(`unexpected ${relativePath}`);
      }
    }

    return {
      label,
      mirrorRoot,
      ok: problems.length === 0,
      problems,
    };
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

async function main() {
  const { check, dryRun, deleteMissing, only } = parseArgs(process.argv);

  const canonicalById = await buildCanonicalSkillSourceMap();
  if (canonicalById.size === 0) {
    throw new Error(
      `No canonical skills found in roots: ${CANONICAL_ROOTS.join(", ")}`,
    );
  }

  const targets =
    only === "all"
      ? Object.entries(MIRRORS)
      : Object.entries(MIRRORS).filter(([label]) => label === only);

  if (targets.length === 0) {
    throw new Error(
      `Unknown --only target '${only}'. No mirror targets configured.`,
    );
  }

  if (check) {
    let hasProblems = false;

    for (const [label, mirrorRoot] of targets) {
      const result = await checkMirror({ label, mirrorRoot, canonicalById });
      if (result.ok) {
        console.log(`checked ${label}: OK (${result.mirrorRoot})`);
        continue;
      }

      hasProblems = true;
      console.error(`checked ${label}: stale (${result.mirrorRoot})`);
      for (const problem of result.problems) {
        console.error(`  - ${problem}`);
      }
    }

    if (hasProblems) {
      process.exit(1);
    }

    return;
  }

  for (const [label, mirrorRoot] of targets) {
    const result = await syncMirror({
      label,
      mirrorRoot,
      canonicalById,
      dryRun,
      deleteMissing,
    });

    const prefix = dryRun ? "[dry-run] " : "";
    console.log(
      `${prefix}synced ${result.label}: ${result.syncedCount} skills, removed ${result.removedCount} stale from ${result.mirrorRoot}`,
    );
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
