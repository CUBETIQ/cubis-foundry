import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { packageRoot } from "../pathing.js";

function newestMtimeInTree(dirPath: string): number {
  let newest = 0;
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
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

export function assertBundledMcpBuildFreshness() {
  const root = packageRoot();
  const sourceRoot = path.join(root, "mcp", "src");
  const distEntry = path.join(root, "mcp", "dist", "index.js");
  if (!existsSync(sourceRoot)) {
    return;
  }
  if (!existsSync(distEntry)) {
    throw new Error(
      `Bundled MCP server not found at ${distEntry}. Install @cubis/foundry with bundled mcp/dist assets.`,
    );
  }
  const newestSourceMtime = newestMtimeInTree(sourceRoot);
  const distMtime = statSync(distEntry).mtimeMs;
  if (newestSourceMtime > distMtime) {
    throw new Error(
      "Bundled MCP output is stale relative to mcp/src. Rebuild with `npm run build:mcp` or `npm run build:cli` before running `cbx mcp serve`.",
    );
  }
}
