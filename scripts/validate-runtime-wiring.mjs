#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import { normalizeSkillId } from "./lib/legacy-skill-map.mjs";

const ROOT = process.cwd();
const BUNDLE_ROOT = path.join(
  ROOT,
  "workflows",
  "workflows",
  "agent-environment-setup",
);
const ROUTE_MANIFEST_PATH = path.join(
  BUNDLE_ROOT,
  "generated",
  "route-manifest.json",
);
const CANONICAL_SKILLS_ROOT = path.join(ROOT, "workflows", "skills");

const PLATFORM_ROOTS = {
  codex: path.join(BUNDLE_ROOT, "platforms", "codex"),
  copilot: path.join(BUNDLE_ROOT, "platforms", "copilot"),
  antigravity: path.join(BUNDLE_ROOT, "platforms", "antigravity"),
  claude: path.join(BUNDLE_ROOT, "platforms", "claude"),
  gemini: path.join(BUNDLE_ROOT, "platforms", "gemini"),
};

const REQUIRED_WORKFLOW_SECTIONS = [
  "When to use",
  "Routing",
  "Skill Routing",
  "Workflow steps",
  "Context notes",
  "Verification",
  "Output Contract",
];
let canonicalSkillIdsPromise;

async function exists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function collectCanonicalSkillIds() {
  const ids = new Set();
  const queue = [CANONICAL_SKILLS_ROOT];
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
      if (!entry.isFile() || entry.name !== "SKILL.md") continue;
      const relativeDir = path.relative(
        CANONICAL_SKILLS_ROOT,
        path.dirname(fullPath),
      );
      const parts = relativeDir.split(path.sep).filter(Boolean);
      if (parts.length === 0) continue;
      ids.add(parts[parts.length - 1]);
      if (parts.length >= 3 && parts[1] === "skills") {
        ids.add(`${parts[0]}/${parts.slice(2).join("/")}`);
      } else {
        ids.add(parts.join("/"));
      }
    }
  }
  return ids;
}

async function readUtf8(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function listVisibleEntries(dirPath) {
  if (!(await exists(dirPath))) return [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.filter((entry) => !entry.name.startsWith("."));
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  return {
    raw: match[1],
    body: markdown.slice(match[0].length),
  };
}

function getScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"));
  if (!match) return null;
  return String(match[1])
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

function error(errors, filePath, message) {
  errors.push(`${filePath}: ${message}`);
}

function countTopLevelHeadings(markdownBody) {
  return (String(markdownBody || "").match(/^#\s+/gm) || []).length;
}

async function validateWorkflowSkill(
  filePath,
  expectedId,
  expectedCommand,
  expectedDescription,
  errors,
) {
  if (!(await exists(filePath))) {
    error(errors, filePath, "generated workflow skill missing");
    return;
  }

  const raw = await readUtf8(filePath);
  if (raw.trim().length < 120) {
    error(errors, filePath, "generated workflow is unexpectedly short");
    return;
  }

  const parsed = parseFrontmatter(raw);
  if (!parsed) {
    error(errors, filePath, "generated workflow skill missing frontmatter");
    return;
  }

  const name = getScalar(parsed.raw, "name");
  const command = getScalar(parsed.raw, "command");
  const description = getScalar(parsed.raw, "description");
  if (name !== expectedId) {
    error(
      errors,
      filePath,
      `workflow skill name mismatch (expected '${expectedId}', found '${name || "missing"}')`,
    );
  }
  if (command !== expectedCommand) {
    error(
      errors,
      filePath,
      `workflow command mismatch (expected '${expectedCommand}', found '${command || "missing"}')`,
    );
  }
  if (!description) {
    error(errors, filePath, "workflow description missing");
  } else if (expectedDescription && description !== expectedDescription) {
    error(errors, filePath, "workflow description drifted from route manifest");
  }
  if (countTopLevelHeadings(parsed.body) !== 1) {
    error(
      errors,
      filePath,
      "workflow skill must contain exactly one top-level heading",
    );
  }
  if (!/^#\s+.+$/m.test(parsed.body)) {
    error(
      errors,
      filePath,
      "workflow skill title missing",
    );
  }

  for (const section of REQUIRED_WORKFLOW_SECTIONS) {
    if (!new RegExp(`^##\\s+${section}$`, "m").test(parsed.body)) {
      error(errors, filePath, `missing section '## ${section}'`);
    }
  }
}

async function validateCodexAgentToml(filePath, route, errors) {
  if (!(await exists(filePath))) {
    error(errors, filePath, "generated Codex agent missing");
    return;
  }

  const raw = await readUtf8(filePath);
  if (raw.trim().length < 80) {
    error(errors, filePath, "generated Codex agent is unexpectedly short");
    return;
  }

  const nameMatch = raw.match(/^\s*name\s*=\s*"([^"]+)"/m);
  const descriptionMatch = raw.match(/^\s*description\s*=\s*"([^"]+)"/m);
  if (!nameMatch) error(errors, filePath, "Codex agent missing name");
  if (!descriptionMatch)
    error(errors, filePath, "Codex agent missing description");
  if (!/^\s*developer_instructions\s*=\s*"""/m.test(raw)) {
    error(errors, filePath, "Codex agent missing developer_instructions");
  }
  if (route?.id && nameMatch?.[1] !== route.id) {
    error(
      errors,
      filePath,
      `Codex agent name mismatch (expected '${route.id}', found '${nameMatch?.[1] || "missing"}')`,
    );
  }
}

async function validateAgentFile(
  filePath,
  route,
  requireSkillsFrontmatter,
  errors,
) {
  if (!(await exists(filePath))) {
    error(errors, filePath, "generated agent missing");
    return;
  }

  const raw = await readUtf8(filePath);
  if (raw.trim().length < 120) {
    error(errors, filePath, "generated agent is unexpectedly short");
    return;
  }

  const parsed = parseFrontmatter(raw);
  if (!parsed) {
    error(errors, filePath, "generated agent missing frontmatter");
    return;
  }

  const name = getScalar(parsed.raw, "name");
  const description = getScalar(parsed.raw, "description");
  if (!name) error(errors, filePath, "agent name missing");
  if (!description) error(errors, filePath, "agent description missing");
  if (route?.displayName && name && name !== route.displayName) {
    error(
      errors,
      filePath,
      `agent name mismatch (expected '${route.displayName}', found '${name}')`,
    );
  }

  if (requireSkillsFrontmatter && !/^\s*skills\s*:/m.test(parsed.raw)) {
    error(
      errors,
      filePath,
      "skills frontmatter missing for platform that supports direct agent skill wiring",
    );
  }
}

async function validateCopilotPrompt(
  filePath,
  routeId,
  command,
  description,
  primarySkills,
  errors,
) {
  if (!(await exists(filePath))) {
    error(errors, filePath, "copilot prompt missing");
    return;
  }

  const raw = await readUtf8(filePath);
  if (raw.trim().length < 80) {
    error(errors, filePath, "copilot prompt is unexpectedly short");
  }
  if (!raw.includes("Workflow source:")) {
    error(
      errors,
      filePath,
      "copilot prompt missing embedded workflow source",
    );
  }
  if (!raw.includes("route selection as already resolved")) {
    error(errors, filePath, "copilot prompt missing route-resolved contract");
  }
  if (!raw.includes("do not begin with skill discovery")) {
    error(errors, filePath, "copilot prompt missing no-skill-discovery guard");
  }
  if (!raw.includes("official docs as primary evidence")) {
    error(errors, filePath, "copilot prompt missing official-docs-first research guidance");
  }
  if (!raw.includes("Load these exact skill IDs first")) {
    error(errors, filePath, "copilot prompt missing direct skill attachment guidance");
  }
  if (primarySkills[0] && !raw.includes(primarySkills[0])) {
    error(
      errors,
      filePath,
      `copilot prompt missing primary attached skill '${primarySkills[0]}'`,
    );
  }
  if (!raw.startsWith(`# Workflow Prompt: ${command}`)) {
    error(errors, filePath, "copilot prompt missing workflow-title heading");
  }
  if (command && !raw.includes(command)) {
    error(
      errors,
      filePath,
      `copilot prompt missing workflow command '${command}'`,
    );
  }
  if (description && !raw.includes(description)) {
    error(errors, filePath, "copilot prompt missing workflow description");
  }
}

async function validateAntigravityCommand(
  filePath,
  routeLabel,
  description,
  primarySkills,
  errors,
) {
  if (!(await exists(filePath))) {
    error(errors, filePath, "antigravity command missing");
    return;
  }

  const raw = await readUtf8(filePath);
  if (raw.trim().length < 80) {
    error(errors, filePath, "antigravity command is unexpectedly short");
  }
  if (!raw.includes(routeLabel)) {
    error(
      errors,
      filePath,
      `command does not reference route label '${routeLabel}'`,
    );
  }
  if (!raw.includes("route selection as already resolved")) {
    error(
      errors,
      filePath,
      "antigravity command missing route-resolved contract",
    );
  }
  if (!raw.includes("do not begin with skill discovery")) {
    error(
      errors,
      filePath,
      "antigravity command missing no-skill-discovery guard",
    );
  }
  if (!raw.includes("official docs next")) {
    error(errors, filePath, "command missing official-docs-first research guidance");
  }
  if (!raw.includes("secondary evidence")) {
    error(errors, filePath, "command missing labeled-secondary-evidence guidance");
  }
  if (!raw.includes("Load these exact skill IDs first")) {
    error(errors, filePath, "command missing direct skill attachment guidance");
  }
  if (!/^\s*description\s*=\s*"/m.test(raw)) {
    error(errors, filePath, "command missing description field");
  }
  if (!/^\s*prompt\s*=\s*'''/m.test(raw)) {
    error(errors, filePath, "command missing prompt block");
  }
  if (!raw.includes("Workflow source:") && routeLabel.startsWith("/")) {
    error(errors, filePath, "workflow command missing embedded workflow source");
  }
  if (description && !raw.includes(description)) {
    error(errors, filePath, "command missing route description");
  }
  if (primarySkills[0] && !raw.includes(primarySkills[0])) {
    error(
      errors,
      filePath,
      `command missing primary attached skill '${primarySkills[0]}'`,
    );
  }
}

async function validateRuleFile(filePath, errors) {
  if (!(await exists(filePath))) {
    error(errors, filePath, "rules file missing");
    return;
  }
  const raw = await readUtf8(filePath);
  const lineCount = raw.split(/\r?\n/).length;
  const isCopilotBridge = raw.includes("Copilot Compatibility Bridge");

  if (isCopilotBridge) {
    if (lineCount > 30) {
      error(errors, filePath, "Copilot bridge AGENTS.md should stay thin");
    }
    if (
      !raw.includes("Resolve workflow or agent intent before loading any skill")
    ) {
      error(errors, filePath, "Copilot bridge missing route-first summary");
    }
    return;
  }

  if (lineCount > 450) {
    error(errors, filePath, `rules file is too long (${lineCount} lines)`);
  }
  if (
    !raw.includes("Inspect the repo") &&
    !raw.includes("Inspect the repo/task") &&
    !raw.includes("Inspect repo/task locally first")
  ) {
    error(
      errors,
      filePath,
      "rules file missing local-inspection-first guidance",
    );
  }
  if (
    !raw.includes("Never begin with `skill_search`") &&
    !raw.includes("Never chain more than one `skill_search`") &&
    !raw.includes("Never pre-load skills before route resolution")
  ) {
    error(errors, filePath, "rules file missing no-skill-search-first guard");
  }
  if (!raw.includes("route layer") && !raw.includes("Layer Reference")) {
    error(errors, filePath, "rules file missing route-layer guidance");
  }
  if (
    !raw.includes("Do not auto-prime every") &&
    !raw.includes("Do not pre-prime every task with a skill")
  ) {
    error(errors, filePath, "rules file missing lazy skill-priming guidance");
  }
  if (
    (!raw.includes("skill_validate") || !raw.includes("skill_get")) &&
    !raw.includes("activate_skill")
  ) {
    error(
      errors,
      filePath,
      "rules file missing validated skill loading guidance",
    );
  }
  if (
    !raw.includes("exact skill ID") &&
    !raw.includes("Named skill detected") &&
    !raw.includes("named skill")
  ) {
    error(errors, filePath, "rules file missing explicit-skill short-circuit guidance");
  }
  if (!raw.includes("official docs") || !raw.includes("secondary evidence")) {
    error(errors, filePath, "rules file missing research source-ladder guidance");
  }
  if (
    !raw.includes("cbx:mcp:auto:start") &&
    !filePath.includes(`${path.sep}platforms${path.sep}gemini${path.sep}`)
  ) {
    error(errors, filePath, "rules file missing managed MCP block");
  }
  if (raw.includes("Startup Transparency")) {
    error(
      errors,
      filePath,
      "rules file still contains deprecated startup-transparency section",
    );
  }
  if (raw.includes("Adaptive Load Policy")) {
    error(
      errors,
      filePath,
      "rules file still contains deprecated adaptive-load table",
    );
  }
  if (raw.includes("MCP Skill Priming (Required Before Delegation)")) {
    error(
      errors,
      filePath,
      "rules file still requires universal skill priming",
    );
  }
}

async function validateOptionalRuleFile(filePath, errors) {
  if (!(await exists(filePath))) {
    return;
  }
  await validateRuleFile(filePath, errors);
}

async function canonicalSkillExists(skillId) {
  if (!skillId) return false;
  canonicalSkillIdsPromise ||= collectCanonicalSkillIds();
  const canonicalSkillIds = await canonicalSkillIdsPromise;
  return canonicalSkillIds.has(normalizeSkillId(skillId));
}

async function main() {
  const errors = [];
  if (!(await exists(ROUTE_MANIFEST_PATH))) {
    console.error(`Missing route manifest: ${ROUTE_MANIFEST_PATH}`);
    process.exit(1);
  }

  const routeManifest = JSON.parse(await readUtf8(ROUTE_MANIFEST_PATH));
  const routes = Array.isArray(routeManifest.routes)
    ? routeManifest.routes
    : [];
  const agentIds = new Set(
    routes.filter((route) => route.kind === "agent").map((route) => route.id),
  );
  const workflowRoutes = routes.filter((route) => route.kind === "workflow");
  const agentRoutes = routes.filter((route) => route.kind === "agent");

  await validateRuleFile(
    path.join(PLATFORM_ROOTS.codex, "rules", "AGENTS.md"),
    errors,
  );
  await validateRuleFile(
    path.join(PLATFORM_ROOTS.antigravity, "rules", "GEMINI.md"),
    errors,
  );
  await validateOptionalRuleFile(
    path.join(PLATFORM_ROOTS.copilot, "rules", "AGENTS.md"),
    errors,
  );
  await validateRuleFile(
    path.join(PLATFORM_ROOTS.copilot, "rules", "copilot-instructions.md"),
    errors,
  );
  await validateRuleFile(
    path.join(PLATFORM_ROOTS.claude, "rules", "CLAUDE.md"),
    errors,
  );
  await validateRuleFile(
    path.join(PLATFORM_ROOTS.gemini, "rules", "GEMINI.md"),
    errors,
  );

  for (const route of routes) {
    if (!agentIds.has(route.primaryAgent)) {
      error(
        errors,
        ROUTE_MANIFEST_PATH,
        `route '${route.id}' references unknown primary agent '${route.primaryAgent}'`,
      );
    }
    for (const agentId of route.supportingAgents || []) {
      if (!agentIds.has(agentId)) {
        error(
          errors,
          ROUTE_MANIFEST_PATH,
          `route '${route.id}' references unknown supporting agent '${agentId}'`,
        );
      }
    }
    for (const skillId of [
      ...(route.primarySkills || []),
      ...(route.supportingSkills || []),
    ]) {
      if (!(await canonicalSkillExists(skillId))) {
        error(
          errors,
          ROUTE_MANIFEST_PATH,
          `route '${route.id}' references unknown skill '${skillId}'`,
        );
      }
    }

    if (route.kind === "workflow") {
      const codexWorkflowSkill = path.join(
        PLATFORM_ROOTS.codex,
        "generated-skills",
        route.artifacts?.codex?.skillDir || "",
        "SKILL.md",
      );
      await validateWorkflowSkill(
        codexWorkflowSkill,
        route.id,
        route.command,
        route.description,
        errors,
      );
      const claudeWorkflowSkill = path.join(
        PLATFORM_ROOTS.claude,
        "generated-skills",
        route.artifacts?.claude?.skillDir || "",
        "SKILL.md",
      );
      await validateWorkflowSkill(
        claudeWorkflowSkill,
        route.id,
        route.command,
        route.description,
        errors,
      );

      await validateCopilotPrompt(
        path.join(
          PLATFORM_ROOTS.copilot,
          "prompts",
          route.artifacts?.copilot?.promptFile || "",
        ),
        route.id,
        route.command,
        route.description,
        route.primarySkills || [],
        errors,
      );

      await validateAntigravityCommand(
        path.join(
          PLATFORM_ROOTS.antigravity,
          "commands",
          route.artifacts?.antigravity?.commandFile || "",
        ),
        route.command,
        route.description,
        route.primarySkills || [],
        errors,
      );
      await validateAntigravityCommand(
        path.join(
          PLATFORM_ROOTS.gemini,
          "commands",
          route.artifacts?.gemini?.commandFile || "",
        ),
        route.command,
        route.description,
        route.primarySkills || [],
        errors,
      );
      continue;
    }

    await validateCodexAgentToml(
      path.join(
        PLATFORM_ROOTS.codex,
        "agents",
        route.artifacts?.codex?.agentFile || "",
      ),
      route,
      errors,
    );
    await validateAgentFile(
      path.join(
        PLATFORM_ROOTS.copilot,
        "agents",
        route.artifacts?.copilot?.agentFile || "",
      ),
      route,
      false,
      errors,
    );
    await validateAgentFile(
      path.join(
        PLATFORM_ROOTS.claude,
        "agents",
        route.artifacts?.claude?.agentFile || "",
      ),
      route,
      true,
      errors,
    );
    await validateAntigravityCommand(
      path.join(
        PLATFORM_ROOTS.antigravity,
        "commands",
        route.artifacts?.antigravity?.commandFile || "",
      ),
      `@${route.id}`,
      route.description,
      route.primarySkills || [],
      errors,
    );
    await validateAntigravityCommand(
      path.join(
        PLATFORM_ROOTS.gemini,
        "commands",
        route.artifacts?.gemini?.commandFile || "",
      ),
      `@${route.id}`,
      route.description,
      route.primarySkills || [],
      errors,
    );
  }

  const projectionExpectations = [
    {
      label: "Codex generated workflow skills",
      actual: (await listVisibleEntries(path.join(PLATFORM_ROOTS.codex, "generated-skills"))).filter((entry) => entry.isDirectory()),
      expectedCount: workflowRoutes.length,
    },
    {
      label: "Claude generated workflow skills",
      actual: (await listVisibleEntries(path.join(PLATFORM_ROOTS.claude, "generated-skills"))).filter((entry) => entry.isDirectory()),
      expectedCount: workflowRoutes.length,
    },
    {
      label: "Copilot workflow prompts",
      actual: (await listVisibleEntries(path.join(PLATFORM_ROOTS.copilot, "prompts"))).filter((entry) => entry.isFile() && entry.name.endsWith(".prompt.md")),
      expectedCount: workflowRoutes.length,
    },
    {
      label: "Antigravity commands",
      actual: (await listVisibleEntries(path.join(PLATFORM_ROOTS.antigravity, "commands"))).filter((entry) => entry.isFile() && entry.name.endsWith(".toml")),
      expectedCount: workflowRoutes.length + agentRoutes.length,
    },
    {
      label: "Gemini commands",
      actual: (await listVisibleEntries(path.join(PLATFORM_ROOTS.gemini, "commands"))).filter((entry) => entry.isFile() && entry.name.endsWith(".toml")),
      expectedCount: workflowRoutes.length + agentRoutes.length,
    },
  ];

  for (const projection of projectionExpectations) {
    if (projection.actual.length !== projection.expectedCount) {
      error(
        errors,
        ROUTE_MANIFEST_PATH,
        `${projection.label} count mismatch (expected ${projection.expectedCount}, found ${projection.actual.length})`,
      );
    }
  }

  if (errors.length > 0) {
    console.error("Runtime wiring validation failed:");
    for (const item of errors) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log(`✓ Runtime wiring validation passed (routes=${routes.length})`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
