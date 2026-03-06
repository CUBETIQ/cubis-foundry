/**
 * Cubis Foundry MCP Server – generated route manifest loader.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RouteManifest } from "./types.js";
import { logger } from "../utils/logger.js";

export function createEmptyRouteManifest(): RouteManifest {
  return {
    $schema: "cubis-foundry-route-manifest-v1",
    generatedAt: new Date(0).toISOString(),
    contentHash: "missing",
    summary: {
      totalRoutes: 0,
      workflows: 0,
      agents: 0,
    },
    routes: [],
  };
}

export async function loadGeneratedRouteManifest(
  mcpPackageRoot: string,
): Promise<RouteManifest> {
  const filePath = path.resolve(
    mcpPackageRoot,
    "../workflows/workflows/agent-environment-setup/generated/route-manifest.json",
  );

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as RouteManifest;
    if (!Array.isArray(parsed.routes)) {
      throw new Error("missing routes array");
    }
    return parsed;
  } catch (error) {
    logger.warn(
      `Generated route manifest unavailable at ${filePath}: ${String(error)}`,
    );
    return createEmptyRouteManifest();
  }
}
