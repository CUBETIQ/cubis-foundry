import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import {
  WORKFLOW_PROFILES,
  resolveArtifactProfilePaths,
  resolveProfilePaths,
} from "../config/index.js";
import { expandPath } from "../pathing.js";
import type { DoctorReport } from "./types.js";

const MANAGED_BLOCK_START_RE = /<!--\s*cbx:workflows:auto:start[^>]*-->/g;
const MANAGED_BLOCK_END_RE = /<!--\s*cbx:workflows:auto:end\s*-->/g;
const TERMINAL_VERIFICATION_BLOCK_START_RE =
  /<!--\s*cbx:terminal:verification:start[^>]*-->/g;
const TERMINAL_VERIFICATION_BLOCK_END_RE =
  /<!--\s*cbx:terminal:verification:end\s*-->/g;
const COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS = new Set([
  "compatibility",
  "description",
  "license",
  "metadata",
  "name",
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
  "argument-hint",
]);

type DoctorPlatform = keyof typeof WORKFLOW_PROFILES;
type DoctorScope = "project" | "global";

async function pathExists(targetPath: string | null | undefined): Promise<boolean> {
  if (!targetPath) return false;
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findNearestUpwardFile(
  startDir: string,
  relativeFilePath: string,
): Promise<string | null> {
  let current = path.resolve(startDir);
  while (true) {
    const candidate = path.join(current, relativeFilePath);
    if (await pathExists(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function platformInstallsCustomAgents(platformId: DoctorPlatform): boolean {
  const profile = WORKFLOW_PROFILES[platformId];
  return Boolean(profile && profile.installsCustomAgents !== false);
}

function getAntigravityTerminalIntegrationDir(profilePaths: {
  rulesDir?: string | null;
  skillsDir?: string | null;
  commandsDir?: string | null;
  rootDir?: string | null;
}): string {
  const baseDir =
    profilePaths.rulesDir
    || profilePaths.skillsDir
    || profilePaths.commandsDir
    || profilePaths.rootDir
    || process.cwd();
  return path.join(path.dirname(baseDir), "terminal-integration");
}

async function resolveWorkspaceRuleFileForGlobalScope(
  platform: DoctorPlatform,
  cwd = process.cwd(),
): Promise<string | null> {
  if (platform === "codex") {
    return findNearestUpwardFile(cwd, "AGENTS.md");
  }

  const profilePaths = await resolveProfilePaths(platform, "project", cwd);
  for (const candidate of profilePaths.ruleFilesByPriority) {
    if (await pathExists(candidate)) return candidate;
  }

  return null;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function extractFrontmatter(markdown: string): { frontmatter: string; body: string } {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatter: "", body: markdown };
  }
  return {
    frontmatter: match[1],
    body: markdown.slice(match[0].length),
  };
}

function hasFrontmatter(markdown: string): boolean {
  return /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.test(markdown);
}

function collectTopLevelFrontmatterKeys(frontmatter: string): string[] {
  const keys: string[] = [];
  for (const line of frontmatter.split(/\r?\n/)) {
    if (!line || /^\s/.test(line)) continue;
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (!match) continue;
    keys.push(match[1]);
  }
  return unique(keys);
}

function unsupportedCopilotSkillFrontmatterKeys(frontmatter: string): string[] {
  const keys = collectTopLevelFrontmatterKeys(frontmatter);
  return keys.filter((key) => !COPILOT_ALLOWED_SKILL_FRONTMATTER_KEYS.has(key));
}

function unsupportedCopilotAgentFrontmatterKeys(frontmatter: string): string[] {
  const keys = collectTopLevelFrontmatterKeys(frontmatter);
  return keys.filter((key) => !COPILOT_ALLOWED_AGENT_FRONTMATTER_KEYS.has(key));
}

async function validateCopilotSkillsSchema(
  skillsDir: string | null,
): Promise<Array<{ skillId: string; unsupportedKeys: string[] }>> {
  if (!(await pathExists(skillsDir))) return [];

  const entries = await readdir(skillsDir!, { withFileTypes: true });
  const findings: Array<{ skillId: string; unsupportedKeys: string[] }> = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(skillsDir!, entry.name, "SKILL.md");
    if (!(await pathExists(skillFile))) continue;

    const raw = await readFile(skillFile, "utf8");
    if (!hasFrontmatter(raw)) continue;
    const { frontmatter } = extractFrontmatter(raw);
    const unsupportedKeys = unsupportedCopilotSkillFrontmatterKeys(frontmatter);
    if (unsupportedKeys.length === 0) continue;

    findings.push({
      skillId: entry.name,
      unsupportedKeys,
    });
  }

  return findings;
}

async function validateCopilotAgentsSchema(
  agentsDir: string | null,
): Promise<Array<{ agentId: string; unsupportedKeys: string[] }>> {
  if (!(await pathExists(agentsDir))) return [];

  const entries = await readdir(agentsDir!, { withFileTypes: true });
  const findings: Array<{ agentId: string; unsupportedKeys: string[] }> = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const agentFile = path.join(agentsDir!, entry.name);
    if (!(await pathExists(agentFile))) continue;

    const raw = await readFile(agentFile, "utf8");
    if (!hasFrontmatter(raw)) continue;
    const { frontmatter } = extractFrontmatter(raw);
    const unsupportedKeys = unsupportedCopilotAgentFrontmatterKeys(frontmatter);
    if (unsupportedKeys.length === 0) continue;

    findings.push({
      agentId: entry.name.replace(/\.agent\.md$/i, "").replace(/\.md$/i, ""),
      unsupportedKeys,
    });
  }

  return findings;
}

function analyzeTaggedBlock(
  content: string,
  startPattern: RegExp,
  endPattern: RegExp,
): { status: string; starts: number; ends: number; range: { start: number; end: number } | null } {
  const starts = [...content.matchAll(startPattern)];
  const ends = [...content.matchAll(endPattern)];

  if (starts.length === 0 && ends.length === 0) {
    return { status: "absent", starts: 0, ends: 0, range: null };
  }

  let range: { start: number; end: number } | null = null;
  for (const startMatch of starts) {
    const endMatch = ends.find((candidate) => (candidate.index ?? -1) > (startMatch.index ?? -1));
    if (endMatch) {
      range = {
        start: startMatch.index!,
        end: endMatch.index! + endMatch[0].length,
      };
      break;
    }
  }

  if (!range) {
    return {
      status: "malformed",
      starts: starts.length,
      ends: ends.length,
      range: null,
    };
  }

  if (starts.length === 1 && ends.length === 1) {
    return { status: "valid", starts: 1, ends: 1, range };
  }

  return {
    status: "multiple",
    starts: starts.length,
    ends: ends.length,
    range,
  };
}

function analyzeManagedBlock(content: string) {
  return analyzeTaggedBlock(content, MANAGED_BLOCK_START_RE, MANAGED_BLOCK_END_RE);
}

function analyzeTerminalVerificationBlock(content: string) {
  return analyzeTaggedBlock(
    content,
    TERMINAL_VERIFICATION_BLOCK_START_RE,
    TERMINAL_VERIFICATION_BLOCK_END_RE,
  );
}

export async function createDoctorReport({
  platform,
  scope,
  cwd = process.cwd(),
}: {
  platform: DoctorPlatform;
  scope: DoctorScope;
  cwd?: string;
}): Promise<DoctorReport> {
  const profile = WORKFLOW_PROFILES[platform];
  const profilePaths = await resolveProfilePaths(platform, scope, cwd);
  const artifactPaths = await resolveArtifactProfilePaths(platform, scope, cwd);
  const agentsEnabled = platformInstallsCustomAgents(platform);

  const pathStatus = {
    workflows: {
      path: artifactPaths.workflowsDir,
      exists: await pathExists(artifactPaths.workflowsDir),
    },
    agents: {
      path: artifactPaths.agentsDir,
      enabled: agentsEnabled,
      exists: agentsEnabled ? await pathExists(artifactPaths.agentsDir) : null,
    },
    skills: {
      path: artifactPaths.skillsDir,
      exists: await pathExists(artifactPaths.skillsDir),
    },
    commands: {
      path: artifactPaths.commandsDir,
      enabled: Boolean(artifactPaths.commandsDir),
      exists: artifactPaths.commandsDir
        ? await pathExists(artifactPaths.commandsDir)
        : null,
    },
    prompts: {
      path: artifactPaths.promptsDir,
      enabled: Boolean(artifactPaths.promptsDir),
      exists: artifactPaths.promptsDir
        ? await pathExists(artifactPaths.promptsDir)
        : null,
    },
  };

  let activeRuleFile: string | null = null;
  for (const candidate of profilePaths.ruleFilesByPriority) {
    if (await pathExists(candidate)) {
      activeRuleFile = candidate;
      break;
    }
  }

  const preferredRuleFile = profilePaths.ruleFilesByPriority[0] ?? null;
  const ruleFileToCheck = activeRuleFile || preferredRuleFile;

  let managedBlockStatus = "absent";
  let managedBlockCounts = { starts: 0, ends: 0 };
  if (activeRuleFile && (await pathExists(activeRuleFile))) {
    const content = await readFile(activeRuleFile, "utf8");
    const analysis = analyzeManagedBlock(content);
    managedBlockStatus = analysis.status;
    managedBlockCounts = { starts: analysis.starts, ends: analysis.ends };
  }

  let terminalIntegration: DoctorReport["terminalIntegration"] = null;
  if (platform === "antigravity") {
    const integrationDir = getAntigravityTerminalIntegrationDir(artifactPaths);
    const configPath = path.join(integrationDir, "config.json");
    const exists = await pathExists(integrationDir);
    const configExists = await pathExists(configPath);
    let provider: string | null = null;
    let ruleBlockStatus = "unknown";

    if (configExists) {
      try {
        const raw = await readFile(configPath, "utf8");
        const parsed = JSON.parse(raw) as { provider?: unknown };
        provider = typeof parsed.provider === "string" ? parsed.provider : null;
      } catch {
        provider = null;
      }
    }

    if (activeRuleFile && (await pathExists(activeRuleFile))) {
      const content = await readFile(activeRuleFile, "utf8");
      ruleBlockStatus = analyzeTerminalVerificationBlock(content).status;
    }

    terminalIntegration = {
      path: integrationDir,
      exists,
      configPath,
      configExists,
      provider,
      ruleBlockStatus,
    };
  }

  const recommendations: string[] = [];
  const warnings: string[] = [];

  if (!activeRuleFile) {
    recommendations.push(
      `No instruction file found. Run 'cbx workflows sync-rules --platform ${platform} --scope ${scope}' to create ${profile.ruleHintName}.`,
    );
  }

  if (activeRuleFile && managedBlockStatus === "absent") {
    recommendations.push(
      `Instruction file exists but lacks CBX managed block. Run 'cbx workflows sync-rules --platform ${platform} --scope ${scope}'.`,
    );
  }

  if (managedBlockStatus === "multiple" || managedBlockStatus === "malformed") {
    recommendations.push(
      `Managed block is not clean. Run 'cbx workflows sync-rules --platform ${platform} --scope ${scope}' to normalize it.`,
    );
  }

  if (
    !pathStatus.workflows.exists
    && !pathStatus.skills.exists
    && !(pathStatus.agents.enabled && pathStatus.agents.exists)
    && !(pathStatus.commands.enabled && pathStatus.commands.exists)
    && !(pathStatus.prompts.enabled && pathStatus.prompts.exists)
  ) {
    recommendations.push(
      "No workflow/agent/skill/command/prompt directories found in this scope.",
    );
  }

  if (platform === "codex" && scope === "project") {
    const legacyCodexSkills = path.join(cwd, ".codex", "skills");
    if (await pathExists(legacyCodexSkills)) {
      warnings.push(
        "Legacy path ./.codex/skills detected. Recommended path is ./.agents/skills.",
      );
      recommendations.push(
        "Migrate legacy Codex skills path: move ./.codex/skills to ./.agents/skills to align with official defaults.",
      );
    }
  }

  if (scope === "global") {
    const workspaceRule = await resolveWorkspaceRuleFileForGlobalScope(platform, cwd);
    if (workspaceRule) {
      const globalRulePath = expandPath(profile.global.ruleFilesByPriority[0], cwd);
      warnings.push(
        `Workspace rule file detected at ${workspaceRule}. In this workspace, it has higher precedence than global ${globalRulePath}.`,
      );
      recommendations.push(
        `Use 'cbx workflows sync-rules --platform ${platform} --scope global' from this workspace to sync the managed block to both global and workspace rule files.`,
      );
    }
  }

  if (platform === "antigravity" && scope === "project") {
    const gitignorePath = path.join(cwd, ".gitignore");
    if (await pathExists(gitignorePath)) {
      const gitignore = await readFile(gitignorePath, "utf8");
      const lines = gitignore.split(/\r?\n/).map((line) => line.trim());
      const hasAgentIgnore = lines.some(
        (line) =>
          line === ".agent"
          || line === ".agent/"
          || line === "/.agent/"
          || line === ".agents"
          || line === ".agents/"
          || line === "/.agents/",
      );
      if (hasAgentIgnore) {
        warnings.push(
          ".agents/ or legacy .agent/ is ignored in .gitignore; this can hide team workflow/rule updates.",
        );
        recommendations.push(
          "Prefer tracking .agents/ in git. For local-only excludes, use '.git/info/exclude' instead of .gitignore.",
        );
      }
    }
  }

  if (
    platform === "antigravity"
    && terminalIntegration?.exists
    && !terminalIntegration.configExists
  ) {
    warnings.push(
      `Antigravity terminal integration directory exists without config: ${terminalIntegration.configPath}.`,
    );
    recommendations.push(
      "Reinstall with terminal integration enabled to restore config and scripts.",
    );
  }

  if (
    platform === "antigravity"
    && terminalIntegration?.exists
    && terminalIntegration.ruleBlockStatus === "absent"
  ) {
    warnings.push(
      "Antigravity terminal integration exists but no terminal verification rule block was found.",
    );
    recommendations.push(
      "Re-run install with terminal integration flags (use --overwrite if files already exist).",
    );
  }

  if (
    (platform === "antigravity" || platform === "gemini")
    && pathStatus.workflows.exists
    && pathStatus.commands.enabled
    && !pathStatus.commands.exists
  ) {
    warnings.push(`${profile.label} workflows are present but the commands directory is missing.`);
    recommendations.push(
      `Reinstall to generate command files: cbx workflows install --platform ${platform} --bundle agent-environment-setup --scope ${scope} --overwrite`,
    );
  }

  if (
    platform === "copilot"
    && pathStatus.workflows.exists
    && pathStatus.prompts.enabled
    && !pathStatus.prompts.exists
  ) {
    warnings.push("Copilot workflows are present but prompts directory is missing.");
    recommendations.push(
      `Reinstall to generate prompt files: cbx workflows install --platform copilot --bundle agent-environment-setup --scope ${scope} --overwrite`,
    );
  }

  if (platform === "copilot" && pathStatus.skills.exists) {
    const findings = await validateCopilotSkillsSchema(artifactPaths.skillsDir);
    if (findings.length > 0) {
      const preview = findings
        .slice(0, 5)
        .map((item) => `${item.skillId}(${item.unsupportedKeys.join(",")})`)
        .join("; ");
      warnings.push(
        `Unsupported top-level Copilot skill attributes detected in ${findings.length} skill(s): ${preview}${findings.length > 5 ? "; ..." : ""}`,
      );
      recommendations.push(
        `Normalize Copilot skill frontmatter by reinstalling with overwrite: cbx workflows install --platform copilot --bundle agent-environment-setup --scope ${scope} --overwrite`,
      );
    }
  }

  if (platform === "copilot" && pathStatus.agents.exists) {
    const findings = await validateCopilotAgentsSchema(artifactPaths.agentsDir);
    if (findings.length > 0) {
      const preview = findings
        .slice(0, 5)
        .map((item) => `${item.agentId}(${item.unsupportedKeys.join(",")})`)
        .join("; ");
      warnings.push(
        `Unsupported top-level Copilot agent attributes detected in ${findings.length} agent file(s): ${preview}${findings.length > 5 ? "; ..." : ""}`,
      );
      recommendations.push(
        `Normalize Copilot agent frontmatter by reinstalling with overwrite: cbx workflows install --platform copilot --bundle agent-environment-setup --scope ${scope} --overwrite`,
      );
    }
  }

  return {
    platform,
    scope,
    ruleFileStatus: {
      active: activeRuleFile,
      preferred: ruleFileToCheck,
      exists: Boolean(activeRuleFile),
    },
    paths: pathStatus,
    managedBlockStatus,
    managedBlockCounts,
    terminalIntegration,
    warnings,
    recommendations,
  };
}
