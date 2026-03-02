/**
 * Cubis Foundry MCP Server – config loader.
 *
 * Reads and validates config.json at startup.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ServerConfigSchema,
  rejectCredentialFields,
  type ServerConfig,
} from "./schema.js";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// In dev (src/config/), go up 2 levels. In dist (dist/), go up 1 level.
// Detect by checking if __dirname ends with 'dist'.
const PKG_ROOT = __dirname.endsWith("dist")
  ? path.resolve(__dirname, "..")
  : path.resolve(__dirname, "../..");
const DEFAULT_CONFIG_PATH = path.resolve(PKG_ROOT, "config.json");

export function loadServerConfig(configPath?: string): ServerConfig {
  const resolved = configPath ?? DEFAULT_CONFIG_PATH;
  logger.debug(`Loading server config from ${resolved}`);

  let raw: string;
  try {
    raw = readFileSync(resolved, "utf8");
  } catch {
    throw new Error(`Cannot read server config: ${resolved}`);
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;

  // Security gate: reject credential fields
  rejectCredentialFields(parsed);

  const result = ServerConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid server config: ${result.error.message}`);
  }
  return result.data;
}
