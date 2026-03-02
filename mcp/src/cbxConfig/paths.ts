/**
 * Cubis Foundry MCP Server – cbxConfig path resolution.
 *
 * Global: ~/.cbx/cbx_config.json
 * Project: <workspace>/cbx_config.json
 * Auto-effective: project if exists, else global.
 */

import path from "node:path";
import os from "node:os";
import { existsSync } from "node:fs";
import type { ConfigScope } from "./types.js";

export function globalConfigPath(): string {
  return path.join(os.homedir(), ".cbx", "cbx_config.json");
}

export function projectConfigPath(workspaceRoot?: string): string {
  const root = workspaceRoot ?? process.cwd();
  return path.join(root, "cbx_config.json");
}

/**
 * Resolve the effective config path.
 * If scope is explicit, use that. Otherwise auto-detect:
 *   project config if exists, else global.
 */
export function resolveConfigPath(
  scope?: ConfigScope | "auto",
  workspaceRoot?: string,
): { path: string; scope: ConfigScope } {
  if (scope === "global") {
    return { path: globalConfigPath(), scope: "global" };
  }
  if (scope === "project") {
    return { path: projectConfigPath(workspaceRoot), scope: "project" };
  }

  // Auto-effective: project if exists, else global
  const projectPath = projectConfigPath(workspaceRoot);
  if (existsSync(projectPath)) {
    return { path: projectPath, scope: "project" };
  }
  return { path: globalConfigPath(), scope: "global" };
}
