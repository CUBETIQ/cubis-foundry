import os from "node:os";
import path from "node:path";
import { findWorkspaceRoot } from "../pathing.js";

export interface ResolveMcpSkillRootCandidatesOptions {
  scope: "global" | "project";
  cwd?: string;
  explicitSkillsRoot?: string | null;
  homeDir?: string;
  workspaceRoot?: string;
}

function dedupePaths(paths: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of paths) {
    const normalized = normalizePortablePath(value);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function isWindowsAbsolutePath(value: string) {
  return /^[A-Za-z]:[\\/]/.test(value);
}

function normalizePortablePath(value: string) {
  if (isWindowsAbsolutePath(value)) {
    return path.win32.normalize(value).replace(/\\/g, "/");
  }
  return path.resolve(value);
}

function resolvePortablePath(baseDir: string, targetPath: string) {
  if (isWindowsAbsolutePath(targetPath)) {
    return normalizePortablePath(targetPath);
  }
  if (isWindowsAbsolutePath(baseDir)) {
    return path.win32.resolve(baseDir, targetPath).replace(/\\/g, "/");
  }
  return path.resolve(baseDir, targetPath);
}

export function resolveMcpSkillRootCandidates({
  scope,
  cwd = process.cwd(),
  explicitSkillsRoot = null,
  homeDir = os.homedir(),
  workspaceRoot = findWorkspaceRoot(cwd),
}: ResolveMcpSkillRootCandidatesOptions) {
  if (explicitSkillsRoot) {
    return dedupePaths([resolvePortablePath(cwd, explicitSkillsRoot)]);
  }

  const workspaceCandidates = [
    path.join(workspaceRoot, "foundry", "modules"),
    path.join(workspaceRoot, "workflows", "skills"),
    path.join(workspaceRoot, ".agents", "skills"),
    path.join(workspaceRoot, ".github", "skills"),
    path.join(workspaceRoot, ".agent", "skills"),
  ];
  const homeCandidates = [
    path.join(homeDir, ".agents", "skills"),
    path.join(homeDir, ".copilot", "skills"),
    path.join(homeDir, ".gemini", "antigravity", "skills"),
  ];

  return dedupePaths(
    scope === "global"
      ? [...homeCandidates, ...workspaceCandidates]
      : [...workspaceCandidates, ...homeCandidates],
  );
}
