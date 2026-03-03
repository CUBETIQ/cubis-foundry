/**
 * Cubis Foundry MCP Server – cbxConfig reader.
 *
 * Reads and merges global + project configs.
 * Project values override global values.
 * Never exposes or logs apiKey.
 */

import { readFileSync, existsSync } from "node:fs";
import { parse as parseJsonc } from "jsonc-parser";
import {
  globalConfigPath,
  projectConfigPath,
  resolveConfigPath,
} from "./paths.js";
import type { CbxConfig, ConfigScope, EffectiveConfig } from "./types.js";
import { logger } from "../utils/logger.js";

function readConfigFile(filePath: string): CbxConfig | null {
  if (!existsSync(filePath)) return null;
  try {
    const raw = readFileSync(filePath, "utf8");
    return parseJsonc(raw) as CbxConfig;
  } catch (err) {
    logger.warn(`Failed to parse config at ${filePath}: ${err}`);
    return null;
  }
}

/**
 * Deep merge two config objects. `override` values take precedence.
 */
function mergeConfigs(base: CbxConfig, override: CbxConfig): CbxConfig {
  const result: CbxConfig = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (
      value !== undefined &&
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      result[key] = mergeConfigs(
        (result[key] as CbxConfig) ?? {},
        value as CbxConfig,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Read config for a specific scope only.
 */
export function readScopedConfig(
  scope: ConfigScope,
  workspaceRoot?: string,
): EffectiveConfig | null {
  const configPath =
    scope === "global" ? globalConfigPath() : projectConfigPath(workspaceRoot);

  const config = readConfigFile(configPath);
  if (!config) return null;

  return { config, scope, path: configPath };
}

/**
 * Read the effective config (merged global + project, project overrides).
 * If scope is explicit ("global" or "project"), reads that scope only.
 * If scope is "auto" or omitted, merges both with project taking precedence.
 */
export function readEffectiveConfig(
  scope?: ConfigScope | "auto",
  workspaceRoot?: string,
): EffectiveConfig | null {
  // Explicit scope = read that scope only
  if (scope === "global" || scope === "project") {
    return readScopedConfig(scope, workspaceRoot);
  }

  // Auto: merge global + project
  const globalConf = readConfigFile(globalConfigPath());
  const projectPath = projectConfigPath(workspaceRoot);
  const projectConf = readConfigFile(projectPath);

  if (!globalConf && !projectConf) return null;

  const base = globalConf ?? {};
  const override = projectConf ?? {};
  const config = mergeConfigs(base, override);

  // Determine which scope is "effective"
  const resolved = resolveConfigPath("auto", workspaceRoot);

  return {
    config,
    scope: resolved.scope,
    path: resolved.path,
  };
}

/**
 * Redact apiKey values from config for safe logging/display.
 */
export function redactConfig(config: CbxConfig): CbxConfig {
  const redacted = JSON.parse(JSON.stringify(config)) as CbxConfig;
  if (redacted.postman && typeof redacted.postman === "object") {
    const postman = redacted.postman as Record<string, unknown>;
    if (typeof postman.apiKey === "string") {
      postman.apiKey = "***REDACTED***";
    }
    if (Array.isArray(postman.profiles)) {
      for (const rawProfile of postman.profiles) {
        if (!rawProfile || typeof rawProfile !== "object") continue;
        const profile = rawProfile as Record<string, unknown>;
        if (typeof profile.apiKey === "string") {
          profile.apiKey = "***REDACTED***";
        }
      }
    }
  }

  if (redacted.stitch && typeof redacted.stitch === "object") {
    const stitch = redacted.stitch as Record<string, unknown>;
    if (typeof stitch.apiKey === "string") {
      stitch.apiKey = "***REDACTED***";
    }
    if (Array.isArray(stitch.profiles)) {
      for (const rawProfile of stitch.profiles) {
        if (!rawProfile || typeof rawProfile !== "object") continue;
        const profile = rawProfile as Record<string, unknown>;
        if (typeof profile.apiKey === "string") {
          profile.apiKey = "***REDACTED***";
        }
      }
    } else if (stitch.profiles && typeof stitch.profiles === "object") {
      for (const profile of Object.values(
        stitch.profiles as Record<string, Record<string, unknown>>,
      )) {
        if (typeof profile.apiKey === "string") {
          profile.apiKey = "***REDACTED***";
        }
      }
    }
  }
  return redacted;
}
