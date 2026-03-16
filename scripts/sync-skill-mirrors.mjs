#!/usr/bin/env node

import path from "node:path";
import os from "node:os";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import { rewriteLegacySkillIds } from "./lib/legacy-skill-map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CANONICAL_ROOTS = [path.join(ROOT, "workflows", "skills")];
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

async function pathExists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function listSkillDirs(rootDir) {
  if (!(await pathExists(rootDir))) return [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."))
    .sort((a, b) => a.localeCompare(b));
}

async function buildCanonicalSkillSourceMap() {
  const sourceById = new Map();

  for (const root of CANONICAL_ROOTS) {
    if (!(await pathExists(root))) continue;
    const ids = await listSkillDirs(root);
    for (const skillId of ids) {
      const source = path.join(root, skillId);
      const skillFile = path.join(source, "SKILL.md");
      if (!(await pathExists(skillFile))) continue;
      // Later roots override earlier roots (mcp canonical preferred).
      sourceById.set(skillId.toLowerCase(), { id: skillId, source });
    }
  }

  return sourceById;
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

function buildStitchPlatformSection(platform) {
  if (platform === "codex") {
    return `## Codex Stitch Flow

- Treat Stitch as a repo-local implementation assistant, not a code drop. Verify the \`cubis-foundry\` MCP entry, inspect the workspace, then patch the existing screen with minimal diffs.
- Keep the flow in one reasoning thread: preflight with \`stitch_get_status\` and \`mcp_gateway_status\`, fetch the artifact, map it to the current stack, then edit locally.
- If the request sounds like "sync" or "update", compare the current component tree first and preserve validated local business logic while changing only UI structure, copy, tokens, and states.`;
  }

  if (platform === "claude") {
    return `## Claude Stitch Flow

- Use \`$ARGUMENTS\` as the requested Stitch screen or implementation brief when this skill is invoked directly.
- Resolve any extra guidance from \`\${CLAUDE_SKILL_DIR}/references/platform-setup.md\`, \`\${CLAUDE_SKILL_DIR}/references/implementation-patterns.md\`, and \`\${CLAUDE_SKILL_DIR}/references/update-diff-workflow.md\`.
- Start with Foundry gateway + Stitch status checks, then hand the concrete implementation work to the frontend-specialist fork only after the target artifact and destination surface are clear.`;
  }

  if (platform === "copilot") {
    return `## Copilot Stitch Flow

- Treat the user prompt itself as the skill argument. Restate the target screen, framework, and reuse constraints before editing code.
- Pull extra context from the mirrored references when needed, for example \`#file:references/platform-setup.md\` and \`#file:references/update-diff-workflow.md\`.
- Keep the task inline: verify Foundry gateway access from workspace \`.vscode/mcp.json\`, fetch the Stitch artifact, then apply a minimal repo-native patch without assuming subagents or custom tool restrictions.`;
  }

  if (platform === "gemini") {
    return `## Gemini Stitch Flow

- Activate the \`stitch\` skill inline, then verify the workspace or global \`.gemini/settings.json\` entry points at \`cubis-foundry\`.
- Keep the flow sequential: gateway preflight, artifact fetch, framework mapping, local patch, verification.
- When the prompt is vague, first rewrite it into a concrete implementation brief with target route, component boundaries, states, and responsive expectations before editing code.`;
  }

  if (platform === "antigravity") {
    return `## Antigravity Stitch Flow

- Use the \`stitch\` skill from \`.agent/skills/stitch\` as the preflight and artifact-retrieval entry point, then hand off focused implementation work through Agent Manager only if the task genuinely benefits from parallelism.
- Keep Stitch verification with the initiating agent: confirm gateway status, screen identity, and destination files before dispatching any frontend-specialist work.
- Preserve Antigravity's route-first posture: the result should still be a minimal, repo-native UI patch rather than a pasted design export.`;
  }

  return "";
}

function injectPlatformSpecificSkillGuidance(body, skillId, platform) {
  if (skillId !== "stitch") return body;
  const section = buildStitchPlatformSection(platform);
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
  const extracted = extractFrontmatter(markdown);
  if (!extracted.matched) return markdown;

  const minimalFrontmatter = retainMinimalSkillFrontmatter(extracted.frontmatter);
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
