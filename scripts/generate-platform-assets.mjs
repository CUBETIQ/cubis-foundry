#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  normalizeSkillIds,
  rewriteLegacySkillIds,
} from "./lib/legacy-skill-map.mjs";

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
const BUNDLE_MANIFEST_FILE = "manifest.json";
const CANONICAL_SKILLS_DIR = path.join(ROOT, "workflows", "skills");
const DOCS_DIR = path.join(ROOT, "docs");
const PLATFORM_SUPPORT_MATRIX_FILE = "platform-support-matrix.md";

const PLATFORM_DIRS = {
  codex: path.join(BUNDLE_ROOT, "platforms", "codex"),
  antigravity: path.join(BUNDLE_ROOT, "platforms", "antigravity"),
  copilot: path.join(BUNDLE_ROOT, "platforms", "copilot"),
  claude: path.join(BUNDLE_ROOT, "platforms", "claude"),
  gemini: path.join(BUNDLE_ROOT, "platforms", "gemini"),
};

const COPILOT_ALLOWED_AGENT_KEYS = new Set([
  "agents",
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

function normalizeSkillsFrontmatter(frontmatter) {
  return frontmatter.replace(/^(skills\s*:\s*)(.+)$/m, (match, prefix, value) => {
    const normalized = normalizeSkillIds(parseInlineArray(value));
    return `${prefix}${normalized.join(", ")}`;
  });
}

function normalizeMarkdownSkillReferences(markdown) {
  const parsed = parseFrontmatter(markdown);
  if (!parsed) return rewriteLegacySkillIds(markdown);
  const normalizedFrontmatter = normalizeSkillsFrontmatter(parsed.raw);
  const normalizedBody = rewriteLegacySkillIds(parsed.body);
  return `---\n${normalizedFrontmatter}\n---\n${normalizedBody}`;
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
    primarySkills: normalizeSkillIds(parseInlineCodeList(primaryMatch?.[1] || "")),
    supportingSkills: normalizeSkillIds(
      parseInlineCodeList(supportingMatch?.[1] || ""),
    ),
  };
}

const PLATFORM_SKILL_HINT_ROOTS = {
  antigravity: ".agent/skills",
  codex: ".agents/skills",
  copilot: ".github/skills",
  claude: ".claude/skills",
  gemini: ".gemini/skills",
};

function buildAttachedSkillsSection(workflow, platform) {
  const { primarySkills, supportingSkills } = parseWorkflowSkillRouting(
    workflow.body,
  );
  const attachedSkills = unique([...primarySkills, ...supportingSkills]);
  if (attachedSkills.length === 0) return "";

  const skillRoot = PLATFORM_SKILL_HINT_ROOTS[platform];
  const pathHints = attachedSkills
    .slice(0, 8)
    .map((skillId) => `${skillRoot}/${skillId}/SKILL.md`);

  return [
    "Attached skills:",
    `- Load these exact skill IDs first: ${attachedSkills.map((skillId) => `\`${skillId}\``).join(", ")}.`,
    `- Local skill file hints if installed: ${pathHints.map((hint) => `\`${hint}\``).join(", ")}.`,
    "- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.",
    "",
  ].join("\n");
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
        gemini: {
          workflowFile: workflow.fileName,
          commandFile: `${commandId}.toml`,
        },
      },
    };
  });

  const agentRoutes = sharedAgents.map((agent) => {
    const agentId = normalizeMarkdownId(agent.fileName);
    const allSkills = normalizeSkillIds(getArray(agent.frontmatter, "skills"));
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
        gemini: {
          posture: agentId,
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

async function listTopLevelCanonicalSkillIds() {
  const entries = await fs.readdir(CANONICAL_SKILLS_DIR, { withFileTypes: true });
  const skillIds = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
    const skillFile = path.join(CANONICAL_SKILLS_DIR, entry.name, "SKILL.md");
    if (!(await pathExists(skillFile))) continue;
    skillIds.push(entry.name);
  }
  return skillIds.sort((a, b) => a.localeCompare(b));
}

function buildBundleManifest({
  sharedAgents,
  sharedWorkflows,
  topLevelSkillIds,
}) {
  const workflowFiles = sharedWorkflows
    .map((workflow) => workflow.fileName)
    .sort((a, b) => a.localeCompare(b));
  const agentFiles = sharedAgents
    .map((agent) => agent.fileName)
    .sort((a, b) => a.localeCompare(b));
  const commandFiles = sharedWorkflows
    .map((workflow) =>
      `${workflow.command.replace(/^\//, "").trim().toLowerCase().replace(/\s+/g, "-")}.toml`,
    )
    .sort((a, b) => a.localeCompare(b));
  const promptFiles = sharedWorkflows
    .map((workflow) => `workflow-${workflow.id}.prompt.md`)
    .sort((a, b) => a.localeCompare(b));
  const defaultHooks = [
    {
      type: "conductor-reference",
      optional: true,
      description:
        "If Conductor artifacts exist, workflows can reference them as supporting context.",
    },
  ];
  const claudeHooks = [
    ...defaultHooks,
    {
      type: "template",
      event: "UserPromptSubmit",
      file: "README.md",
      optional: true,
      description:
        "Usage guide for the Claude route/research hook templates.",
    },
    {
      type: "template",
      event: "UserPromptSubmit",
      file: "settings.snippet.json",
      optional: true,
      description:
        "Settings snippet that wires the route/research reminder hook into Claude Code.",
    },
    {
      type: "template",
      event: "UserPromptSubmit",
      file: "route-research-guard.mjs",
      optional: true,
      description:
        "Hook script template that reinforces explicit-route honoring and research escalation.",
    },
  ];

  return (
    JSON.stringify(
      {
        id: "agent-environment-setup",
        version: "1.5.0",
        description:
          "Workflow-first AI agent environment setup for Antigravity, Codex, Copilot, Claude Code, and Gemini CLI.",
        platforms: {
          antigravity: {
            workflows: workflowFiles,
            agents: agentFiles,
            skills: topLevelSkillIds,
            rulesTemplate: "platforms/antigravity/rules/GEMINI.md",
            hooks: defaultHooks,
            commands: commandFiles,
          },
          codex: {
            workflows: workflowFiles,
            agents: agentFiles,
            skills: topLevelSkillIds,
            rulesTemplate: "platforms/codex/rules/AGENTS.md",
            hooks: defaultHooks,
          },
          copilot: {
            workflows: workflowFiles,
            agents: agentFiles,
            skills: topLevelSkillIds,
            rulesTemplate: "platforms/copilot/rules/copilot-instructions.md",
            hooks: defaultHooks,
            prompts: promptFiles,
          },
          claude: {
            workflows: workflowFiles,
            agents: agentFiles,
            skills: topLevelSkillIds,
            rulesTemplate: "platforms/claude/rules/CLAUDE.md",
            hooks: claudeHooks,
          },
          gemini: {
            workflows: workflowFiles,
            agents: [],
            skills: topLevelSkillIds,
            rulesTemplate: "platforms/gemini/rules/GEMINI.md",
            hooks: defaultHooks,
            commands: commandFiles,
          },
        },
      },
      null,
      2,
    ) + "\n"
  );
}

function buildPlatformSupportMatrixMarkdown({
  sharedAgents,
  sharedWorkflows,
  topLevelSkillIds,
}) {
  const agentCount = sharedAgents.length;
  const workflowCount = sharedWorkflows.length;
  const skillCount = topLevelSkillIds.length;

  return [
    "# Platform Support Matrix",
    "",
    "> Generated from the current workflow bundle generators and rule templates.",
    "> Regenerate with `npm run generate:platform-assets`.",
    "",
    "## Platforms",
    "",
    "| Platform | Rule File | Output Directory | Execution Model |",
    "| --- | --- | --- | --- |",
    "| **Antigravity** | `GEMINI.md` (`trigger: always_on`) | `.agent/` | Parallel agent-manager workflow with Gemini-family commands |",
    "| **Gemini CLI** | `GEMINI.md` | `.gemini/` | Inline postures plus TOML commands, no standalone agent files |",
    "| **Claude Code** | `CLAUDE.md` | `.claude/` | Workflow and agent markdown with Claude-native rules |",
    "| **Codex** | `AGENTS.md` | `.agents/` | In-session postures plus compatibility wrapper skills |",
    "| **GitHub Copilot** | `copilot-instructions.md` | `.github/` | Workflow markdown, agent markdown, and generated prompt files |",
    "",
    "## Bundle Artifacts",
    "",
    "| Artifact | Antigravity | Gemini CLI | Claude | Codex | Copilot |",
    "| --- | --- | --- | --- | --- | --- |",
    `| Agent files | ${agentCount} \`.md\` | none | ${agentCount} \`.md\` | ${agentCount} \`.md\` | ${agentCount} \`.md\` with sanitized frontmatter |`,
    `| Workflow files | ${workflowCount} \`.md\` | ${workflowCount} \`.md\` | ${workflowCount} \`.md\` | ${workflowCount} \`.md\` | ${workflowCount} \`.md\` |`,
    `| Commands or prompts | ${workflowCount} \`.toml\` | ${workflowCount} \`.toml\` | none | none | ${workflowCount} \`.prompt.md\` |`,
    `| Skill mirrors | ${skillCount} skill dirs | ${skillCount} skill dirs | ${skillCount} skill dirs | ${skillCount} skill dirs | ${skillCount} skill dirs |`,
    "| Hook templates | none | none | 3 template files | none | none |",
    "| Compatibility aliases | none | none | none | `$agent-*`, `$workflow-*` | none |",
    "",
    "## Notes",
    "",
    "- Canonical authoring stays in `workflows/skills` and `workflows/workflows/agent-environment-setup/shared`.",
    "- Platform outputs under `workflows/workflows/agent-environment-setup/platforms/*` are generated artifacts.",
    "- Codex installs workflow markdown plus compatibility wrapper skills at runtime; the generated platform bundle still includes agent adapter files.",
    "- Gemini CLI is a first-class install target, but specialist personas are embedded into workflows and `GEMINI.md` guidance rather than shipped as standalone agent files.",
    "- Antigravity remains separate from Gemini CLI because its project layout and agent execution model differ.",
    "",
  ].join("\n");
}

function buildCopilotAgentMarkdown(sharedMarkdown) {
  const normalizedMarkdown = normalizeMarkdownSkillReferences(sharedMarkdown);
  const parsed = parseFrontmatter(normalizedMarkdown);
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

function buildAntigravityCommandToml(workflow) {
  const { id, command, description } = workflow;
  const attachedSkills = buildAttachedSkillsSection(workflow, "antigravity");
  const prompt = [
    `Follow the ${command} workflow from .agent/workflows/${id}.md.`,
    "",
    "Execution contract:",
    "1. Treat route selection as already resolved by this command; do not begin with skill discovery.",
    "2. Read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order when they exist before non-trivial execution.",
    attachedSkills.trimEnd(),
    '3. Confirm the request fits the workflow\'s "When to use" section.',
    '4. Execute according to "Workflow steps" and apply "Context notes".',
    '5. Complete "Verification" checks and report concrete evidence.',
    "6. If freshness, public comparison, or explicit research needs appear, pause implementation and load `deep-research` or hand off to `@researcher` first.",
    "7. For outside evidence: repo first, official docs next, Reddit/community only as labeled secondary evidence.",
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

function buildGeminiCommandToml(workflow) {
  const { id, command, description } = workflow;
  const attachedSkills = buildAttachedSkillsSection(workflow, "gemini");
  const prompt = [
    `Follow the ${command} workflow from .gemini/workflows/${id}.md.`,
    "",
    "Execution contract:",
    "1. Treat route selection as already resolved by this command; do not begin with skill discovery.",
    "2. Read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order when they exist before non-trivial execution.",
    attachedSkills.trimEnd(),
    '3. Confirm the request fits the workflow\'s "When to use" section.',
    '4. Execute according to "Workflow steps" and apply "Context notes".',
    '5. Complete "Verification" checks and report concrete evidence.',
    "6. If freshness, public comparison, or explicit research needs appear, pause implementation and load `deep-research` or route to the researcher posture first.",
    "7. For outside evidence: repo first, official docs next, Reddit/community only as labeled secondary evidence.",
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

function buildCopilotPromptMarkdown(workflow) {
  const { id, command, description } = workflow;
  const attachedSkills = buildAttachedSkillsSection(workflow, "copilot");
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
    "2. Read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order when they exist before non-trivial execution.",
    attachedSkills.trimEnd(),
    "3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.",
    "4. Route to the workflow's primary specialist and only add supporting specialists when needed.",
    "5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.",
    "6. Return actions taken, verification evidence, and any gaps.",
    "",
  ].join("\n");
}

function buildClaudeHookReadme() {
  return [
    "# Claude Route/Research Hook Templates",
    "",
    "These files are generated by Cubis Foundry as optional Claude Code hook templates.",
    "",
    "Use them when you want Claude to reinforce two behaviors on `UserPromptSubmit`:",
    "",
    "- honor explicit `/workflow`, `@agent`, or exact skill selections before rerouting",
    "- escalate to repo-first, official-first research when freshness or public comparison matters",
    "",
    "Files:",
    "",
    "- `settings.snippet.json` — example hook configuration to copy into `.claude/settings.json` or `.claude/settings.local.json`",
    "- `route-research-guard.mjs` — hook script that reads the submitted prompt and emits a targeted `systemMessage` reminder",
    "",
    "The template is intentionally non-destructive. It does not block prompts by default; it adds context for Claude before prompt processing.",
  ].join("\n");
}

function buildClaudeHookSettingsSnippet() {
  return (
    JSON.stringify(
      {
        hooks: {
          UserPromptSubmit: [
            {
              matcher: "*",
              hooks: [
                {
                  type: "command",
                  command:
                    'node "$CLAUDE_PROJECT_DIR/.claude/hooks/route-research-guard.mjs"',
                },
              ],
            },
          ],
        },
      },
      null,
      2,
    ) + "\n"
  );
}

function buildClaudeHookScript() {
  return [
    "#!/usr/bin/env node",
    "",
    "const buffers = [];",
    "for await (const chunk of process.stdin) buffers.push(chunk);",
    'const raw = Buffer.concat(buffers).toString("utf8");',
    'let prompt = "";',
    "try {",
    '  const parsed = JSON.parse(raw || "{}");',
    '  prompt = String(parsed.prompt || parsed.userPrompt || parsed.message || "");',
    "} catch {",
    '  prompt = "";',
    "}",
    "",
    "const normalized = prompt.toLowerCase();",
    "const reminders = [];",
    "",
    'if (/(^|\\s)(\\/[-a-z0-9]+|@[a-z0-9_-]+)/i.test(prompt)) {',
    "  reminders.push(",
    '    "Explicit route detected. Honor the named workflow or agent directly unless it is invalid."', 
    "  );",
    "}",
    "",
    'if (/(^|[^a-z0-9-])(deep-research|stitch|skill-creator|frontend-design|api-design|database-design)([^a-z0-9-]|$)/i.test(normalized)) {',
    "  reminders.push(",
    '    "Named skill detected. Run skill_validate on the exact skill ID first and skip route_resolve when it validates."',
    "  );",
    "}",
    "",
    'if (/(research|latest|compare|comparison|verify|official docs|reddit|community)/i.test(normalized)) {',
    "  reminders.push(",
    '    "Research trigger detected. Inspect the repo first, use official docs as primary evidence, and treat Reddit/community sources as labeled secondary evidence."',
    "  );",
    "}",
    "",
    "const payload = reminders.length > 0",
    '  ? { continue: true, systemMessage: reminders.join(" ") }',
    "  : { continue: true };",
    "",
    "process.stdout.write(JSON.stringify(payload));",
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

function buildCodexAgentMarkdown(sharedMarkdown) {
  const parsed = parseFrontmatter(normalizeMarkdownSkillReferences(sharedMarkdown));
  if (!parsed) return sharedMarkdown;

  let body = parsed.body;
  body = body.replace(/\bsub-?agents?\b/gi, (match) => {
    if (match[0] === "S") return "Posture";
    if (match.startsWith("sub-a")) return "posture";
    return "posture";
  });
  body = body.replace(
    /[Dd]elegate\s+to\s+@([A-Za-z0-9_-]+)/g,
    (match, name) => `Adopt the ${name} posture`,
  );
  body = body.replace(/\bspawn\b/gi, (match) =>
    match[0] === "S" ? "Switch to" : "switch to",
  );

  const codexNote =
    "\n\n> **Codex note:** Prefer native Codex delegation when the host exposes it. If delegation is unavailable, switch specialist postures inline and preserve the same scope and verification contract.\n";

  return `---\n${parsed.raw}\n---\n${body.trimEnd()}${codexNote}`;
}

function buildAntigravityAgentMarkdown(sharedMarkdown) {
  const parsed = parseFrontmatter(normalizeMarkdownSkillReferences(sharedMarkdown));
  if (!parsed) return sharedMarkdown;

  let body = parsed.body;
  body = body.replace(/\bTask\s+tool\b/g, "Agent Manager");

  const agNote =
    "\n\n> **Antigravity note:** Use Agent Manager for parallel agent coordination. Agent files are stored under `.agent/agents/`.\n";

  return `---\n${parsed.raw}\n---\n${body.trimEnd()}${agNote}`;
}

function buildCodexWorkflowMarkdown(sharedMarkdown) {
  const parsed = parseFrontmatter(normalizeMarkdownSkillReferences(sharedMarkdown));
  if (!parsed) return sharedMarkdown;

  let body = parsed.body;
  body = body.replace(
    /@([A-Za-z0-9_-]+)/g,
    (match, name) => `the ${name} posture`,
  );

  const codexNote =
    "\n\n> **Codex note:** Prefer native Codex delegation when the host exposes it. Otherwise follow AGENTS.md specialist postures inline while keeping the same routing and verification contract.\n";

  return `---\n${parsed.raw}\n---\n${body.trimEnd()}${codexNote}`;
}

function buildAntigravityWorkflowMarkdown(sharedMarkdown) {
  const parsed = parseFrontmatter(normalizeMarkdownSkillReferences(sharedMarkdown));
  if (!parsed) return sharedMarkdown;

  let body = parsed.body;
  body = body.replace(
    /@([A-Za-z0-9_-]+)/g,
    (match, name) => `.agent/agents/${name}`,
  );
  body = body.replace(/\bTask\s+tool\b/g, "Agent Manager");

  const agNote =
    "\n\n> **Antigravity note:** Use Agent Manager for parallel agent coordination. Workflow files are stored under `.agent/workflows/`.\n";

  return `---\n${parsed.raw}\n---\n${body.trimEnd()}${agNote}`;
}

function buildClaudeAgentMarkdown(sharedMarkdown) {
  return normalizeMarkdownSkillReferences(sharedMarkdown);
}

function buildClaudeWorkflowMarkdown(sharedMarkdown) {
  return normalizeMarkdownSkillReferences(sharedMarkdown);
}

function buildGeminiWorkflowMarkdown(sharedMarkdown) {
  const parsed = parseFrontmatter(normalizeMarkdownSkillReferences(sharedMarkdown));
  if (!parsed) return sharedMarkdown;

  let body = parsed.body;
  body = body.replace(
    /@([A-Za-z0-9_-]+)/g,
    (match, name) => `the ${name} posture`,
  );

  const geminiNote =
    "\n\n> **Gemini note:** Commands route into workflow files under `.gemini/workflows/`. Specialists are inline postures coordinated through GEMINI.md guidance, not separate agent artifacts.\n";

  return `---\n${parsed.raw}\n---\n${body.trimEnd()}${geminiNote}`;
}

async function buildExpectedMaps({ sharedAgents, sharedWorkflows }) {
  const codexAgents = new Map();
  const antigravityAgents = new Map();
  const copilotAgents = new Map();
  const claudeAgents = new Map();
  const geminiWorkflows = new Map();
  const codexWorkflows = new Map();
  const antigravityWorkflows = new Map();
  const copilotWorkflows = new Map();
  const claudeWorkflows = new Map();
  const antigravityCommands = new Map();
  const geminiCommands = new Map();
  const copilotPrompts = new Map();
  const claudeHooks = new Map();
  const generated = new Map();
  const docs = new Map();
  const topLevelSkillIds = await listTopLevelCanonicalSkillIds();

  for (const agent of sharedAgents) {
    codexAgents.set(agent.fileName, buildCodexAgentMarkdown(agent.raw));
    antigravityAgents.set(
      agent.fileName,
      buildAntigravityAgentMarkdown(agent.raw),
    );
    claudeAgents.set(agent.fileName, buildClaudeAgentMarkdown(agent.raw));
    const transformed = buildCopilotAgentMarkdown(agent.raw);
    copilotAgents.set(agent.fileName, transformed.markdown);
  }

  generated.set(
    ROUTE_MANIFEST_FILE,
    buildRouteManifest({ sharedAgents, sharedWorkflows }),
  );
  generated.set(
    BUNDLE_MANIFEST_FILE,
    buildBundleManifest({
      sharedAgents,
      sharedWorkflows,
      topLevelSkillIds,
    }),
  );
  docs.set(
    PLATFORM_SUPPORT_MATRIX_FILE,
    buildPlatformSupportMatrixMarkdown({
      sharedAgents,
      sharedWorkflows,
      topLevelSkillIds,
    }),
  );

  for (const workflow of sharedWorkflows) {
    codexWorkflows.set(
      workflow.fileName,
      buildCodexWorkflowMarkdown(workflow.raw),
    );
    antigravityWorkflows.set(
      workflow.fileName,
      buildAntigravityWorkflowMarkdown(workflow.raw),
    );
    geminiWorkflows.set(
      workflow.fileName,
      buildGeminiWorkflowMarkdown(workflow.raw),
    );
    copilotWorkflows.set(
      workflow.fileName,
      normalizeMarkdownSkillReferences(workflow.raw),
    );
    claudeWorkflows.set(
      workflow.fileName,
      buildClaudeWorkflowMarkdown(workflow.raw),
    );

    const commandId = workflow.command
      .replace(/^\//, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    antigravityCommands.set(
      `${commandId}.toml`,
      buildAntigravityCommandToml(workflow),
    );
    geminiCommands.set(
      `${commandId}.toml`,
      buildGeminiCommandToml(workflow),
    );
    copilotPrompts.set(
      `workflow-${workflow.id}.prompt.md`,
      buildCopilotPromptMarkdown(workflow),
    );
  }

  claudeHooks.set("README.md", buildClaudeHookReadme());
  claudeHooks.set("settings.snippet.json", buildClaudeHookSettingsSnippet());
  claudeHooks.set("route-research-guard.mjs", buildClaudeHookScript());

  return {
    codexAgents,
    antigravityAgents,
    copilotAgents,
    claudeAgents,
    geminiWorkflows,
    codexWorkflows,
    antigravityWorkflows,
    copilotWorkflows,
    claudeWorkflows,
    antigravityCommands,
    geminiCommands,
    copilotPrompts,
    claudeHooks,
    generated,
    docs,
  };
}

function buildTargets(maps) {
  return [
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
      label: "claude hooks",
      dir: path.join(PLATFORM_DIRS.claude, "hooks"),
      expected: maps.claudeHooks,
      filter: (name) =>
        name === "README.md" ||
        name === "settings.snippet.json" ||
        name === "route-research-guard.mjs",
    },
    {
      label: "gemini workflows",
      dir: path.join(PLATFORM_DIRS.gemini, "workflows"),
      expected: maps.geminiWorkflows,
      filter: (name) => name.endsWith(".md"),
    },
    {
      label: "gemini commands",
      dir: path.join(PLATFORM_DIRS.gemini, "commands"),
      expected: maps.geminiCommands,
      filter: (name) => name.endsWith(".toml"),
    },
    {
      label: "generated route manifest",
      dir: GENERATED_DIR,
      expected: new Map(
        [...maps.generated.entries()].filter(
          ([name]) => name === ROUTE_MANIFEST_FILE,
        ),
      ),
      filter: (name) => name === ROUTE_MANIFEST_FILE,
    },
    {
      label: "bundle manifest",
      dir: BUNDLE_ROOT,
      expected: new Map(
        [...maps.generated.entries()].filter(
          ([name]) => name === BUNDLE_MANIFEST_FILE,
        ),
      ),
      filter: (name) => name === BUNDLE_MANIFEST_FILE,
    },
    {
      label: "platform support matrix",
      dir: DOCS_DIR,
      expected: maps.docs,
      filter: (name) => name === PLATFORM_SUPPORT_MATRIX_FILE,
    },
  ];
}

function formatDriftMessage(drift) {
  return drift
    .map((item) => {
      const lines = [`Drift detected for ${item.label}:`];
      if (item.diff.missing.length > 0) {
        lines.push(`- missing: ${item.diff.missing.join(", ")}`);
      }
      if (item.diff.changed.length > 0) {
        lines.push(`- changed: ${item.diff.changed.join(", ")}`);
      }
      if (item.diff.extra.length > 0) {
        lines.push(`- extra: ${item.diff.extra.join(", ")}`);
      }
      return lines.join("\n");
    })
    .join("\n");
}

export async function checkPlatformAssets() {
  const sharedAgents = await loadSharedFiles(SHARED_AGENTS_DIR);
  const sharedWorkflows = await loadSharedFiles(SHARED_WORKFLOWS_DIR, [
    "When to use",
    "Workflow steps",
    "Context notes",
    "Verification",
  ]);

  const maps = await buildExpectedMaps({ sharedAgents, sharedWorkflows });
  const targets = buildTargets(maps);
  const drift = [];
  for (const target of targets) {
    const actual = await readFileMap(target.dir, target.filter);
    const diff = diffSet(target.expected, actual);
    if (diff.missing.length || diff.changed.length || diff.extra.length) {
      drift.push({ label: target.label, diff });
    }
  }

  return {
    sharedAgents: sharedAgents.length,
    sharedWorkflows: sharedWorkflows.length,
    drift,
  };
}

export async function run({ checkOnly = false } = {}) {
  const checkResult = await checkPlatformAssets();

  if (checkOnly) {
    if (checkResult.drift.length > 0) {
      console.error(formatDriftMessage(checkResult.drift));
      process.exit(1);
    }

    console.log(
      JSON.stringify(
        {
          mode: "check",
          sharedAgents: checkResult.sharedAgents,
          sharedWorkflows: checkResult.sharedWorkflows,
          status: "ok",
        },
        null,
        2,
      ),
    );
    return;
  }

  const sharedAgents = await loadSharedFiles(SHARED_AGENTS_DIR);
  const sharedWorkflows = await loadSharedFiles(SHARED_WORKFLOWS_DIR, [
    "When to use",
    "Workflow steps",
    "Context notes",
    "Verification",
  ]);
  const maps = await buildExpectedMaps({ sharedAgents, sharedWorkflows });
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
      rootDir: path.join(PLATFORM_DIRS.claude, "hooks"),
      fileMap: maps.claudeHooks,
      cleanMdOnly: false,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.gemini, "workflows"),
      fileMap: maps.geminiWorkflows,
      cleanMdOnly: true,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.gemini, "commands"),
      fileMap: maps.geminiCommands,
      cleanMdOnly: false,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: GENERATED_DIR,
      fileMap: new Map(
        [...maps.generated.entries()].filter(
          ([name]) => name === ROUTE_MANIFEST_FILE,
        ),
      ),
      cleanMdOnly: false,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: BUNDLE_ROOT,
      fileMap: new Map(
        [...maps.generated.entries()].filter(
          ([name]) => name === BUNDLE_MANIFEST_FILE,
        ),
      ),
      cleanMdOnly: false,
    })),
  );
  for (const [name, content] of maps.docs.entries()) {
    const target = path.join(DOCS_DIR, name);
    await writeFileNormalized(target, content);
    written.push(target);
  }

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
const isEntrypoint =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  run({ checkOnly }).catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
