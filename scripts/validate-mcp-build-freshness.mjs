#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

function newestMtimeInTree(dirPath) {
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

const sourceRoot = path.resolve("mcp", "src");
const distEntry = path.resolve("mcp", "dist", "index.js");
if (!existsSync(sourceRoot)) {
  console.log("MCP source tree not present; skipping freshness check.");
  process.exit(0);
}
if (!existsSync(distEntry)) {
  console.error("MCP build freshness check failed: mcp/dist/index.js is missing.");
  process.exit(1);
}

const newestSourceMtime = newestMtimeInTree(sourceRoot);
const distMtime = statSync(distEntry).mtimeMs;
if (newestSourceMtime > distMtime) {
  console.error(
    "MCP build freshness check failed: mcp/dist/index.js is older than mcp/src. Rebuild with `npm run build:mcp` or `npm run build:cli`.",
  );
  process.exit(1);
}

console.log("MCP build freshness check passed.");
