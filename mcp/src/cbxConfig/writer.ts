/**
 * Cubis Foundry MCP Server – cbxConfig writer.
 *
 * Atomic writes: write to temp file, then rename.
 * Mutates only the target field (e.g., postman.mcpUrl or stitch.activeProfileName).
 * Never exposes or logs apiKey.
 */

import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import path from "node:path";
import { parse as parseJsonc } from "jsonc-parser";
import { resolveConfigPath } from "./paths.js";
import type { CbxConfig, ConfigScope } from "./types.js";
import { logger } from "../utils/logger.js";
import { configNotFound } from "../utils/errors.js";

/**
 * Set a nested field in cbx_config.json atomically.
 *
 * @param fieldPath - dot-separated path, e.g. "postman.mcpUrl"
 * @param value - the value to set
 * @param scope - config scope to write to
 * @param workspaceRoot - workspace root for project scope
 */
export function writeConfigField(
  fieldPath: string,
  value: unknown,
  scope?: ConfigScope | "auto",
  workspaceRoot?: string,
): { writtenPath: string; scope: ConfigScope } {
  const resolved = resolveConfigPath(scope, workspaceRoot);
  const configPath = resolved.path;

  // Read existing config or start fresh
  let config: CbxConfig = {};
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, "utf8");
      config = parseJsonc(raw) as CbxConfig;
    } catch {
      logger.warn(
        `Cannot parse existing config at ${configPath}, creating new`,
      );
    }
  }

  // Set the nested field
  const parts = fieldPath.split(".");
  let current: Record<string, unknown> = config;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (typeof current[key] !== "object" || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;

  // Atomic write: temp file + rename
  const dir = path.dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const tmpPath = `${configPath}.tmp.${Date.now()}`;
  writeFileSync(tmpPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  renameSync(tmpPath, configPath);

  logger.debug(`Config field "${fieldPath}" written to ${configPath}`);
  return { writtenPath: configPath, scope: resolved.scope };
}

/**
 * Verify a config file exists at the resolved path, or throw the exact error message.
 */
export function ensureConfigExists(
  scope?: ConfigScope | "auto",
  workspaceRoot?: string,
): void {
  const resolved = resolveConfigPath(scope, workspaceRoot);
  if (!existsSync(resolved.path)) {
    configNotFound();
  }
}
