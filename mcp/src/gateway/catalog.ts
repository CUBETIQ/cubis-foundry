/**
 * Cubis Foundry MCP Server – non-secret upstream tool catalog persistence.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ConfigScope } from "../cbxConfig/types.js";
import type { CatalogPayload, UpstreamProvider } from "./types.js";

export function resolveCatalogDir(
  scope: ConfigScope | null,
  configPath: string | null,
): string {
  if (scope === "project" && configPath) {
    return path.join(path.dirname(configPath), ".cbx", "mcp", "catalog");
  }

  return path.join(os.homedir(), ".cbx", "mcp", "catalog");
}

export function catalogFilePath(
  catalogDir: string,
  provider: UpstreamProvider,
): string {
  return path.join(catalogDir, `${provider}.tools.json`);
}

export function persistCatalog(
  catalogDir: string,
  payload: CatalogPayload,
): string {
  mkdirSync(catalogDir, { recursive: true });
  const filePath = catalogFilePath(catalogDir, payload.provider);
  writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return filePath;
}
