import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import { expandPath, findWorkspaceRoot } from "../pathing.js";

export const WORKFLOW_PROFILES = {
  antigravity: {
    id: "antigravity",
    label: "Antigravity",
    installsCustomAgents: false,
    project: {
      workflowDirs: [],
      agentDirs: [],
      skillDirs: [".agents/skills"],
      commandDirs: [".gemini/commands"],
      ruleFilesByPriority: [".agents/rules/GEMINI.md"],
    },
    global: {
      workflowDirs: [],
      agentDirs: [],
      skillDirs: ["~/.gemini/antigravity/skills"],
      commandDirs: ["~/.gemini/commands"],
      ruleFilesByPriority: ["~/.gemini/GEMINI.md"],
    },
    detectorPaths: [
      ".agents/skills",
      ".agents/rules/GEMINI.md",
      ".gemini/commands",
    ],
    legacyDetectorPaths: [
      ".agent",
      ".agent/workflows",
      ".agent/agents",
      ".agent/skills",
      ".agent/rules/GEMINI.md",
    ],
    ruleHintName: "GEMINI.md",
  },
  codex: {
    id: "codex",
    label: "Codex",
    installsCustomAgents: true,
    project: {
      workflowDirs: [],
      agentDirs: [".codex/agents"],
      skillDirs: [".agents/skills"],
      ruleFilesByPriority: ["AGENTS.md"],
    },
    global: {
      workflowDirs: [],
      agentDirs: ["~/.codex/agents"],
      skillDirs: ["~/.agents/skills"],
      ruleFilesByPriority: ["~/.codex/AGENTS.md"],
    },
    detectorPaths: [".codex/agents", ".agents/skills", "AGENTS.md"],
    legacyDetectorPaths: [".agents/workflows", ".agents/agents", ".codex/skills"],
    ruleHintName: "AGENTS.md",
  },
  copilot: {
    id: "copilot",
    label: "GitHub Copilot",
    installsCustomAgents: true,
    project: {
      workflowDirs: [],
      agentDirs: [".github/agents"],
      skillDirs: [".github/skills"],
      promptDirs: [".github/prompts"],
      ruleFilesByPriority: [".github/copilot-instructions.md"],
    },
    global: {
      workflowDirs: [],
      agentDirs: ["~/.copilot/agents"],
      skillDirs: ["~/.copilot/skills"],
      promptDirs: ["~/.copilot/prompts"],
      ruleFilesByPriority: ["~/.copilot/copilot-instructions.md"],
    },
    detectorPaths: [
      ".github/agents",
      ".github/prompts",
      ".vscode/mcp.json",
      ".github/copilot-instructions.md",
      ".github/instructions",
      "AGENTS.md",
    ],
    legacyDetectorPaths: [],
    ruleHintName: "AGENTS.md or .github/copilot-instructions.md",
  },
  claude: {
    id: "claude",
    label: "Claude Code",
    installsCustomAgents: true,
    project: {
      workflowDirs: [],
      agentDirs: [".claude/agents"],
      skillDirs: [".claude/skills"],
      hookDirs: [".claude/hooks"],
      ruleFilesByPriority: ["CLAUDE.md"],
    },
    global: {
      workflowDirs: [],
      agentDirs: ["~/.claude/agents"],
      skillDirs: ["~/.claude/skills"],
      hookDirs: ["~/.claude/hooks"],
      ruleFilesByPriority: ["~/.claude/CLAUDE.md"],
    },
    detectorPaths: [
      "CLAUDE.md",
      ".claude",
      ".claude/hooks",
      ".claude/rules",
      ".claude/settings.json",
    ],
    legacyDetectorPaths: [".claude/workflows"],
    ruleHintName: "CLAUDE.md",
  },
  gemini: {
    id: "gemini",
    label: "Gemini CLI",
    installsCustomAgents: false,
    project: {
      workflowDirs: [],
      skillDirs: [],
      commandDirs: [".gemini/commands"],
      ruleFilesByPriority: [".gemini/GEMINI.md", "GEMINI.md"],
    },
    global: {
      workflowDirs: [],
      skillDirs: [],
      commandDirs: ["~/.gemini/commands"],
      ruleFilesByPriority: ["~/.gemini/GEMINI.md"],
    },
    detectorPaths: [
      ".gemini",
      ".gemini/commands",
      ".gemini/GEMINI.md",
      "GEMINI.md",
    ],
    legacyDetectorPaths: [".gemini/workflows", ".gemini/skills"],
    ruleHintName: "GEMINI.md",
  },
} as const;

export const PLATFORM_IDS = Object.keys(WORKFLOW_PROFILES);

async function pathExists(targetPath: string) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

export function expandUniquePaths(
  pathList: readonly string[] | undefined,
  cwd = process.cwd(),
) {
  const seen = new Set();
  const output = [];
  for (const value of pathList || []) {
    const normalized = String(value || "").trim();
    if (!normalized) continue;
    const expanded = expandPath(normalized, cwd);
    const key = path.resolve(expanded);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(expanded);
  }
  return output;
}

export async function resolveProfilePaths(
  profileId: string,
  scope: "project" | "global",
  cwd = process.cwd(),
) {
  const profile = WORKFLOW_PROFILES[profileId];
  if (!profile) throw new Error(`Unknown platform '${profileId}'.`);
  const cfg = profile[scope];
  const workflowDirs = Array.isArray(cfg.workflowDirs) ? cfg.workflowDirs : [];
  const agentDirs = Array.isArray(cfg.agentDirs) ? cfg.agentDirs : [];
  const skillDirs = Array.isArray(cfg.skillDirs) ? cfg.skillDirs : [];
  const commandDirs = Array.isArray(cfg.commandDirs) ? cfg.commandDirs : [];
  const promptDirs = Array.isArray(cfg.promptDirs) ? cfg.promptDirs : [];
  const hookDirs = Array.isArray(cfg.hookDirs) ? cfg.hookDirs : [];

  const resolvePreferredDir = async (dirs: readonly string[]) => {
    if (dirs.length === 0) return null;
    const expanded = dirs.map((dirPath) => expandPath(dirPath, cwd));
    for (const candidate of expanded) {
      if (await pathExists(candidate)) return candidate;
    }
    return expanded[0];
  };

  return {
    workflowsDir: await resolvePreferredDir(workflowDirs),
    agentsDir: await resolvePreferredDir(agentDirs),
    skillsDir: await resolvePreferredDir(skillDirs),
    commandsDir: await resolvePreferredDir(commandDirs),
    promptsDir: await resolvePreferredDir(promptDirs),
    hooksDir: await resolvePreferredDir(hookDirs),
    ruleFilesByPriority: cfg.ruleFilesByPriority.map((filePath) =>
      expandPath(filePath, cwd),
    ),
  };
}

export function resolveProfilePathCandidates(
  profileId: string,
  scope: "project" | "global",
  cwd = process.cwd(),
) {
  const profile = WORKFLOW_PROFILES[profileId];
  if (!profile) throw new Error(`Unknown platform '${profileId}'.`);
  const cfg = profile[scope];
  return {
    workflowsDirs: expandUniquePaths(cfg.workflowDirs, cwd),
    agentsDirs: expandUniquePaths(cfg.agentDirs, cwd),
    skillsDirs: expandUniquePaths(cfg.skillDirs, cwd),
    commandsDirs: expandUniquePaths(cfg.commandDirs, cwd),
    promptsDirs: expandUniquePaths(cfg.promptDirs, cwd),
    hooksDirs: expandUniquePaths(cfg.hookDirs, cwd),
    ruleFilesByPriority: expandUniquePaths(cfg.ruleFilesByPriority, cwd),
  };
}

export function resolveLegacySkillDirsForCleanup(
  platform: string,
  scope: "project" | "global",
  cwd = process.cwd(),
) {
  if (platform !== "codex") return [];
  if (scope === "global") {
    return [path.join(os.homedir(), ".codex", "skills")];
  }
  const workspaceRoot = findWorkspaceRoot(cwd);
  return [path.join(workspaceRoot, ".codex", "skills")];
}

export async function resolveArtifactProfilePaths(
  profileId: string,
  scope: "project" | "global",
  cwd = process.cwd(),
) {
  const scopedPaths = await resolveProfilePaths(profileId, scope, cwd);
  if (scope !== "global") return scopedPaths;

  const workspacePaths = await resolveProfilePaths(profileId, "project", cwd);
  return {
    ...scopedPaths,
    workflowsDir: workspacePaths.workflowsDir,
    agentsDir: workspacePaths.agentsDir,
    commandsDir: workspacePaths.commandsDir ?? scopedPaths.commandsDir,
    promptsDir: workspacePaths.promptsDir ?? scopedPaths.promptsDir,
    hooksDir: scopedPaths.hooksDir,
  };
}
