#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";

const ROOT = process.cwd();
const BUNDLE_ROOT = path.join(
  ROOT,
  "workflows",
  "workflows",
  "agent-environment-setup",
);
const ROUTE_MANIFEST_PATH = path.join(BUNDLE_ROOT, "generated", "route-manifest.json");
const MANIFEST_PATH = path.join(BUNDLE_ROOT, "manifest.json");
const CANONICAL_MODULES_ROOT = path.join(ROOT, "foundry", "modules");
const PLATFORM_ROOTS = {
  codex: path.join(BUNDLE_ROOT, "platforms", "codex"),
  antigravity: path.join(BUNDLE_ROOT, "platforms", "antigravity"),
  copilot: path.join(BUNDLE_ROOT, "platforms", "copilot"),
  claude: path.join(BUNDLE_ROOT, "platforms", "claude"),
  gemini: path.join(BUNDLE_ROOT, "platforms", "gemini"),
};
const RULE_FILES = {
  codex: path.join(PLATFORM_ROOTS.codex, "rules", "AGENTS.md"),
  antigravity: path.join(PLATFORM_ROOTS.antigravity, "rules", "GEMINI.md"),
  copilot: path.join(PLATFORM_ROOTS.copilot, "rules", "copilot-instructions.md"),
  claude: path.join(PLATFORM_ROOTS.claude, "rules", "CLAUDE.md"),
  gemini: path.join(PLATFORM_ROOTS.gemini, "rules", "GEMINI.md"),
};
const BASE_RULE_SNIPPETS = ["route_resolve", "skill_validate", "skill_get", "playwright"];
const PLATFORM_RULE_SNIPPETS = {
  codex: [...BASE_RULE_SNIPPETS, "mobile-mcp"],
  claude: [...BASE_RULE_SNIPPETS, "mobile-mcp"],
  gemini: [...BASE_RULE_SNIPPETS, "mobile-mcp"],
  copilot: BASE_RULE_SNIPPETS,
  antigravity: BASE_RULE_SNIPPETS,
};

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

async function readUtf8(filePath) {
  return (await fs.readFile(filePath, "utf8")).replace(/\r\n/g, "\n");
}

function error(errors, pathLabel, message) {
  errors.push(`- ${pathLabel}: ${message}`);
}

async function canonicalSkillExists(skillId) {
  return pathExists(path.join(CANONICAL_MODULES_ROOT, skillId, "SKILL.md"));
}

async function canonicalAgentExists(agentId) {
  return pathExists(
    path.join(CANONICAL_MODULES_ROOT, "agents-core", "agents", `${agentId}.md`),
  );
}

async function canonicalWorkflowExists(workflowId) {
  return pathExists(
    path.join(CANONICAL_MODULES_ROOT, "workflows", workflowId, "workflow.md"),
  );
}

async function validateRuleFiles(errors) {
  for (const [platformId, filePath] of Object.entries(RULE_FILES)) {
    if (!(await pathExists(filePath))) {
      error(errors, filePath, `${platformId} rules file is missing`);
      continue;
    }
    const content = await readUtf8(filePath);
    for (const snippet of PLATFORM_RULE_SNIPPETS[platformId] || BASE_RULE_SNIPPETS) {
      if (!content.includes(snippet)) {
        error(errors, filePath, `missing '${snippet}' guidance`);
      }
    }
  }
}

async function main() {
  const errors = [];
  const manifest = await readJson(MANIFEST_PATH);
  const routeManifest = await readJson(ROUTE_MANIFEST_PATH);

  await validateRuleFiles(errors);

  const workflowRoutes = routeManifest.routes.filter((route) => route.kind === "workflow");
  const agentRoutes = routeManifest.routes.filter((route) => route.kind === "agent");

  if (routeManifest.summary.workflows !== workflowRoutes.length) {
    error(errors, ROUTE_MANIFEST_PATH, "workflow summary count mismatch");
  }
  if (routeManifest.summary.agents !== agentRoutes.length) {
    error(errors, ROUTE_MANIFEST_PATH, "agent summary count mismatch");
  }

  for (const route of workflowRoutes) {
    if (!(await canonicalWorkflowExists(route.id))) {
      error(errors, ROUTE_MANIFEST_PATH, `workflow route '${route.id}' has no canonical workflow source`);
    }

    for (const skillId of [...(route.primarySkills || []), ...(route.supportingSkills || [])]) {
      if (!(await canonicalSkillExists(skillId))) {
        error(errors, ROUTE_MANIFEST_PATH, `route '${route.id}' references unknown skill '${skillId}'`);
      }
    }

    const codexSkillPath = path.join(
      PLATFORM_ROOTS.codex,
      "generated-skills",
      route.artifacts?.codex?.skillDir || "",
      "SKILL.md",
    );
    if (!(await pathExists(codexSkillPath))) {
      error(errors, codexSkillPath, `generated Codex workflow skill missing for '${route.id}'`);
    }

    const claudeSkillPath = path.join(
      PLATFORM_ROOTS.claude,
      "generated-skills",
      route.artifacts?.claude?.skillDir || "",
      "SKILL.md",
    );
    if (!(await pathExists(claudeSkillPath))) {
      error(errors, claudeSkillPath, `generated Claude workflow skill missing for '${route.id}'`);
    }

    const copilotPrompt = path.join(
      PLATFORM_ROOTS.copilot,
      "prompts",
      route.artifacts?.copilot?.promptFile || "",
    );
    if (!(await pathExists(copilotPrompt))) {
      error(errors, copilotPrompt, `Copilot workflow prompt missing for '${route.id}'`);
    }

    const antigravityCommand = path.join(
      PLATFORM_ROOTS.antigravity,
      "commands",
      route.artifacts?.antigravity?.commandFile || "",
    );
    if (!(await pathExists(antigravityCommand))) {
      error(errors, antigravityCommand, `Antigravity command missing for '${route.id}'`);
    }

    const geminiCommand = path.join(
      PLATFORM_ROOTS.gemini,
      "commands",
      route.artifacts?.gemini?.commandFile || "",
    );
    if (!(await pathExists(geminiCommand))) {
      error(errors, geminiCommand, `Gemini command missing for '${route.id}'`);
    }
  }

  for (const route of agentRoutes) {
    if (!(await canonicalAgentExists(route.id))) {
      error(errors, ROUTE_MANIFEST_PATH, `agent route '${route.id}' has no canonical agent source`);
    }

    const codexAgent = path.join(
      PLATFORM_ROOTS.codex,
      "agents",
      route.artifacts?.codex?.agentFile || "",
    );
    if (!(await pathExists(codexAgent))) {
      error(errors, codexAgent, `Codex agent projection missing for '${route.id}'`);
    }

    const copilotAgent = path.join(
      PLATFORM_ROOTS.copilot,
      "agents",
      route.artifacts?.copilot?.agentFile || "",
    );
    if (!(await pathExists(copilotAgent))) {
      error(errors, copilotAgent, `Copilot agent projection missing for '${route.id}'`);
    }

    const claudeAgent = path.join(
      PLATFORM_ROOTS.claude,
      "agents",
      route.artifacts?.claude?.agentFile || "",
    );
    if (!(await pathExists(claudeAgent))) {
      error(errors, claudeAgent, `Claude agent projection missing for '${route.id}'`);
    }

    const antigravityCommand = path.join(
      PLATFORM_ROOTS.antigravity,
      "commands",
      route.artifacts?.antigravity?.commandFile || "",
    );
    if (!(await pathExists(antigravityCommand))) {
      error(errors, antigravityCommand, `Antigravity command missing for agent '${route.id}'`);
    }

    const geminiCommand = path.join(
      PLATFORM_ROOTS.gemini,
      "commands",
      route.artifacts?.gemini?.commandFile || "",
    );
    if (!(await pathExists(geminiCommand))) {
      error(errors, geminiCommand, `Gemini command missing for agent '${route.id}'`);
    }
  }

  const expectedWorkflowIds = workflowRoutes.map((route) => `workflow-${route.id}`).sort();
  const codexGeneratedSkills = [...(manifest.platforms?.codex?.generatedSkills || [])].sort();
  const claudeGeneratedSkills = [...(manifest.platforms?.claude?.generatedSkills || [])].sort();
  if (JSON.stringify(codexGeneratedSkills) !== JSON.stringify(expectedWorkflowIds)) {
    error(errors, MANIFEST_PATH, "codex generated skill list does not match route manifest workflows");
  }
  if (JSON.stringify(claudeGeneratedSkills) !== JSON.stringify(expectedWorkflowIds)) {
    error(errors, MANIFEST_PATH, "claude generated skill list does not match route manifest workflows");
  }

  const expectedAgentFiles = agentRoutes.map((route) => `${route.id}.toml`).sort();
  const expectedClaudeAgents = agentRoutes.map((route) => `${route.id}.md`).sort();
  const expectedCopilotAgents = agentRoutes.map((route) => `${route.id}.agent.md`).sort();
  if (JSON.stringify([...(manifest.platforms?.codex?.agents || [])].sort()) !== JSON.stringify(expectedAgentFiles)) {
    error(errors, MANIFEST_PATH, "codex agent list does not match route manifest agents");
  }
  if (JSON.stringify([...(manifest.platforms?.claude?.agents || [])].sort()) !== JSON.stringify(expectedClaudeAgents)) {
    error(errors, MANIFEST_PATH, "claude agent list does not match route manifest agents");
  }
  if (JSON.stringify([...(manifest.platforms?.copilot?.agents || [])].sort()) !== JSON.stringify(expectedCopilotAgents)) {
    error(errors, MANIFEST_PATH, "copilot agent list does not match route manifest agents");
  }

  if (errors.length > 0) {
    console.error("Runtime wiring validation failed:");
    for (const entry of errors) console.error(entry);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        routeManifest: ROUTE_MANIFEST_PATH,
        manifest: MANIFEST_PATH,
        workflows: workflowRoutes.length,
        agents: agentRoutes.length,
        status: "ok",
      },
      null,
      2,
    ),
  );
}

await main();
