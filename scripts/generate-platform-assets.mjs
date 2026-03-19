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
import {
  AUDITED_REFERENCES,
  ORCHESTRATION_SUBTYPES,
  PATTERN_REGISTRY,
  buildParityDocs,
  buildPlatformCapabilityContracts,
  buildUpstreamCapabilityAudit,
} from "./lib/platform-parity.mjs";
import {
  MANAGED_PARITY_DOC_FILES,
  PATTERN_REGISTRY_FILE,
  PLATFORM_CAPABILITIES_FILE,
  UPSTREAM_CAPABILITY_AUDIT_FILE,
  buildBlockingSummary,
  buildParityArtifactPointers,
} from "./lib/parity-contract.mjs";

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
const ROUTE_MANIFEST_SCHEMA_FILE = "cubis-foundry-route-manifest-v2.schema.json";
const BUNDLE_MANIFEST_FILE = "manifest.json";
const CANONICAL_SKILLS_DIR = path.join(ROOT, "workflows", "skills");
const DOCS_DIR = path.join(ROOT, "docs");
const PATTERN_REGISTRY_SCHEMA_FILE =
  "cubis-foundry-pattern-registry-v1.schema.json";
const PLATFORM_CAPABILITIES_SCHEMA_FILE =
  "cubis-foundry-platform-capabilities-v1.schema.json";
const UPSTREAM_CAPABILITY_AUDIT_SCHEMA_FILE =
  "cubis-foundry-upstream-capability-audit-v1.schema.json";

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

function localJsonSchemaRef(fileName) {
  return `./${fileName}`;
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
  return frontmatter.replace(
    /^(skills\s*:\s*)(.+)$/m,
    (match, prefix, value) => {
      const normalized = normalizeSkillIds(parseInlineArray(value));
      return `${prefix}${normalized.join(", ")}`;
    },
  );
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
    primarySkills: normalizeSkillIds(
      parseInlineCodeList(primaryMatch?.[1] || ""),
    ),
    supportingSkills: normalizeSkillIds(
      parseInlineCodeList(supportingMatch?.[1] || ""),
    ),
  };
}

const PLATFORM_SKILL_HINT_ROOTS = {
  antigravity: ".agents/skills",
  codex: ".agents/skills",
  copilot: ".github/skills",
  claude: ".claude/skills",
  gemini: ".agents/skills",
};

function buildAttachedSkillsSection(skillIds, platform) {
  const attachedSkills = unique(skillIds.filter(Boolean));
  if (attachedSkills.length === 0) return "";

  const skillRoot = PLATFORM_SKILL_HINT_ROOTS[platform];
  const pathHints = skillRoot
    ? attachedSkills
        .slice(0, 8)
        .map((skillId) => `${skillRoot}/${skillId}/SKILL.md`)
    : [];

  return [
    "Attached skills:",
    `- Load these exact skill IDs first: ${attachedSkills.map((skillId) => `\`${skillId}\``).join(", ")}.`,
    pathHints.length > 0
      ? `- Local skill file hints if installed: ${pathHints.map((hint) => `\`${hint}\``).join(", ")}.`
      : "- Local skill file hints if installed: none; use MCP-backed skill loading when available.",
    "- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.",
    "",
  ].join("\n");
}

function buildWorkflowAttachedSkillsSection(workflow, platform) {
  const { primarySkills, supportingSkills } = parseWorkflowSkillRouting(
    workflow.body,
  );
  return buildAttachedSkillsSection(
    [...primarySkills, ...supportingSkills],
    platform,
  );
}

function buildAgentAttachedSkillsSection(agent, platform) {
  return buildAttachedSkillsSection(
    normalizeSkillIds(getArray(agent.frontmatter, "skills")),
    platform,
  );
}

function normalizeRouteCommandId(command) {
  return String(command || "")
    .replace(/^\//, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
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
    const commandId = normalizeRouteCommandId(workflow.command);

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
          target: "skill",
          skillDir: workflow.id,
        },
        copilot: {
          target: "prompt",
          promptFile: `${workflow.id}.prompt.md`,
        },
        antigravity: {
          target: "command",
          commandFile: `${commandId}.toml`,
        },
        claude: {
          target: "skill",
          skillDir: workflow.id,
        },
        gemini: {
          target: "command",
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
          target: "agent",
          agentFile: `${agentId}.toml`,
        },
        copilot: {
          target: "agent",
          agentFile: agent.fileName,
        },
        antigravity: {
          target: "command",
          commandFile: `agent-${agentId}.toml`,
        },
        claude: {
          target: "agent",
          agentFile: agent.fileName,
        },
        gemini: {
          target: "command",
          commandFile: `agent-${agentId}.toml`,
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
        $schema: localJsonSchemaRef(ROUTE_MANIFEST_SCHEMA_FILE),
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

function buildRouteManifestSchema() {
  return `${JSON.stringify(
    {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Cubis Foundry Route Manifest",
      description:
        "Generated routing manifest for shared workflows and agents.",
      type: "object",
      required: [
        "$schema",
        "generatedAt",
        "contentHash",
        "summary",
        "routes",
      ],
      properties: {
        $schema: { type: "string" },
        generatedAt: { type: "string", format: "date-time" },
        contentHash: { type: "string" },
        summary: {
          type: "object",
          required: ["totalRoutes", "workflows", "agents"],
          properties: {
            totalRoutes: { type: "integer", minimum: 0 },
            workflows: { type: "integer", minimum: 0 },
            agents: { type: "integer", minimum: 0 },
          },
          additionalProperties: false,
        },
        routes: {
          type: "array",
          items: {
            type: "object",
            required: [
              "kind",
              "id",
              "command",
              "displayName",
              "description",
              "triggers",
              "primaryAgent",
              "supportingAgents",
              "primarySkills",
              "supportingSkills",
              "artifacts",
            ],
            properties: {
              kind: { enum: ["workflow", "agent"] },
              id: { type: "string" },
              command: { type: ["string", "null"] },
              displayName: { type: "string" },
              description: { type: "string" },
              triggers: { type: "array", items: { type: "string" } },
              primaryAgent: { type: "string" },
              supportingAgents: {
                type: "array",
                items: { type: "string" },
              },
              primarySkills: {
                type: "array",
                items: { type: "string" },
              },
              supportingSkills: {
                type: "array",
                items: { type: "string" },
              },
              artifacts: {
                type: "object",
                properties: {
                  codex: { $ref: "#/definitions/platformArtifacts" },
                  copilot: { $ref: "#/definitions/platformArtifacts" },
                  antigravity: { $ref: "#/definitions/platformArtifacts" },
                  claude: { $ref: "#/definitions/platformArtifacts" },
                  gemini: { $ref: "#/definitions/platformArtifacts" },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
        },
      },
      definitions: {
        platformArtifacts: {
          type: "object",
          properties: {
            skillDir: { type: "string" },
            workflowFile: { type: "string" },
            promptFile: { type: "string" },
            commandFile: { type: "string" },
            agentFile: { type: "string" },
            compatibilityAlias: { type: "string" },
            target: { type: "string" },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    null,
    2,
  )}\n`;
}

function buildPatternRegistrySchema() {
  return `${JSON.stringify(
    {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Cubis Foundry Pattern Registry",
      description: "Generated pattern registry for cross-platform routing.",
      type: "object",
      required: ["$schema", "generatedAt", "auditedReferences", "patterns"],
      properties: {
        $schema: { type: "string" },
        generatedAt: { type: "string", format: "date-time" },
        auditedReferences: { type: "array", items: { type: "object" } },
        orchestrationSubtypes: {
          type: "array",
          items: { type: "object" },
        },
        patterns: { type: "array", items: { type: "object" } },
      },
      additionalProperties: false,
    },
    null,
    2,
  )}\n`;
}

function buildPlatformCapabilitiesSchema() {
  return `${JSON.stringify(
    {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Cubis Foundry Platform Capabilities",
      description:
        "Generated platform capability contracts for supported runtimes.",
      type: "object",
      required: ["$schema", "generatedAt", "platforms"],
      properties: {
        $schema: { type: "string" },
        generatedAt: { type: "string", format: "date-time" },
        platforms: {
          type: "object",
          additionalProperties: { type: "object" },
        },
      },
      additionalProperties: false,
    },
    null,
    2,
  )}\n`;
}

function buildUpstreamCapabilityAuditSchema() {
  return `${JSON.stringify(
    {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Cubis Foundry Upstream Capability Audit",
      description:
        "Generated audit ledger for upstream capability references used in parity mapping.",
      type: "object",
      required: ["$schema", "generatedAt", "audits"],
      properties: {
        $schema: { type: "string" },
        generatedAt: { type: "string", format: "date-time" },
        audits: { type: "array", items: { type: "object" } },
      },
      additionalProperties: false,
    },
    null,
    2,
  )}\n`;
}

async function listTopLevelCanonicalSkillIds() {
  const entries = await fs.readdir(CANONICAL_SKILLS_DIR, {
    withFileTypes: true,
  });
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
  platformCapabilityContracts,
}) {
  const workflowSkillDirs = sharedWorkflows
    .map((workflow) => workflow.id)
    .sort((a, b) => a.localeCompare(b));
  const codexAgentFiles = sharedAgents
    .map((agent) => `${normalizeMarkdownId(agent.fileName)}.toml`)
    .sort((a, b) => a.localeCompare(b));
  const markdownAgentFiles = sharedAgents
    .map((agent) => agent.fileName)
    .sort((a, b) => a.localeCompare(b));
  const workflowCommandFiles = sharedWorkflows
    .map((workflow) => `${normalizeRouteCommandId(workflow.command)}.toml`)
    .sort((a, b) => a.localeCompare(b));
  const agentCommandFiles = sharedAgents
    .map((agent) => `agent-${normalizeMarkdownId(agent.fileName)}.toml`)
    .sort((a, b) => a.localeCompare(b));
  const promptFiles = sharedWorkflows
    .map((workflow) => `${workflow.id}.prompt.md`)
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
      description: "Usage guide for the Claude route/research hook templates.",
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
  const blockingSummary = buildBlockingSummary(platformCapabilityContracts);

  return (
    JSON.stringify(
      {
        id: "agent-environment-setup",
        version: "1.7.0",
        description:
          "Workflow-first AI agent environment setup for Antigravity, Codex, Copilot, Claude Code, and Gemini CLI.",
        parity: {
          auditedReferences: AUDITED_REFERENCES,
          orchestrationSubtypes: ORCHESTRATION_SUBTYPES,
          artifacts: buildParityArtifactPointers(),
          summary: {
            totalPatterns: PATTERN_REGISTRY.length,
            totalPlatforms: Object.keys(platformCapabilityContracts).length,
            blockingSummary,
          },
        },
        platforms: {
          antigravity: {
            workflows: [],
            agents: [],
            skills: topLevelSkillIds,
            generatedSkills: [],
            rulesTemplate: "platforms/antigravity/rules/GEMINI.md",
            hooks: defaultHooks,
            commands: [...workflowCommandFiles, ...agentCommandFiles],
          },
          codex: {
            workflows: [],
            agents: codexAgentFiles,
            skills: topLevelSkillIds,
            generatedSkills: workflowSkillDirs,
            rulesTemplate: "platforms/codex/rules/AGENTS.md",
            hooks: defaultHooks,
          },
          copilot: {
            workflows: [],
            agents: markdownAgentFiles,
            skills: topLevelSkillIds,
            generatedSkills: [],
            rulesTemplate: "platforms/copilot/rules/copilot-instructions.md",
            hooks: defaultHooks,
            prompts: promptFiles,
          },
          claude: {
            workflows: [],
            agents: markdownAgentFiles,
            skills: topLevelSkillIds,
            generatedSkills: workflowSkillDirs,
            rulesTemplate: "platforms/claude/rules/CLAUDE.md",
            hooks: claudeHooks,
          },
          gemini: {
            workflows: [],
            agents: [],
            skills: [],
            generatedSkills: [],
            rulesTemplate: "platforms/gemini/rules/GEMINI.md",
            hooks: defaultHooks,
            commands: [...workflowCommandFiles, ...agentCommandFiles],
          },
        },
      },
      null,
      2,
    ) + "\n"
  );
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

function buildSkillMarkdown({
  id,
  title,
  description,
  body,
  platformLabel,
  command = null,
}) {
  return [
    "---",
    `name: ${id}`,
    `description: "${String(description || "").replace(/"/g, '\\"')}"`,
    "license: MIT",
    "metadata:",
    "  author: cubis-foundry",
    '  route-kind: "workflow"',
    `  route-id: "${id}"`,
    platformLabel ? `  platform: "${platformLabel}"` : null,
    command ? `  command: "${command}"` : null,
    `compatibility: ${platformLabel}`,
    "---",
    "",
    `# ${title}`,
    "",
    String(body || "").trim(),
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

function stripLeadingMarkdownTitle(markdown) {
  return String(markdown || "")
    .trimStart()
    .replace(/^#\s+.+\r?\n(?:\r?\n)?/, "")
    .trim();
}

function extractLeadingMarkdownTitle(markdown) {
  const match = String(markdown || "")
    .trimStart()
    .match(/^#\s+(.+)\r?\n/);
  return match ? match[1].trim() : null;
}

// Codex agent-specific model routing, reasoning effort, and sandbox mode.
// Models: gpt-5.4 (deep reasoning) and gpt-5.4-mini (fast scanning).
// Sandbox: read-only for agents without Write/Edit tools, workspace-write otherwise.
const CODEX_AGENT_CONFIG = {
  orchestrator: {
    model: "gpt-5.4",
    effort: "high",
    sandbox: "workspace-write",
  },
  explorer: { model: "gpt-5.4-mini", effort: "medium", sandbox: "read-only" },
  planner: { model: "gpt-5.4", effort: "high", sandbox: "read-only" },
  implementer: { model: "gpt-5.4", effort: "high", sandbox: "workspace-write" },
  reviewer: { model: "gpt-5.4", effort: "medium", sandbox: "read-only" },
  debugger: { model: "gpt-5.4", effort: "high", sandbox: "workspace-write" },
  tester: { model: "gpt-5.4", effort: "medium", sandbox: "workspace-write" },
  "security-reviewer": {
    model: "gpt-5.4",
    effort: "high",
    sandbox: "read-only",
  },
  "docs-writer": {
    model: "gpt-5.4-mini",
    effort: "medium",
    sandbox: "workspace-write",
  },
  devops: { model: "gpt-5.4", effort: "medium", sandbox: "workspace-write" },
  "database-specialist": {
    model: "gpt-5.4",
    effort: "high",
    sandbox: "workspace-write",
  },
  "frontend-specialist": {
    model: "gpt-5.4",
    effort: "medium",
    sandbox: "workspace-write",
  },
};

function buildCodexAgentToml(agent) {
  const parsed = parseFrontmatter(normalizeMarkdownSkillReferences(agent.raw));
  if (!parsed) {
    throw new Error(`Shared agent is missing frontmatter: ${agent.fileName}`);
  }

  const name = getScalar(parsed.raw, "name") || agent.id;
  const description = getScalar(parsed.raw, "description") || "";
  const codexCfg = CODEX_AGENT_CONFIG[agent.id];
  const lines = [
    `name = "${escapeTomlBasicString(name)}"`,
    `description = "${escapeTomlBasicString(description)}"`,
  ];
  if (codexCfg) {
    lines.push(`model = "${codexCfg.model}"`);
    lines.push(`model_reasoning_effort = "${codexCfg.effort}"`);
    lines.push(`sandbox_mode = "${codexCfg.sandbox}"`);
  } else {
    // Fallback: use shared model if no explicit Codex config
    const model = getScalar(parsed.raw, "model");
    if (model && model !== "inherit") {
      lines.push(`model = "${escapeTomlBasicString(model)}"`);
    }
  }
  lines.push('developer_instructions = """');
  lines.push(parsed.body.trim());
  lines.push('"""');
  lines.push("");
  return lines.join("\n");
}

function buildGeneratedWorkflowSkill(workflow, platformLabel) {
  const normalizedBody = stripLeadingMarkdownTitle(workflow.body);
  return buildSkillMarkdown({
    id: workflow.id,
    title: extractLeadingMarkdownTitle(workflow.body) || `${workflow.id} Workflow`,
    description: workflow.description,
    body: normalizedBody,
    platformLabel,
    command: workflow.command,
  });
}

function buildWorkflowExecutionPrompt(workflow, platform) {
  const { id, command, description } = workflow;
  const attachedSkills = buildWorkflowAttachedSkillsSection(workflow, platform);
  const docReadLine =
    id === "architecture"
      ? "2. Read `docs/foundation/PRODUCT.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution."
      : "2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.";
  return [
    `Execute the native projection of the ${command} workflow.`,
    "",
    description,
    "",
    "Execution contract:",
    "1. Treat route selection as already resolved by this command; do not begin with skill discovery.",
    docReadLine,
    attachedSkills.trimEnd(),
    '3. Confirm the request fits the workflow\'s "When to use" section before acting.',
    '4. Execute according to "Workflow steps" and apply "Context notes".',
    '5. Complete "Verification" checks and report concrete evidence.',
    "6. If freshness, public comparison, or explicit research needs appear, pause implementation and load `deep-research` or route to research first.",
    "7. For outside evidence: repo first, official docs next, Reddit/community only as labeled secondary evidence.",
    "",
    "Workflow source:",
    workflow.body.trim(),
    "",
    "If command arguments are provided, treat them as additional user context.",
  ].join("\n");
}

function buildAgentExecutionPrompt(agent, platform) {
  const agentId = normalizeMarkdownId(agent.fileName);
  const attachedSkills = buildAgentAttachedSkillsSection(agent, platform);
  const description = getScalar(agent.frontmatter, "description") || agentId;
  return [
    `Execute the native projection of the @${agentId} specialist route.`,
    "",
    description,
    "",
    "Execution contract:",
    "1. Treat route selection as already resolved by this command; do not begin with skill discovery.",
    "2. Read `docs/foundation/MEMORY.md` first when it exists, then load deeper foundation docs only when needed.",
    attachedSkills.trimEnd(),
    "3. Stay within the specialist scope and escalate to a broader workflow when the task crosses domains.",
    "4. Run focused verification for the changes or analysis you perform.",
    "5. For outside evidence: repo first, official docs next, Reddit/community only as labeled secondary evidence.",
    "",
    "Specialist source:",
    agent.body.trim(),
    "",
    "If command arguments are provided, treat them as additional user context.",
  ].join("\n");
}

function buildAntigravityCommandToml(route) {
  const prompt =
    route.kind === "workflow"
      ? buildWorkflowExecutionPrompt(route, "antigravity")
      : buildAgentExecutionPrompt(route, "antigravity");

  return [
    `description = "${escapeTomlBasicString(route.description)}"`,
    "prompt = '''",
    prompt,
    "'''",
    "",
  ].join("\n");
}

function buildGeminiCommandToml(route) {
  const prompt =
    route.kind === "workflow"
      ? buildWorkflowExecutionPrompt(route, "gemini")
      : buildAgentExecutionPrompt(route, "gemini");

  return [
    `description = "${escapeTomlBasicString(route.description)}"`,
    "prompt = '''",
    prompt,
    "'''",
    "",
  ].join("\n");
}

function buildCopilotPromptMarkdown(workflow) {
  const { command, description } = workflow;
  const attachedSkills = buildWorkflowAttachedSkillsSection(
    workflow,
    "copilot",
  );
  const docReadLine =
    workflow.id === "architecture"
      ? "2. Read `docs/foundation/PRODUCT.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution."
      : "2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.";
  const prompt = [
    `# Workflow Prompt: ${command}`,
    "",
    description,
    "",
    "Execution contract:",
    "1. Treat route selection as already resolved by this command; do not begin with skill discovery.",
    docReadLine,
    attachedSkills.trimEnd(),
    "3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.",
    "4. Route to the workflow's primary specialist and only add supporting specialists when needed.",
    "5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.",
    "6. Return actions taken, verification evidence, and any gaps.",
    "",
    "Workflow source:",
    workflow.body.trim(),
    "",
  ].join("\n");
  return prompt;
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
    "if (/(^|\\s)(\\/[-a-z0-9]+|@[a-z0-9_-]+)/i.test(prompt)) {",
    "  reminders.push(",
    '    "Explicit route detected. Honor the named workflow or agent directly unless it is invalid."',
    "  );",
    "}",
    "",
    "if (/(^|[^a-z0-9-])(deep-research|stitch|skill-creator|frontend-design|api-design|database-design)([^a-z0-9-]|$)/i.test(normalized)) {",
    "  reminders.push(",
    '    "Named skill detected. Run skill_validate on the exact skill ID first and skip route_resolve when it validates."',
    "  );",
    "}",
    "",
    "if (/(research|latest|compare|comparison|verify|official docs|reddit|community)/i.test(normalized)) {",
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

async function removeStaleManagedParityDocs({ docsDir, activeDocFiles }) {
  for (const fileName of MANAGED_PARITY_DOC_FILES) {
    if (activeDocFiles.has(fileName)) continue;
    const target = path.join(docsDir, fileName);
    if (!(await pathExists(target))) continue;
    await fs.rm(target, { force: true });
  }
}

async function applyOutputMap({ rootDir, fileMap }) {
  if (await pathExists(rootDir)) {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
  await ensureDir(rootDir);
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

async function readFileMap(dir, filter = null, relativeDir = "") {
  const map = new Map();
  if (!(await pathExists(dir))) return map;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const relativePath = relativeDir
      ? `${relativeDir}/${entry.name}`
      : entry.name;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await readFileMap(fullPath, filter, relativePath);
      for (const [nestedPath, content] of nested.entries()) {
        map.set(nestedPath, content);
      }
      continue;
    }
    if (!entry.isFile()) continue;
    if (filter && !filter(relativePath)) continue;
    const content = (await fs.readFile(fullPath, "utf8")).replace(
      /\r\n/g,
      "\n",
    );
    map.set(relativePath, content);
  }
  return map;
}

function buildClaudeAgentMarkdown(sharedMarkdown) {
  return normalizeMarkdownSkillReferences(sharedMarkdown);
}

async function buildExpectedMaps({ sharedAgents, sharedWorkflows }) {
  const codexAgents = new Map();
  const codexGeneratedSkills = new Map();
  const codexLegacyWorkflows = new Map();
  const antigravityAgents = new Map();
  const antigravityWorkflows = new Map();
  const copilotAgents = new Map();
  const copilotWorkflows = new Map();
  const claudeAgents = new Map();
  const claudeGeneratedSkills = new Map();
  const claudeWorkflows = new Map();
  const geminiWorkflows = new Map();
  const antigravityCommands = new Map();
  const geminiCommands = new Map();
  const copilotPrompts = new Map();
  const claudeHooks = new Map();
  const generated = new Map();
  const docs = new Map();
  const topLevelSkillIds = await listTopLevelCanonicalSkillIds();
  const platformCapabilityContracts = buildPlatformCapabilityContracts();
  const upstreamCapabilityAudit = buildUpstreamCapabilityAudit();
  const parityDocs = buildParityDocs(platformCapabilityContracts);

  for (const agent of sharedAgents) {
    const agentId = normalizeMarkdownId(agent.fileName);
    codexAgents.set(`${agentId}.toml`, buildCodexAgentToml(agent));
    claudeAgents.set(agent.fileName, buildClaudeAgentMarkdown(agent.raw));
    antigravityCommands.set(
      `agent-${agentId}.toml`,
      buildAntigravityCommandToml({
        ...agent,
        kind: "agent",
        id: agentId,
        description: getScalar(agent.frontmatter, "description") || agentId,
      }),
    );
    geminiCommands.set(
      `agent-${agentId}.toml`,
      buildGeminiCommandToml({
        ...agent,
        kind: "agent",
        id: agentId,
        description: getScalar(agent.frontmatter, "description") || agentId,
      }),
    );
    const transformed = buildCopilotAgentMarkdown(agent.raw);
    copilotAgents.set(agent.fileName, transformed.markdown);
  }

  generated.set(
    ROUTE_MANIFEST_FILE,
    buildRouteManifest({ sharedAgents, sharedWorkflows }),
  );
  generated.set(ROUTE_MANIFEST_SCHEMA_FILE, buildRouteManifestSchema());
  generated.set(PATTERN_REGISTRY_SCHEMA_FILE, buildPatternRegistrySchema());
  generated.set(
    PLATFORM_CAPABILITIES_SCHEMA_FILE,
    buildPlatformCapabilitiesSchema(),
  );
  generated.set(
    UPSTREAM_CAPABILITY_AUDIT_SCHEMA_FILE,
    buildUpstreamCapabilityAuditSchema(),
  );
  generated.set(
    PATTERN_REGISTRY_FILE,
    `${JSON.stringify(
      {
        $schema: localJsonSchemaRef(PATTERN_REGISTRY_SCHEMA_FILE),
        generatedAt: new Date(0).toISOString(),
        auditedReferences: AUDITED_REFERENCES,
        orchestrationSubtypes: ORCHESTRATION_SUBTYPES,
        patterns: PATTERN_REGISTRY,
      },
      null,
      2,
    )}\n`,
  );
  generated.set(
    PLATFORM_CAPABILITIES_FILE,
    `${JSON.stringify(
      {
        $schema: localJsonSchemaRef(PLATFORM_CAPABILITIES_SCHEMA_FILE),
        generatedAt: new Date(0).toISOString(),
        platforms: platformCapabilityContracts,
      },
      null,
      2,
    )}\n`,
  );
  generated.set(
    UPSTREAM_CAPABILITY_AUDIT_FILE,
    `${JSON.stringify(
      {
        ...upstreamCapabilityAudit,
        $schema: localJsonSchemaRef(UPSTREAM_CAPABILITY_AUDIT_SCHEMA_FILE),
      },
      null,
      2,
    )}\n`,
  );
  generated.set(
    BUNDLE_MANIFEST_FILE,
    buildBundleManifest({
      sharedAgents,
      sharedWorkflows,
      topLevelSkillIds,
      platformCapabilityContracts,
    }),
  );
  for (const [name, content] of parityDocs.entries()) {
    docs.set(name, content);
  }

  for (const workflow of sharedWorkflows) {
    codexGeneratedSkills.set(
      `${workflow.id}/SKILL.md`,
      buildGeneratedWorkflowSkill(workflow, "Codex"),
    );
    claudeGeneratedSkills.set(
      `${workflow.id}/SKILL.md`,
      buildGeneratedWorkflowSkill(workflow, "Claude Code"),
    );

    const commandId = normalizeRouteCommandId(workflow.command);
    antigravityCommands.set(
      `${commandId}.toml`,
      buildAntigravityCommandToml({ ...workflow, kind: "workflow" }),
    );
    geminiCommands.set(
      `${commandId}.toml`,
      buildGeminiCommandToml({ ...workflow, kind: "workflow" }),
    );
    copilotPrompts.set(
      `${workflow.id}.prompt.md`,
      buildCopilotPromptMarkdown(workflow),
    );
  }

  claudeHooks.set("README.md", buildClaudeHookReadme());
  claudeHooks.set("settings.snippet.json", buildClaudeHookSettingsSnippet());
  claudeHooks.set("route-research-guard.mjs", buildClaudeHookScript());

  return {
    codexAgents,
    codexGeneratedSkills,
    codexLegacyWorkflows,
    antigravityAgents,
    antigravityWorkflows,
    copilotAgents,
    copilotWorkflows,
    claudeAgents,
    claudeGeneratedSkills,
    claudeWorkflows,
    geminiWorkflows,
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
      filter: (name) => name.endsWith(".toml"),
    },
    {
      label: "codex generated skills",
      dir: path.join(PLATFORM_DIRS.codex, "generated-skills"),
      expected: maps.codexGeneratedSkills,
      filter: (name) => name.endsWith("SKILL.md"),
    },
    {
      label: "codex legacy workflows",
      dir: path.join(PLATFORM_DIRS.codex, "workflows"),
      expected: maps.codexLegacyWorkflows,
      filter: () => true,
    },
    {
      label: "antigravity agents",
      dir: path.join(PLATFORM_DIRS.antigravity, "agents"),
      expected: maps.antigravityAgents,
      filter: () => true,
    },
    {
      label: "antigravity workflows",
      dir: path.join(PLATFORM_DIRS.antigravity, "workflows"),
      expected: maps.antigravityWorkflows,
      filter: () => true,
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
      filter: () => true,
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
      label: "claude generated skills",
      dir: path.join(PLATFORM_DIRS.claude, "generated-skills"),
      expected: maps.claudeGeneratedSkills,
      filter: (name) => name.endsWith("SKILL.md"),
    },
    {
      label: "claude workflows",
      dir: path.join(PLATFORM_DIRS.claude, "workflows"),
      expected: maps.claudeWorkflows,
      filter: () => true,
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
      filter: () => true,
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
          ([name]) =>
            name === ROUTE_MANIFEST_FILE ||
            name === ROUTE_MANIFEST_SCHEMA_FILE ||
            name === PATTERN_REGISTRY_FILE ||
            name === PATTERN_REGISTRY_SCHEMA_FILE ||
            name === PLATFORM_CAPABILITIES_FILE ||
            name === PLATFORM_CAPABILITIES_SCHEMA_FILE ||
            name === UPSTREAM_CAPABILITY_AUDIT_FILE ||
            name === UPSTREAM_CAPABILITY_AUDIT_SCHEMA_FILE,
        ),
      ),
      filter: (name) =>
        name === ROUTE_MANIFEST_FILE ||
        name === ROUTE_MANIFEST_SCHEMA_FILE ||
        name === PATTERN_REGISTRY_FILE ||
        name === PATTERN_REGISTRY_SCHEMA_FILE ||
        name === PLATFORM_CAPABILITIES_FILE ||
        name === PLATFORM_CAPABILITIES_SCHEMA_FILE ||
        name === UPSTREAM_CAPABILITY_AUDIT_FILE ||
        name === UPSTREAM_CAPABILITY_AUDIT_SCHEMA_FILE,
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
      label: "parity docs",
      dir: DOCS_DIR,
      expected: maps.docs,
      filter: (name) => maps.docs.has(name),
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
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.codex, "generated-skills"),
      fileMap: maps.codexGeneratedSkills,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.codex, "workflows"),
      fileMap: maps.codexLegacyWorkflows,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.antigravity, "agents"),
      fileMap: maps.antigravityAgents,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.antigravity, "workflows"),
      fileMap: maps.antigravityWorkflows,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.antigravity, "commands"),
      fileMap: maps.antigravityCommands,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.copilot, "agents"),
      fileMap: maps.copilotAgents,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.copilot, "workflows"),
      fileMap: maps.copilotWorkflows,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.copilot, "prompts"),
      fileMap: maps.copilotPrompts,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.claude, "agents"),
      fileMap: maps.claudeAgents,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.claude, "generated-skills"),
      fileMap: maps.claudeGeneratedSkills,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.claude, "workflows"),
      fileMap: maps.claudeWorkflows,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.claude, "hooks"),
      fileMap: maps.claudeHooks,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.gemini, "workflows"),
      fileMap: maps.geminiWorkflows,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: path.join(PLATFORM_DIRS.gemini, "commands"),
      fileMap: maps.geminiCommands,
    })),
  );
  written.push(
    ...(await applyOutputMap({
      rootDir: GENERATED_DIR,
      fileMap: new Map(
        [...maps.generated.entries()].filter(
          ([name]) =>
            name === ROUTE_MANIFEST_FILE ||
            name === ROUTE_MANIFEST_SCHEMA_FILE ||
            name === PATTERN_REGISTRY_FILE ||
            name === PATTERN_REGISTRY_SCHEMA_FILE ||
            name === PLATFORM_CAPABILITIES_FILE ||
            name === PLATFORM_CAPABILITIES_SCHEMA_FILE ||
            name === UPSTREAM_CAPABILITY_AUDIT_FILE ||
            name === UPSTREAM_CAPABILITY_AUDIT_SCHEMA_FILE,
        ),
      ),
    })),
  );
  for (const [name, content] of maps.generated.entries()) {
    if (name !== BUNDLE_MANIFEST_FILE) continue;
    const target = path.join(BUNDLE_ROOT, name);
    await writeFileNormalized(target, content);
    written.push(target);
  }
  await removeStaleManagedParityDocs({
    docsDir: DOCS_DIR,
    activeDocFiles: new Set(maps.docs.keys()),
  });
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
