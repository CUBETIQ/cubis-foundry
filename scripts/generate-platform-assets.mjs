#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";

const ROOT = process.cwd();
const BUNDLE_ROOT = path.join(
  ROOT,
  "workflows",
  "workflows",
  "agent-environment-setup",
);
const SHARED_ROOT = path.join(BUNDLE_ROOT, "shared");
const SHARED_AGENTS_DIR = path.join(SHARED_ROOT, "agents");
const SHARED_WORKFLOWS_DIR = path.join(SHARED_ROOT, "workflows");
const GENERATED_DIR = path.join(BUNDLE_ROOT, "generated");
const ROUTE_MANIFEST_FILE = "route-manifest.json";

const PLATFORM_DIRS = {
  codex: path.join(BUNDLE_ROOT, "platforms", "codex"),
  antigravity: path.join(BUNDLE_ROOT, "platforms", "antigravity"),
  copilot: path.join(BUNDLE_ROOT, "platforms", "copilot"),
  claude: path.join(BUNDLE_ROOT, "platforms", "claude"),
};

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
  "argument-hint",
]);

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  return {
    raw: match[1],
    body: markdown.slice(match[0].length),
  };
}

function stripQuotes(value) {
  const trimmed = String(value || "").trim();
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

function normalizeMarkdownId(fileName) {
  return path.basename(fileName, ".md").trim();
}

function getScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"));
  if (!match) return null;
  return stripQuotes(match[1]);
}

function getArray(frontmatter, key) {
  const bracketMatch = frontmatter.match(
    new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, "m"),
  );
  if (bracketMatch) {
    return unique(parseInlineArray(bracketMatch[1]));
  }

  const singleLine = frontmatter.match(
    new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"),
  );
  if (!singleLine) return [];
  return unique(parseInlineArray(singleLine[1]));
}

function hasSection(markdownBody, heading) {
  return new RegExp(`^##\\s+${heading}$`, "m").test(markdownBody);
}

function sanitizeFrontmatterByAllowedKeys(frontmatter, allowedKeys) {
  const lines = frontmatter.split(/\r?\n/);
  const kept = [];
  const removedKeys = [];
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

    removedKeys.push(key);
    const inlineArray = /\[[\s\S]*\]\s*$/.test(line);
    if (!inlineArray) {
      skipUnsupportedKey = key;
    }
  }

  return {
    frontmatter: kept
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd(),
    removedKeys: unique(removedKeys),
  };
}

function buildSkillRoutingSection(skills) {
  if (!Array.isArray(skills) || skills.length === 0) return "";
  const list = skills.map((skillId) => `\`${skillId}\``).join(", ");
  return [
    "## Skill routing",
    `Prefer these skills when task intent matches: ${list}.`,
    "",
    "If none apply directly, use the closest specialist guidance and state the fallback.",
    "",
  ].join("\n");
}

function extractSection(body, heading) {
  const match = body.match(
    new RegExp(`^##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=^##\\s+|\\Z)`, "m"),
  );
  return match ? match[1].trim() : "";
}

function parseInlineCodeList(value) {
  const fromCodeSpans = [...String(value || "").matchAll(/`([^`]+)`/g)].map(
    (match) => stripQuotes(match[1].trim()),
  );
  if (fromCodeSpans.length > 0) {
    return unique(fromCodeSpans.filter(Boolean));
  }
  return unique(
    String(value || "")
      .split(",")
      .map((item) => stripQuotes(item.trim()))
      .filter(Boolean),
  );
}

function parseWorkflowRouting(body) {
  const routing = extractSection(body, "Routing");
  const referencedAgents = unique(
    [...routing.matchAll(/@([A-Za-z0-9_-]+)/g)].map((match) => match[1]),
  );
  const primaryMatch = routing.match(
    /Primary (?:specialist|coordinator):\s*`?@([A-Za-z0-9_-]+)`?/i,
  );
  const primaryAgent =
    primaryMatch?.[1] || referencedAgents[0] || "orchestrator";
  const supportingAgents = unique(
    referencedAgents.filter((agentId) => agentId !== primaryAgent),
  );

  return { primaryAgent, supportingAgents };
}

function parseWorkflowSkillRouting(body) {
  const skillRouting = extractSection(body, "Skill Routing");
  const primaryMatch = skillRouting.match(/Primary skills:\s*(.+)$/im);
  const supportingMatch = skillRouting.match(
    /Supporting skills(?:\s*\(optional\))?:\s*(.+)$/im,
  );

  return {
    primarySkills: parseInlineCodeList(primaryMatch?.[1] || ""),
    supportingSkills: parseInlineCodeList(supportingMatch?.[1] || ""),
  };
}

function parseAgentTriggers(agent) {
  const direct = getArray(agent.frontmatter, "triggers");
  if (direct.length > 0) return direct;

  const description = getScalar(agent.frontmatter, "description") || "";
  const triggerMatch = description.match(/Triggers on (.+?)(?:\.|$)/i);
  if (!triggerMatch) return [];
  return unique(
    triggerMatch[1]
      .split(",")
      .map((item) => stripQuotes(item.trim()))
      .filter(Boolean),
  );
}

function buildRouteManifest({ sharedAgents, sharedWorkflows }) {
  const workflowRoutes = sharedWorkflows.map((workflow) => {
    const { primaryAgent, supportingAgents } = parseWorkflowRouting(
      workflow.body,
    );
    const { primarySkills, supportingSkills } = parseWorkflowSkillRouting(
      workflow.body,
    );
    const commandId = workflow.command
      .replace(/^\//, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    return {
      kind: "workflow",
      id: workflow.id,
      command: workflow.command,
      displayName: workflow.id,
      description: workflow.description,
      triggers: unique(getArray(workflow.frontmatter, "triggers")),
      primaryAgent,
      supportingAgents,
      primarySkills,
      supportingSkills,
      artifacts: {
        codex: {
          workflowFile: workflow.fileName,
          compatibilityAlias: `$workflow-${workflow.id}`,
        },
        copilot: {
          workflowFile: workflow.fileName,
          promptFile: `workflow-${workflow.id}.prompt.md`,
        },
        antigravity: {
          workflowFile: workflow.fileName,
          commandFile: `${commandId}.toml`,
        },
        claude: {
          workflowFile: workflow.fileName,
        },
      },
    };
  });

  const agentRoutes = sharedAgents.map((agent) => {
    const agentId = normalizeMarkdownId(agent.fileName);
    const allSkills = getArray(agent.frontmatter, "skills");
    return {
      kind: "agent",
      id: agentId,
      command: null,
      displayName: getScalar(agent.frontmatter, "name") || agentId,
      description: getScalar(agent.frontmatter, "description") || "",
      triggers: parseAgentTriggers(agent),
      primaryAgent: agentId,
      supportingAgents: [],
      primarySkills: allSkills.slice(0, 2),
      supportingSkills: allSkills.slice(2),
      artifacts: {
        codex: {
          agentFile: agent.fileName,
          compatibilityAlias: `$agent-${agentId}`,
        },
        copilot: {
          agentFile: agent.fileName,
        },
        antigravity: {
          agentFile: agent.fileName,
        },
        claude: {
          agentFile: agent.fileName,
        },
      },
    };
  });

  const routes = [...workflowRoutes, ...agentRoutes].sort((a, b) => {
    return a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id);
  });
  const contentHash = createHash("sha256")
    .update(JSON.stringify(routes))
    .digest("hex")
    .slice(0, 16);

  return (
    JSON.stringify(
      {
        $schema: "cubis-foundry-route-manifest-v1",
        generatedAt: new Date(0).toISOString(),
        contentHash,
        summary: {
          totalRoutes: routes.length,
          workflows: workflowRoutes.length,
          agents: agentRoutes.length,
        },
        routes,
      },
      null,
      2,
    ) + "\n"
  );
}

function buildCopilotAgentMarkdown(sharedMarkdown) {
  const parsed = parseFrontmatter(sharedMarkdown);
  if (!parsed) {
    throw new Error("Shared agent is missing frontmatter");
  }

  const skills = getArray(parsed.raw, "skills");
  const sanitized = sanitizeFrontmatterByAllowedKeys(
    parsed.raw,
    COPILOT_ALLOWED_AGENT_KEYS,
  );
  const body = parsed.body.trim();

  const lines = ["---", sanitized.frontmatter, "---", "", body];
  const skillSection = buildSkillRoutingSection(skills);
  if (skillSection) {
    lines.push("", skillSection.trimEnd());
  }
  lines.push("");

  return {
    markdown: `${lines.join("\n")}`,
    removedKeys: sanitized.removedKeys,
  };
}

function escapeTomlBasicString(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\"/g, '\\\"')
    .replace(/\n/g, "\\n");
}

function buildAntigravityCommandToml({ id, command, description }) {
  const prompt = [
    `Follow the ${command} workflow from .agent/workflows/${id}.md.`,
    "",
    "Execution contract:",
    "1. Treat route selection as already resolved by this command; do not begin with skill discovery.",
    '2. Confirm the request fits the workflow\'s "When to use" section.',
    '3. Execute according to "Workflow steps" and apply "Context notes".',
    '4. Complete "Verification" checks and report concrete evidence.',
    "",
    "If command arguments are provided, treat them as additional user context.",
  ].join("\n");

  return [
    `description = \"${escapeTomlBasicString(description)}\"`,
    "prompt = '''",
    prompt,
    "'''",
    "",
  ].join("\n");
}

function buildCopilotPromptMarkdown({ id, command, description }) {
  return [
    `# Workflow Prompt: ${command}`,
    "",
    description,
    "",
    "Use this prompt with the matching workflow file:",
    `- Workflow: ../copilot/workflows/${id}.md`,
    "",
    "Execution contract:",
    "1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.",
    "2. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.",
    "3. Route to the workflow's primary specialist and only add supporting specialists when needed.",
    "4. Return actions taken, verification evidence, and any gaps.",
    "",
  ].join("\n");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        !entry.name.startsWith("."),
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function loadSharedFiles(directory, requiredSections = []) {
  const files = await listMarkdownFiles(directory);
  const items = [];

  for (const fileName of files) {
    const fullPath = path.join(directory, fileName);
    const raw = (await fs.readFile(fullPath, "utf8")).replace(/\r\n/g, "\n");
    const parsed = parseFrontmatter(raw);
    if (!parsed) {
      throw new Error(`Missing frontmatter: ${fullPath}`);
    }

    for (const section of requiredSections) {
      if (!hasSection(parsed.body, section)) {
        throw new Error(
          `Missing required section \"${section}\" in ${fullPath}`,
        );
      }
    }

    const id = path.basename(fileName, ".md");
    items.push({
      id,
      fileName,
      raw,
      frontmatter: parsed.raw,
      body: parsed.body,
      command: getScalar(parsed.raw, "command") || `/${id}`,
      description: getScalar(parsed.raw, "description") || `${id} workflow`,
    });
  }

  return items;
}

async function removeGeneratedFiles(dir, extensionFilter = null) {
  if (!(await pathExists(dir))) return;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name.startsWith(".")) continue;
    if (extensionFilter && !entry.name.endsWith(extensionFilter)) continue;
    await fs.rm(path.join(dir, entry.name), { force: true });
  }
}

async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function writeFileNormalized(filePath, content) {
  await ensureDir(path.dirname(filePath));
  const normalized = content.replace(/\r\n/g, "\n");
  await fs.writeFile(filePath, normalized, "utf8");
}

async function applyOutputMap({ rootDir, fileMap, cleanMdOnly = true }) {
  await ensureDir(rootDir);
  await removeGeneratedFiles(rootDir, cleanMdOnly ? ".md" : null);
  const written = [];
  for (const [name, content] of fileMap.entries()) {
    const target = path.join(rootDir, name);
    await writeFileNormalized(target, content);
    written.push(target);
  }
  return written;
}

function diffSet(expectedMap, actualMap) {
  const missing = [];
  const changed = [];
  const extra = [];

  for (const [name, expected] of expectedMap.entries()) {
    if (!actualMap.has(name)) {
      missing.push(name);
      continue;
    }
    const actual = actualMap.get(name);
    if (actual !== expected) {
      changed.push(name);
    }
  }

  for (const name of actualMap.keys()) {
    if (!expectedMap.has(name)) {
      extra.push(name);
    }
  }

  return {
    missing: missing.sort((a, b) => a.localeCompare(b)),
    changed: changed.sort((a, b) => a.localeCompare(b)),
    extra: extra.sort((a, b) => a.localeCompare(b)),
  };
}

async function readFileMap(dir, filter = null) {
  const map = new Map();
  if (!(await pathExists(dir))) return map;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name.startsWith(".")) continue;
    if (filter && !filter(entry.name)) continue;
    const content = (
      await fs.readFile(path.join(dir, entry.name), "utf8")
    ).replace(/\r\n/g, "\n");
    map.set(entry.name, content);
  }
  return map;
}

function buildExpectedMaps({ sharedAgents, sharedWorkflows }) {
  const codexAgents = new Map();
  const antigravityAgents = new Map();
  const copilotAgents = new Map();
  const claudeAgents = new Map();
  const codexWorkflows = new Map();
  const antigravityWorkflows = new Map();
  const copilotWorkflows = new Map();
  const claudeWorkflows = new Map();
  const antigravityCommands = new Map();
  const copilotPrompts = new Map();
  const generated = new Map();

  for (const agent of sharedAgents) {
    codexAgents.set(agent.fileName, agent.raw);
    antigravityAgents.set(agent.fileName, agent.raw);
    claudeAgents.set(agent.fileName, agent.raw);
    const transformed = buildCopilotAgentMarkdown(agent.raw);
    copilotAgents.set(agent.fileName, transformed.markdown);
  }

  generated.set(
    ROUTE_MANIFEST_FILE,
    buildRouteManifest({ sharedAgents, sharedWorkflows }),
  );

  for (const workflow of sharedWorkflows) {
    codexWorkflows.set(workflow.fileName, workflow.raw);
    antigravityWorkflows.set(workflow.fileName, workflow.raw);
    copilotWorkflows.set(workflow.fileName, workflow.raw);
    claudeWorkflows.set(workflow.fileName, workflow.raw);

    const commandId = workflow.command
      .replace(/^\//, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    antigravityCommands.set(
      `${commandId}.toml`,
      buildAntigravityCommandToml(workflow),
    );
    copilotPrompts.set(
      `workflow-${workflow.id}.prompt.md`,
      buildCopilotPromptMarkdown(workflow),
    );
  }

  return {
    codexAgents,
    antigravityAgents,
    copilotAgents,
    claudeAgents,
    codexWorkflows,
    antigravityWorkflows,
    copilotWorkflows,
    claudeWorkflows,
    antigravityCommands,
    copilotPrompts,
    generated,
  };
}

async function run({ checkOnly = false }) {
  const sharedAgents = await loadSharedFiles(SHARED_AGENTS_DIR);
  const sharedWorkflows = await loadSharedFiles(SHARED_WORKFLOWS_DIR, [
    "When to use",
    "Workflow steps",
    "Context notes",
    "Verification",
  ]);

  const maps = buildExpectedMaps({ sharedAgents, sharedWorkflows });

  const targets = [
    {
      label: "codex agents",
      dir: path.join(PLATFORM_DIRS.codex, "agents"),
      expected: maps.codexAgents,
      filter: (name) => name.endsWith(".md"),
    },
    {
      label: "codex workflows",
      dir: path.join(PLATFORM_DIRS.codex, "workflows"),
      expected: maps.codexWorkflows,
      filter: (name) => name.endsWith(".md"),
    },
    {
      label: "antigravity agents",
      dir: path.join(PLATFORM_DIRS.antigravity, "agents"),
      expected: maps.antigravityAgents,
      filter: (name) => name.endsWith(".md"),
    },
    {
      label: "antigravity workflows",
      dir: path.join(PLATFORM_DIRS.antigravity, "workflows"),
      expected: maps.antigravityWorkflows,
      filter: (name) => name.endsWith(".md"),
    },
    {
      label: "antigravity commands",
      dir: path.join(PLATFORM_DIRS.antigravity, "commands"),
      expected: maps.antigravityCommands,
      filter: (name) => name.endsWith(".toml"),
    },
    {
      label: "copilot agents",
      dir: path.join(PLATFORM_DIRS.copilot, "agents"),
      expected: maps.copilotAgents,
      filter: (name) => name.endsWith(".md"),
    },
    {
      label: "copilot workflows",
      dir: path.join(PLATFORM_DIRS.copilot, "workflows"),
      expected: maps.copilotWorkflows,
      filter: (name) => name.endsWith(".md"),
    },
    {
      label: "copilot prompts",
      dir: path.join(PLATFORM_DIRS.copilot, "prompts"),
      expected: maps.copilotPrompts,
      filter: (name) => name.endsWith(".prompt.md"),
    },
    {
      label: "claude agents",
      dir: path.join(PLATFORM_DIRS.claude, "agents"),
      expected: maps.claudeAgents,
      filter: (name) => name.endsWith(".md"),
    },
    {
      label: "claude workflows",
      dir: path.join(PLATFORM_DIRS.claude, "workflows"),
      expected: maps.claudeWorkflows,
      filter: (name) => name.endsWith(".md"),
    },
    {
      label: "generated route manifest",
      dir: GENERATED_DIR,
      expected: maps.generated,
      filter: (name) => name === ROUTE_MANIFEST_FILE,
    },
  ];

  if (checkOnly) {
    const drift = [];
    for (const target of targets) {
      const actual = await readFileMap(target.dir, target.filter);
      const diff = diffSet(target.expected, actual);
      if (diff.missing.length || diff.changed.length || diff.extra.length) {
        drift.push({ label: target.label, diff });
      }
    }

    if (drift.length > 0) {
      for (const item of drift) {
        console.error(`Drift detected for ${item.label}:`);
        if (item.diff.missing.length > 0) {
          console.error(`- missing: ${item.diff.missing.join(", ")}`);
        }
        if (item.diff.changed.length > 0) {
          console.error(`- changed: ${item.diff.changed.join(", ")}`);
        }
        if (item.diff.extra.length > 0) {
          console.error(`- extra: ${item.diff.extra.join(", ")}`);
        }
      }
      process.exit(1);
    }

    console.log(
      JSON.stringify(
        {
          mode: "check",
          sharedAgents: sharedAgents.length,
          sharedWorkflows: sharedWorkflows.length,
          status: "ok",
        },
        null,
        2,
      ),
    );
    return;
  }

  const written = [];
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.codex, "agents"),
      fileMap: maps.codexAgents,
      cleanMdOnly: true,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.codex, "workflows"),
      fileMap: maps.codexWorkflows,
      cleanMdOnly: true,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.antigravity, "agents"),
      fileMap: maps.antigravityAgents,
      cleanMdOnly: true,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.antigravity, "workflows"),
      fileMap: maps.antigravityWorkflows,
      cleanMdOnly: true,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.antigravity, "commands"),
      fileMap: maps.antigravityCommands,
      cleanMdOnly: false,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.copilot, "agents"),
      fileMap: maps.copilotAgents,
      cleanMdOnly: true,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.copilot, "workflows"),
      fileMap: maps.copilotWorkflows,
      cleanMdOnly: true,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.copilot, "prompts"),
      fileMap: maps.copilotPrompts,
      cleanMdOnly: false,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.claude, "agents"),
      fileMap: maps.claudeAgents,
      cleanMdOnly: true,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.claude, "workflows"),
      fileMap: maps.claudeWorkflows,
      cleanMdOnly: true,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: GENERATED_DIR,
      fileMap: maps.generated,
      cleanMdOnly: false,
    })),
  );

  console.log(
    JSON.stringify(
      {
        mode: "write",
        sharedAgents: sharedAgents.length,
        sharedWorkflows: sharedWorkflows.length,
        filesWritten: written.length,
      },
      null,
      2,
    ),
  );
}

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check") || args.has("--dry-run");

run({ checkOnly }).catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
