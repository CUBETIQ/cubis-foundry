import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { AGENT_ASSETS_SUBDIR } from "./constants.js";

export function packageRoot() {
  let currentDir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 5; i += 1) {
    const candidatePackageJson = path.join(currentDir, "package.json");
    if (existsSync(candidatePackageJson)) {
      return currentDir;
    }
    const parentDir = path.resolve(currentDir, "..");
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  return process.cwd();
}

export function agentAssetsRoot() {
  const preferred = path.join(packageRoot(), AGENT_ASSETS_SUBDIR);
  return existsSync(preferred) ? preferred : packageRoot();
}

export function workflowSkillsRoot() {
  return path.join(agentAssetsRoot(), "skills");
}

export function expandPath(inputPath: string, cwd = process.cwd()) {
  if (!inputPath) return cwd;
  if (inputPath === "~") return os.homedir();
  if (inputPath.startsWith("~/"))
    return path.join(os.homedir(), inputPath.slice(2));
  if (path.isAbsolute(inputPath)) return inputPath;
  return path.resolve(cwd, inputPath);
}

export function findWorkspaceRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);
  while (true) {
    if (existsSync(path.join(current, ".git"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(startDir);
    current = parent;
  }
}
