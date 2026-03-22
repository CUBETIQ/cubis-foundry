import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

export interface BuildFreshnessStatus {
  sourceRoot: string;
  distEntry: string;
  checked: boolean;
  fresh: boolean;
  detail: string;
}

function newestMtimeInTree(dirPath: string): number {
  let newest = 0;
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const resolved = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      newest = Math.max(newest, newestMtimeInTree(resolved));
      continue;
    }
    if (entry.isFile()) {
      newest = Math.max(newest, statSync(resolved).mtimeMs);
    }
  }
  return newest;
}

export function getBuildFreshnessStatus(
  packageRoot: string,
): BuildFreshnessStatus {
  const sourceRoot = path.join(packageRoot, "src");
  const distEntry = path.join(packageRoot, "dist", "index.js");
  if (!existsSync(sourceRoot)) {
    return {
      sourceRoot,
      distEntry,
      checked: false,
      fresh: true,
      detail: "Source tree is not present in this package layout.",
    };
  }
  if (!existsSync(distEntry)) {
    return {
      sourceRoot,
      distEntry,
      checked: true,
      fresh: false,
      detail: "Built MCP entry is missing.",
    };
  }

  const newestSourceMtime = newestMtimeInTree(sourceRoot);
  const distMtime = statSync(distEntry).mtimeMs;
  if (newestSourceMtime > distMtime) {
    return {
      sourceRoot,
      distEntry,
      checked: true,
      fresh: false,
      detail:
        "Built MCP output is older than mcp/src. Rebuild with `npm run build:mcp` or `npm run build:cli`.",
    };
  }

  return {
    sourceRoot,
    distEntry,
    checked: true,
    fresh: true,
    detail: "Built MCP output is fresh.",
  };
}

export function assertBuildFreshness(packageRoot: string): void {
  const status = getBuildFreshnessStatus(packageRoot);
  if (status.checked && !status.fresh) {
    throw new Error(status.detail);
  }
}
